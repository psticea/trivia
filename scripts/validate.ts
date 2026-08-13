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
import { REGIONS, type CategoryId, type Difficulty, type Question, type Region } from '../src/data/types';
import { poolSize, ROUND_SIZES, selectRound } from '../src/game/select';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const args = process.argv.slice(2);
const onlyCategory = args.find((a) => a.startsWith('--category='))?.split('=')[1] as
  | CategoryId
  | undefined;
const QUIET = args.includes('--quiet');

const PER_CATEGORY = 200;
const PER_TIER = 50;
const TOTAL = PER_CATEGORY * CATEGORIES.length;
const DIFFICULTIES: Difficulty[] = ['copii', 'usor', 'mediu', 'dificil'];

/**
 * Ținta de regiuni, per categorie și per nivel. Jucătorii sunt din România,
 * deci baza e construită dinspre ce cunosc: întâi țara, apoi Europa, apoi
 * America de Nord, apoi restul lumii.
 *
 * La nivelul „copii” ponderea locală urcă: un copil de 9 ani știe mult mai
 * bine ce e în jurul lui decât ce e la celălalt capăt al lumii.
 */
const REGION_TARGET_ADULT: Record<CategoryId, Record<Region, number>> = {
  istorie: { ro: 45, europa: 45, america_nord: 30, restul_lumii: 30, universal: 0 },
  geografie: { ro: 45, europa: 45, america_nord: 30, restul_lumii: 30, universal: 0 },
  stiinta: { ro: 30, europa: 40, america_nord: 30, restul_lumii: 15, universal: 35 },
  arta: { ro: 45, europa: 50, america_nord: 30, restul_lumii: 25, universal: 0 },
  muzica: { ro: 45, europa: 45, america_nord: 33, restul_lumii: 17, universal: 10 },
  film: { ro: 45, europa: 45, america_nord: 40, restul_lumii: 20, universal: 0 },
  sport: { ro: 45, europa: 45, america_nord: 30, restul_lumii: 30, universal: 0 },
  tehnologie: { ro: 40, europa: 40, america_nord: 40, restul_lumii: 15, universal: 15 },
  gastronomie: { ro: 45, europa: 45, america_nord: 25, restul_lumii: 35, universal: 0 },
  religie: { ro: 45, europa: 40, america_nord: 15, restul_lumii: 45, universal: 5 },
};

const REGION_TARGET_KIDS: Record<CategoryId, Record<Region, number>> = {
  istorie: { ro: 20, europa: 14, america_nord: 8, restul_lumii: 8, universal: 0 },
  geografie: { ro: 20, europa: 14, america_nord: 8, restul_lumii: 8, universal: 0 },
  stiinta: { ro: 10, europa: 8, america_nord: 6, restul_lumii: 6, universal: 20 },
  arta: { ro: 20, europa: 16, america_nord: 8, restul_lumii: 6, universal: 0 },
  muzica: { ro: 20, europa: 14, america_nord: 8, restul_lumii: 4, universal: 4 },
  film: { ro: 18, europa: 12, america_nord: 14, restul_lumii: 6, universal: 0 },
  sport: { ro: 20, europa: 14, america_nord: 8, restul_lumii: 8, universal: 0 },
  tehnologie: { ro: 16, europa: 12, america_nord: 12, restul_lumii: 4, universal: 6 },
  gastronomie: { ro: 20, europa: 14, america_nord: 6, restul_lumii: 10, universal: 0 },
  religie: { ro: 20, europa: 14, america_nord: 4, restul_lumii: 12, universal: 0 },
};

const REGION_TARGET: Record<CategoryId, Record<Region, number>> = Object.fromEntries(
  CATEGORY_IDS.map((id) => [
    id,
    Object.fromEntries(
      REGIONS.map((r) => [r, REGION_TARGET_ADULT[id][r] + REGION_TARGET_KIDS[id][r]]),
    ) as Record<Region, number>,
  ]),
) as Record<CategoryId, Record<Region, number>>;

const REGION_TOLERANCE = 8;

