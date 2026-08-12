/**
 * npm run validate — poarta de calitate a bazei de întrebări.
 *
 * Rulează local și în CI. Orice eșec oprește deployul: o bază de întrebări
 * stricată e un rezultat mai prost decât un deploy ratat.
 *
 * Opțiuni:
 *   --category=<id>   validează o singură categorie (util în timpul scrierii)
 *   --quiet           doar erorile și rezumatul final
 */
import { z } from 'zod';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, CATEGORY_IDS } from '../src/data/categories';
import type { CategoryId, Difficulty, Question } from '../src/data/types';
import { poolSize, selectRound } from '../src/game/select';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const args = process.argv.slice(2);
const onlyCategory = args.find((a) => a.startsWith('--category='))?.split('=')[1] as
  | CategoryId
  | undefined;
const QUIET = args.includes('--quiet');

const PER_CATEGORY = 90;
const PER_TIER = 30;
const TOTAL = PER_CATEGORY * CATEGORIES.length;
const DIFFICULTIES: Difficulty[] = ['usor', 'mediu', 'dificil'];

const failures: string[] = [];
const warnings: string[] = [];

const fail = (msg: string) => failures.push(msg);
const warn = (msg: string) => warnings.push(msg);

// ────────────────────────────────────────────────────────────── schema (zod)

const QuestionSchema = z.object({
  id: z.string().regex(/^[a-z]{3}-\d{3}$/, 'id trebuie să fie de forma "ist-001"'),
  category: z.enum(CATEGORY_IDS as [CategoryId, ...CategoryId[]]),
  difficulty: z.enum(['usor', 'mediu', 'dificil']),
  scope: z.enum(['ro', 'international']),
  question: z.string().min(10),
  options: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
  correctIndex: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  explanation: z.string().min(10),
  source: z.string().min(2).optional(),
});

// ─────────────────────────────────────────────────────────────────── helpers

const CEDILLA = /[\u015F\u0163\u015E\u0162]/g; // s/t cu sedila (U+015F etc.) - gresite in romana
const DIACRITICS = /[ăâîșțĂÂÎȘȚ]/;

function stripDiacritics(s: string): string {
  return s
    .replace(/[ăĂ]/g, 'a')
    .replace(/[âÂ]/g, 'a')
    .replace(/[îÎ]/g, 'i')
    .replace(/[șȘ\u015F\u015E]/g, 's')
    .replace(/[țȚ\u0163\u0162]/g, 't')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalize(s: string): string {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set(
  'a al ale ai as au care ce cu de din doi este el ea in intre la le lui mai mult nu o pe pentru prin sa se si sunt un una unei unui cel cea cei cele care care'.split(
    ' ',
  ),
);

function tokens(s: string): Set<string> {
  return new Set(
    normalize(s)
      .split(' ')
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100);
const fmtPct = (n: number, d: number) => `${pct(n, d).toFixed(1)}%`;

// Cuvinte care în română au OBLIGATORIU diacritice: forma fără ele e o greșeală.
const MISSING_DIACRITICS = new Set(
  `si in intre dupa cand fara catre impotriva inainte inapoi inca incet inceput incepe inceperea
   tara tarii tarile razboi razboiul razboaie stiinta stiinte stiintific stiintifica
   romania romanesc romaneasca romanesti romanii romanilor
   imparat imparatul imparateasa infiintat intemeiat intemeietor infiintarea
   asezat asezare oras orasul orase orasele judet judetul judete
   inaltime inaltimea numar numarul numere pamant pamantul sange sangele
   caine caini mancare mancarea bautura bauturi branza branzeturi paine painea
   cuvant cuvantul traditie traditii traditional sarbatoare sarbatori manastire manastiri
   competitie competitii castigat castigator castigatoare invingator invins
   inseamna insemnand invatat invatatura scoala scolile stiut adancime latime
   varsta varstnic marime marimea caldura sanatate pasare pasari
   celalalt inauntru intalnire intamplare intamplat impartit impartire
   inconjurat inconjoara inzestrat insotit insotitor inrudit inlocuit inlocuire
   invatamant intreg intreaga intregul intrebare intrebari raspuns raspunsuri
   dinastie? asa insa insusi inaltat inaltime`
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ''))
    .filter(Boolean),
);

const SUPERLATIVES = [
  'cel mai',
  'cea mai',
  'cei mai',
  'cele mai',
  'primul',
  'prima',
  'primii',
  'primele',
  'ultimul',
  'ultima',
  'ultimele',
  'singurul',
  'singura',
  'unicul',
  'record',
  'cel dintai',
];

const BANNED_PHRASES = ['toate variantele', 'niciuna dintre', 'toate cele de mai sus', 'nicio varianta'];

const NEGATION_PATTERNS = [/\bNU\b/, /\bnu este\b/i, /\bnu a fost\b/i, /\bcu excep/i, /\bnu apar/i];

function needsSource(q: Question): boolean {
  const haystack = normalize(`${q.question} ${q.options[q.correctIndex]}`);
  if (/\d/.test(`${q.question} ${q.options[q.correctIndex]}`)) return true;
  return SUPERLATIVES.some((s) => haystack.includes(s));
}

// ────────────────────────────────────────────────────────────── încărcare date

async function loadCategory(id: CategoryId): Promise<Question[]> {
  const meta = CATEGORIES.find((c) => c.id === id)!;
  const mod = (await import(`../src/data/questions/${id}.ts`)) as Record<string, unknown>;
  const key = `${meta.prefix}Questions`;
  const list = mod[key];
  if (!Array.isArray(list)) {
    fail(`${id}: modulul nu exportă "${key}" ca vector.`);
    return [];
  }
  return list as Question[];
}

// ───────────────────────────────────────────────────────────────── verificări

function checkSchema(all: Question[]) {
  for (const q of all) {
    const parsed = QuestionSchema.safeParse(q);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      fail(`[${(q as Question)?.id ?? '???'}] schemă invalidă — ${issues}`);
    }
  }
}

