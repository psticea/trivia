/**
 * Rescrie un fișier de întrebări în forma canonică: obiecte literale, un câmp
 * pe linie, în ordinea din tip. Unele fișiere au fost scrise cu funcții-ajutor
 * cu argumente poziționale, care sunt greu de corectat manual — iar README-ul
 * promite că oricine poate repara o întrebare deschizând fișierul.
 *
 *   npx tsx scripts/normalize.ts <category-id>
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from '../src/data/categories';
import type { CategoryId, Question } from '../src/data/types';

const target = process.argv[2] as CategoryId | undefined;
if (!target) {
  console.error('Utilizare: npx tsx scripts/normalize.ts <category-id>');
  process.exit(2);
}

const meta = CATEGORIES.find((c) => c.id === target);
if (!meta) {
  console.error(`Categorie necunoscută: ${target}`);
  process.exit(2);
}

const mod = (await import(`../src/data/questions/${target}.ts`)) as Record<string, unknown>;
const list = mod[`${meta.prefix}Questions`] as Question[] | undefined;
if (!Array.isArray(list)) {
  console.error(`Modulul nu exportă ${meta.prefix}Questions.`);
  process.exit(1);
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const HEADINGS: Record<string, string> = {
  usor: '  // ── Ușor ──',
  mediu: '  // ── Mediu ──',
  dificil: '  // ── Dificil ──',
};

const parts: string[] = [`import type { Question } from '../types';`, '', `export const ${meta.prefix}Questions: Question[] = [`];

let lastDifficulty = '';
for (const q of list) {
  if (q.difficulty !== lastDifficulty) {
    if (lastDifficulty !== '') parts.push('');
    parts.push(HEADINGS[q.difficulty] ?? '');
    lastDifficulty = q.difficulty;
  }
  const lines = [
    '  {',
    `    id: '${esc(q.id)}',`,
    `    category: '${esc(q.category)}',`,
    `    difficulty: '${esc(q.difficulty)}',`,
    `    region: '${esc(q.region)}',`,
    `    question: '${esc(q.question)}',`,
    `    options: [${q.options.map((o) => `'${esc(o)}'`).join(', ')}],`,
    `    correctIndex: ${q.correctIndex},`,
    `    explanation: '${esc(q.explanation)}',`,
  ];
  if (q.source) lines.push(`    source: '${esc(q.source)}',`);
  lines.push('  },');
  parts.push(...lines);
}

parts.push('];', '');

const out = fileURLToPath(new URL(`../src/data/questions/${target}.ts`, import.meta.url));
writeFileSync(out, parts.join('\n'), 'utf8');
console.log(`${target}: ${list.length} întrebări rescrise în formă canonică.`);