const failures: string[] = [];
const warnings: string[] = [];

const fail = (msg: string) => failures.push(msg);
const warn = (msg: string) => warnings.push(msg);

// ────────────────────────────────────────────────────────────── schema (zod)

const QuestionSchema = z.object({
  id: z.string().regex(/^[a-z]{3}-\d{3}$/, 'id trebuie să fie de forma "ist-001"'),
  category: z.enum(CATEGORY_IDS as [CategoryId, ...CategoryId[]]),
  difficulty: z.enum(['copii', 'usor', 'mediu', 'dificil']),
  region: z.enum(REGIONS as [Region, ...Region[]]),
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
  `a al ale ai as au care ce cu de din doi este el ea in intre la le lui mai mult nu o pe pentru
   prin sa se si sunt un una unei unui cel cea cei cele dintre dupa fost face fi era erau catre
   sau dar iar numit numita numite cunoscut cunoscuta primul prima anul secolul`
    .split(/\s+/)
    .filter(Boolean),
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
   varsta varstnic marime marimea caldura sanatate pasare pasari zeita zeul zeii
   celalalt inauntru intalnire intamplare intamplat impartit impartire credinta credinte
   inconjurat inconjoara inzestrat insotit insotitor inrudit inlocuit inlocuire
   invatamant intreg intreaga intregul intrebare intrebari raspuns raspunsuri
   asa insa insusi inaltat inaltime`
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

/**
 * Cuvintele din răspunsul corect care apar și în întrebare, dar în niciuna
 * dintre variantele greșite. Astea transformă întrebarea într-un cadou:
 * jucătorul potrivește cuvântul, nu răspunde la întrebare.
 */
function giveawayTokens(q: Question): string[] {
  const inQuestion = tokens(q.question);
  const correct = tokens(q.options[q.correctIndex]);
  const distractorTokens = new Set<string>();
  q.options.forEach((opt, i) => {
    if (i === q.correctIndex) return;
    for (const t of tokens(opt)) distractorTokens.add(t);
  });

  const leaks: string[] = [];
  for (const t of correct) {
    if (t.length < 4) continue;
    if (inQuestion.has(t) && !distractorTokens.has(t)) leaks.push(t);
  }
  return leaks;
}

/**
 * Varianta mai slabă a aceleiași probleme: nu același cuvânt, ci aceeași
 * rădăcină — „Pasteur” în întrebare și „pasteurizarea” în răspuns, „Francisc
 * din Assisi” și „Franciscanii”. Uneori e legitim (rădăcina e substantivul
 * generic: „Ce mare…” → „Marea Baltică”), așa că doar avertizează.
 */
function stemLeaks(q: Question): string[] {
  const stem = (w: string) => w.slice(0, 6);
  const qStems = new Set([...tokens(q.question)].filter((w) => w.length >= 6).map(stem));
  const dStems = new Set(
    q.options
      .flatMap((opt, i) => (i === q.correctIndex ? [] : [...tokens(opt)]))
      .filter((w) => w.length >= 6)
      .map(stem),
  );
  const exact = new Set(giveawayTokens(q));

  const leaks: string[] = [];
  for (const t of tokens(q.options[q.correctIndex])) {
    if (t.length < 6 || exact.has(t)) continue;
    if (qStems.has(stem(t)) && !dStems.has(stem(t))) leaks.push(t);
  }
  return leaks;
}

// ────────────────────────────────────────────────────────────── încărcare date

async function loadCategory(id: CategoryId): Promise<Question[]> {
  const meta = CATEGORIES.find((c) => c.id === id)!;
  const out: Question[] = [];

  const mod = (await import(`../src/data/questions/${id}.ts`)) as Record<string, unknown>;
  const adults = mod[`${meta.prefix}Questions`];
  if (!Array.isArray(adults)) {
    fail(`${id}: modulul nu exportă "${meta.prefix}Questions" ca vector.`);
  } else {
    out.push(...(adults as Question[]));
  }

  const kidsMod = (await import(`../src/data/questions/copii/${id}.ts`)) as Record<string, unknown>;
  const kids = kidsMod[`${meta.prefix}CopiiQuestions`];
  if (!Array.isArray(kids)) {
    fail(`${id}: modulul pentru copii nu exportă "${meta.prefix}CopiiQuestions" ca vector.`);
  } else {
    for (const q of kids as Question[]) {
      if (q.difficulty !== 'copii') {
        fail(`[${q.id}] se află în fișierul pentru copii, dar are dificultatea "${q.difficulty}".`);
      }
    }
    out.push(...(kids as Question[]));
  }

  return out;
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
      warn(`${cat.name}: id-uri lipsă din secvența 001–${PER_CATEGORY} (${missing.slice(0, 5).join(', ')}…).`);
    }
  }
}

function checkRegions(all: Question[], full: boolean) {
  for (const cat of CATEGORIES) {
    const inCat = all.filter((q) => q.category === cat.id);
    if (inCat.length === 0) continue;
    const target = REGION_TARGET[cat.id];
    for (const region of REGIONS) {
      const got = inCat.filter((q) => q.region === region).length;
      const want = target[region];
      if (Math.abs(got - want) > REGION_TOLERANCE) {
        fail(
          `${cat.name} / ${region}: ${got} întrebări, țintă ${want} (toleranță ±${REGION_TOLERANCE}).`,
        );
      }
    }
  }

  if (!full) return;

  // Ținta globală: ~30% România, ~30% Europa, ~20% America de Nord, restul lumea.
  const bands: Record<Region, [number, number]> = {
    ro: [26, 34],
    europa: [26, 34],
    america_nord: [16, 24],
    restul_lumii: [13, 22],
    universal: [0, 9],
  };
  for (const region of REGIONS) {
    const share = pct(all.filter((q) => q.region === region).length, all.length);
    const [lo, hi] = bands[region];
    if (share < lo || share > hi) {
      fail(`Pondere globală „${region}”: ${share.toFixed(1)}% — trebuie între ${lo}% și ${hi}%.`);
    }
  }

  // România trebuie să fie prezentă în fiecare tier, nu doar la întrebările ușoare.
  // La „copii” ponderea locală e deliberat mai mare: un copil de 9 ani cunoaște
  // mult mai bine ce e în jurul lui.
  for (const d of DIFFICULTIES) {
    const tier = all.filter((q) => q.difficulty === d);
    if (tier.length === 0) continue;
    const share = pct(tier.filter((q) => q.region === 'ro').length, tier.length);
    const [lo, hi] = d === 'copii' ? [28, 46] : [22, 38];
    if (share < lo || share > hi) {
      fail(`Tier „${d}”: pondere „ro” ${share.toFixed(1)}% — trebuie între ${lo}% și ${hi}%.`);
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

  // Răspunsul nu are voie să fie cadou: cuvântul-cheie repetat din întrebare.
  for (const q of all) {
    const leaks = giveawayTokens(q);
    if (leaks.length > 0) {
      fail(
        `[${q.id}] răspunsul se ghicește din întrebare — „${leaks.join(', ')}” apare și în întrebare, dar în nicio variantă greșită: „${q.question}” → „${q.options[q.correctIndex]}”`,
      );
    }
    const stems = stemLeaks(q);
    if (stems.length > 0) {
      warn(
        `[${q.id}] rădăcină comună cu întrebarea („${stems.join(', ')}”) — verifică dacă răspunsul se ghicește: „${q.question}” → „${q.options[q.correctIndex]}”`,
      );
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
    // Simulare de jucabilitate: fiecare dificultate × fiecare combinație de 3 categorii,
    // pentru ambele lungimi de rundă oferite în interfață.
    const combos: CategoryId[][] = [];
    for (let a = 0; a < CATEGORY_IDS.length; a += 1)
      for (let b = a + 1; b < CATEGORY_IDS.length; b += 1)
        for (let c = b + 1; c < CATEGORY_IDS.length; c += 1)
          combos.push([CATEGORY_IDS[a], CATEGORY_IDS[b], CATEGORY_IDS[c]]);

    let checked = 0;
    for (const size of ROUND_SIZES) {
      for (const d of DIFFICULTIES) {
        for (const combo of combos) {
          const available = poolSize(all, d, combo);
          if (available < size) {
            fail(`Jucabilitate: ${d} × [${combo.join(', ')}] are doar ${available} întrebări, sub ${size}.`);
            continue;
          }
          const { questions } = selectRound({
            all,
            difficulty: d,
            categories: combo,
            seed: 1234 + checked,
            count: size,
          });
          if (questions.length !== size || new Set(questions.map((q) => q.id)).size !== size) {
            fail(`Jucabilitate: ${d} × [${combo.join(', ')}] nu produce ${size} întrebări unice.`);
          }
          checked += 1;
        }
      }
    }
    if (!QUIET) {
      console.log(
        `  Simulare jucabilitate: ${checked} combinații (dificultate × 3 categorii × lungime de rundă) — OK`,
      );
    }
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

const REGION_SHORT: Record<Region, string> = {
  ro: 'RO',
  europa: 'EU',
  america_nord: 'AmN',
  restul_lumii: 'Rest',
  universal: 'Univ',
};

function report(all: Question[], full: boolean) {
  if (QUIET) return;
  const line = '─'.repeat(78);
  console.log(`\n${line}`);
  console.log('  BAZA DE ÎNTREBĂRI — REZUMAT');
  console.log(line);
  const head =
    'Categorie'.padEnd(20) +
    'Tot'.padStart(5) +
    'Copii'.padStart(7) +
    'Ușor'.padStart(6) +
    'Mediu'.padStart(7) +
    'Dific'.padStart(7) +
    REGIONS.map((r) => REGION_SHORT[r].padStart(6)).join('') +
    'Surse'.padStart(7);
  console.log(head);
  for (const cat of CATEGORIES) {
    const inCat = all.filter((q) => q.category === cat.id);
    if (inCat.length === 0 && !full) continue;
    const d = (x: Difficulty) => inCat.filter((q) => q.difficulty === x).length;
    const src = inCat.filter((q) => q.source).length;
    console.log(
      cat.name.padEnd(20) +
        String(inCat.length).padStart(5) +
        String(d('copii')).padStart(7) +
        String(d('usor')).padStart(6) +
        String(d('mediu')).padStart(7) +
        String(d('dificil')).padStart(7) +
        REGIONS.map((r) => String(inCat.filter((q) => q.region === r).length).padStart(6)).join('') +
        String(src).padStart(7),
    );
  }
  console.log(line);
  console.log(
    'TOTAL'.padEnd(20) +
      String(all.length).padStart(5) +
      String(all.filter((q) => q.difficulty === 'copii').length).padStart(7) +
      String(all.filter((q) => q.difficulty === 'usor').length).padStart(6) +
      String(all.filter((q) => q.difficulty === 'mediu').length).padStart(7) +
      String(all.filter((q) => q.difficulty === 'dificil').length).padStart(7) +
      REGIONS.map((r) => String(all.filter((q) => q.region === r).length).padStart(6)).join('') +
      String(all.filter((q) => q.source).length).padStart(7),
  );

  console.log(
    '\n  Pondere pe regiuni: ' +
      REGIONS.map((r) => `${REGION_SHORT[r]} ${fmtPct(all.filter((q) => q.region === r).length, all.length)}`).join(
        '  ',
      ),
  );

  const positions = [0, 1, 2, 3].map((i) => all.filter((q) => q.correctIndex === i).length);
  console.log(
    `  Poziția răspunsului corect (în date): ${positions.map((n, i) => `${i + 1}=${fmtPct(n, all.length)}`).join('  ')}`,
  );

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
  checkRegions(all, full);
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

  console.log(
    `\n  ✔ Validare trecută${onlyCategory ? ` (doar ${onlyCategory})` : ''} — ${all.length} întrebări, ${warnings.length} avertismente.\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