function checkStructure(all: Question[], full: boolean) {
  if (full && all.length !== TOTAL) fail(`Total întrebări: ${all.length}, așteptat ${TOTAL}.`);

  const ids = new Set<string>();
  for (const q of all) {
    if (ids.has(q.id)) fail(`[${q.id}] id duplicat.`);
    ids.add(q.id);

    const meta = CATEGORIES.find((c) => c.id === q.category);
    if (meta && !q.id.startsWith(`${meta.prefix}-`)) {
      fail(`[${q.id}] prefixul id-ului nu corespunde categoriei "${q.category}" (aștept "${meta.prefix}-").`);
    }

    for (const [field, value] of Object.entries(q)) {
      if (typeof value === 'string' && value.trim() !== value) {
        warn(`[${q.id}] câmpul "${field}" are spații la margini.`);
      }
      if (typeof value === 'string' && value.trim() === '') {
        fail(`[${q.id}] câmpul "${field}" este gol.`);
      }
    }

    if (!q.question.trim().endsWith('?')) fail(`[${q.id}] întrebarea nu se termină cu „?”.`);

    const folded = q.options.map((o) => normalize(o));
    if (new Set(folded).size !== 4) fail(`[${q.id}] opțiuni identice după normalizare.`);
    if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) {
      fail(`[${q.id}] opțiuni identice după trim + case-fold.`);
    }

    if (needsSource(q) && !q.source) {
      fail(`[${q.id}] necesită "source" (conține cifre / superlativ): „${q.question}”`);
    }
  }

  for (const cat of CATEGORIES) {
    const inCat = all.filter((q) => q.category === cat.id);
    if (!full && inCat.length === 0) continue;
    if (inCat.length !== PER_CATEGORY) {
      fail(`${cat.name}: ${inCat.length} întrebări, așteptat ${PER_CATEGORY}.`);
    }
    for (const d of DIFFICULTIES) {
      const n = inCat.filter((q) => q.difficulty === d).length;
      if (n !== PER_TIER) fail(`${cat.name} / ${d}: ${n} întrebări, așteptat ${PER_TIER}.`);
    }
    const expected = new Set(
      Array.from({ length: PER_CATEGORY }, (_, i) => `${cat.prefix}-${String(i + 1).padStart(3, '0')}`),
    );
    const got = new Set(inCat.map((q) => q.id));
    const missing = [...expected].filter((id) => !got.has(id));
    if (inCat.length === PER_CATEGORY && missing.length > 0) {
      warn(`${cat.name}: id-uri lipsă din secvența 001–090 (${missing.slice(0, 5).join(', ')}…).`);
    }
  }
}

function checkScope(all: Question[], full: boolean) {
  const ro = all.filter((q) => q.scope === 'ro').length;
  if (full) {
    const share = pct(ro, all.length);
    if (share < 25 || share > 35) {
      fail(`Pondere „ro” globală ${share.toFixed(1)}% — trebuie între 25% și 35%.`);
    }
  }

  for (const cat of CATEGORIES) {
    const inCat = all.filter((q) => q.category === cat.id);
    if (inCat.length === 0) continue;
    const share = pct(inCat.filter((q) => q.scope === 'ro').length, inCat.length);
    if (cat.id === 'cultura') {
      if (share !== 100) fail(`${cat.name}: trebuie 100% „ro”, are ${share.toFixed(1)}%.`);
    } else if (share < 10 || share > 35) {
      fail(`${cat.name}: pondere „ro” ${share.toFixed(1)}% — trebuie între 10% și 35%.`);
    }
  }

  if (full) {
    for (const d of DIFFICULTIES) {
      const tier = all.filter((q) => q.difficulty === d);
      const share = pct(tier.filter((q) => q.scope === 'ro').length, tier.length);
      if (share < 20 || share > 40) {
        fail(`Tier „${d}”: pondere „ro” ${share.toFixed(1)}% — trebuie între 20% și 40%.`);
      }
    }
  }
}

function checkLanguage(all: Question[]) {
  for (const q of all) {
    const blob = [q.question, ...q.options, q.explanation, q.source ?? ''].join(' ');

    const cedillas = blob.match(CEDILLA);
    if (cedillas) {
      fail(`[${q.id}] caractere cu sedilă (${[...new Set(cedillas)].join(' ')}) — folosește ș/ț cu virgulă dedesubt.`);
    }

    for (const text of [q.question, ...q.options]) {
      const words = normalize(text).split(' ');
      const offenders = words.filter((w) => MISSING_DIACRITICS.has(w) && !DIACRITICS.test(text));
      const offendersInText = words.filter((w) => MISSING_DIACRITICS.has(w));
      if (offendersInText.length > 0 && offenders.length > 0) {
        warn(`[${q.id}] posibil lipsă de diacritice („${offenders[0]}”) în: „${text}”`);
      }
    }

    if (q.question.length > 140) {
      warn(`[${q.id}] întrebare de ${q.question.length} caractere (>140): „${q.question.slice(0, 60)}…”`);
    }
    for (const o of q.options) {
      if (o.length > 60) warn(`[${q.id}] opțiune de ${o.length} caractere (>60): „${o}”`);
    }
  }
}

function checkContent(all: Question[], full: boolean) {
  // Fraze interzise
  for (const q of all) {
    const blob = normalize([q.question, ...q.options].join(' '));
    for (const phrase of BANNED_PHRASES) {
      if (blob.includes(normalize(phrase))) fail(`[${q.id}] conține fraza interzisă „${phrase}”.`);
    }
  }

  // Întrebări negative
  const negated = all.filter((q) => NEGATION_PATTERNS.some((re) => re.test(q.question)));
  const negShare = pct(negated.length, all.length);
  if (negShare > 2) {
    fail(`Întrebări negative: ${negated.length} (${negShare.toFixed(1)}%) — limita este 2%.`);
  }

  // Tell-ul de lungime
  const longestTell = (list: Question[]) =>
    list.filter((q) => {
      const lens = q.options.map((o) => o.length);
      const max = Math.max(...lens);
      return lens[q.correctIndex] === max && lens.filter((l) => l === max).length === 1;
    }).length;

  const overall = pct(longestTell(all), all.length);
  if (overall > 35) {
    fail(`Răspunsul corect este cea mai lungă opțiune în ${overall.toFixed(1)}% din cazuri (limita 35%).`);
  }
  for (const cat of CATEGORIES) {
    const inCat = all.filter((q) => q.category === cat.id);
    if (inCat.length < 30) continue;
    const share = pct(longestTell(inCat), inCat.length);
    if (share > 40) warn(`${cat.name}: tell de lungime ${share.toFixed(1)}% (peste 40%).`);
  }

  // Duplicate / cvasi-duplicate, inclusiv între categorii
  const entries = all.map((q) => ({
    q,
    t: tokens(`${q.question} ${q.options[q.correctIndex]}`),
    answer: normalize(q.options[q.correctIndex]),
  }));
  let near = 0;
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const sim = jaccard(entries[i].t, entries[j].t);
      if (sim >= 0.75) {
        fail(
          `Cvasi-duplicat (${(sim * 100).toFixed(0)}%): [${entries[i].q.id}] „${entries[i].q.question}” ↔ [${entries[j].q.id}] „${entries[j].q.question}”`,
        );
      } else if (sim >= 0.55 && entries[i].answer === entries[j].answer) {
        near += 1;
        if (near <= 15) {
          warn(
            `Posibil duplicat (${(sim * 100).toFixed(0)}%, același răspuns): [${entries[i].q.id}] ↔ [${entries[j].q.id}] „${entries[j].q.question}”`,
          );
        }
      }
    }
  }
  if (near > 15) warn(`… încă ${near - 15} perechi similare nelistate.`);

  if (full) {
    // Simulare de jucabilitate: fiecare dificultate × fiecare combinație de 3 categorii
    const combos: CategoryId[][] = [];
    for (let a = 0; a < CATEGORY_IDS.length; a += 1)
      for (let b = a + 1; b < CATEGORY_IDS.length; b += 1)
        for (let c = b + 1; c < CATEGORY_IDS.length; c += 1)
          combos.push([CATEGORY_IDS[a], CATEGORY_IDS[b], CATEGORY_IDS[c]]);

    let checked = 0;
    for (const d of DIFFICULTIES) {
      for (const combo of combos) {
        const size = poolSize(all, d, combo);
        if (size < 10) {
          fail(`Jucabilitate: ${d} × [${combo.join(', ')}] are doar ${size} întrebări.`);
          continue;
        }
        const { questions } = selectRound({ all, difficulty: d, categories: combo, seed: 1234 + checked });
        if (questions.length !== 10 || new Set(questions.map((q) => q.id)).size !== 10) {
          fail(`Jucabilitate: ${d} × [${combo.join(', ')}] nu produce 10 întrebări unice.`);
        }
        checked += 1;
      }
    }
    if (!QUIET) console.log(`  Simulare jucabilitate: ${checked} combinații dificultate × 3 categorii — OK`);
  }
}

/** Sedilele nu au voie nici în UI, nu doar în date. */
function checkSourceFilesForCedillas() {
  const roots = ['src', 'scripts', 'index.html', 'README.md'];
  const exts = new Set(['.ts', '.tsx', '.css', '.html', '.md', '.json']);
  const walk = (p: string) => {
    const abs = join(ROOT, p);
    let st;
    try {
      st = statSync(abs);
    } catch {
      return;
    }
    if (st.isDirectory()) {
      for (const entry of readdirSync(abs)) walk(join(p, entry));
      return;
    }
    if (![...exts].some((e) => p.endsWith(e))) return;
    const text = readFileSync(abs, 'utf8');
    const hits = text.match(CEDILLA);
    if (hits) {
      fail(`${relative('.', p)}: conține ${hits.length} caracter(e) cu sedilă (${[...new Set(hits)].join(' ')}).`);
    }
  };
  roots.forEach(walk);
}

// ───────────────────────────────────────────────────────────────────── raport

function report(all: Question[], full: boolean) {
  if (QUIET) return;
  const line = '─'.repeat(64);
  console.log(`\n${line}`);
  console.log('  BAZA DE ÎNTREBĂRI — REZUMAT');
  console.log(line);
  const head = 'Categorie'.padEnd(20) + 'Tot'.padStart(5) + 'Ușor'.padStart(6) + 'Mediu'.padStart(7) + 'Dificil'.padStart(9) + 'RO'.padStart(6) + 'Surse'.padStart(7);
  console.log(head);
  for (const cat of CATEGORIES) {
    const inCat = all.filter((q) => q.category === cat.id);
    if (inCat.length === 0 && !full) continue;
    const d = (x: Difficulty) => inCat.filter((q) => q.difficulty === x).length;
    const ro = inCat.filter((q) => q.scope === 'ro').length;
    const src = inCat.filter((q) => q.source).length;
    console.log(
      cat.name.padEnd(20) +
        String(inCat.length).padStart(5) +
        String(d('usor')).padStart(6) +
        String(d('mediu')).padStart(7) +
        String(d('dificil')).padStart(9) +
        fmtPct(ro, inCat.length).padStart(6) +
        String(src).padStart(7),
    );
  }
  console.log(line);
  const ro = all.filter((q) => q.scope === 'ro').length;
  console.log(
    'TOTAL'.padEnd(20) +
      String(all.length).padStart(5) +
      String(all.filter((q) => q.difficulty === 'usor').length).padStart(6) +
      String(all.filter((q) => q.difficulty === 'mediu').length).padStart(7) +
      String(all.filter((q) => q.difficulty === 'dificil').length).padStart(9) +
      fmtPct(ro, all.length).padStart(6) +
      String(all.filter((q) => q.source).length).padStart(7),
  );

  const positions = [0, 1, 2, 3].map((i) => all.filter((q) => q.correctIndex === i).length);
  console.log(`\n  Poziția răspunsului corect (în date): ${positions.map((n, i) => `${i + 1}=${fmtPct(n, all.length)}`).join('  ')}`);
  console.log('  (amestecarea la rulare face distribuția pur cosmetică)');

  const tell = all.filter((q) => {
    const lens = q.options.map((o) => o.length);
    const max = Math.max(...lens);
    return lens[q.correctIndex] === max && lens.filter((l) => l === max).length === 1;
  }).length;
  console.log(`  Răspuns corect = cea mai lungă opțiune: ${fmtPct(tell, all.length)} (prag 35%)`);

  const negated = all.filter((q) => NEGATION_PATTERNS.some((re) => re.test(q.question))).length;
  console.log(`  Întrebări negative: ${negated} (${fmtPct(negated, all.length)}, prag 2%)`);

  const qLens = all.map((q) => q.question.length);
  const oLens = all.flatMap((q) => q.options.map((o) => o.length));
  if (qLens.length > 0) {
    console.log(
      `  Lungimi — întrebare medie ${(qLens.reduce((a, b) => a + b, 0) / qLens.length).toFixed(0)}, max ${Math.max(...qLens)}; opțiune medie ${(oLens.reduce((a, b) => a + b, 0) / oLens.length).toFixed(0)}, max ${Math.max(...oLens)}`,
    );
  }

  console.log('\n  Lungimea opțiunilor pe categorie (medie / max):');
  for (const cat of CATEGORIES) {
    const inCat = all.filter((q) => q.category === cat.id);
    if (inCat.length === 0) continue;
    const lens = inCat.flatMap((q) => q.options.map((o) => o.length));
    console.log(
      `    ${cat.name.padEnd(20)} ${(lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(1).padStart(5)} / ${String(Math.max(...lens)).padStart(3)}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────── main

async function main() {
  const full = !onlyCategory;
  const targets = onlyCategory ? [onlyCategory] : CATEGORY_IDS;

  if (onlyCategory && !CATEGORY_IDS.includes(onlyCategory)) {
    console.error(`Categorie necunoscută: ${onlyCategory}. Valide: ${CATEGORY_IDS.join(', ')}`);
    process.exit(2);
  }

  const all: Question[] = [];
  for (const id of targets) all.push(...(await loadCategory(id)));

  checkSchema(all);
  checkStructure(all, full);
  checkScope(all, full);
  checkLanguage(all);
  checkContent(all, full);
  checkSourceFilesForCedillas();

  report(all, full);

  if (warnings.length > 0 && !QUIET) {
    console.log(`\n  ⚠ AVERTISMENTE (${warnings.length}):`);
    warnings.slice(0, 60).forEach((w) => console.log(`    · ${w}`));
    if (warnings.length > 60) console.log(`    … încă ${warnings.length - 60}`);
  }

  if (failures.length > 0) {
    console.log(`\n  ✖ EȘECURI (${failures.length}):`);
    failures.slice(0, 80).forEach((f) => console.log(`    · ${f}`));
    if (failures.length > 80) console.log(`    … încă ${failures.length - 80}`);
    console.log('\n  Validare EȘUATĂ.\n');
    process.exit(1);
  }

  console.log(`\n  ✔ Validare trecută${onlyCategory ? ` (doar ${onlyCategory})` : ''} — ${all.length} întrebări, ${warnings.length} avertismente.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
