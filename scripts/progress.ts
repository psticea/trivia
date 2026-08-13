/**
 * Raport rapid de progres în timpul scrierii: câte întrebări are fiecare fișier,
 * cum stau dificultățile și regiunile. Nu validează nimic — pentru asta e validate.ts.
 */
import { CATEGORIES } from '../src/data/categories';
import { REGIONS, type Difficulty, type Question } from '../src/data/types';

const DIFFS: Difficulty[] = ['usor', 'mediu', 'dificil'];

let total = 0;
const rows: string[] = [];

for (const cat of CATEGORIES) {
  let list: Question[] = [];
  try {
    const mod = (await import(`../src/data/questions/${cat.id}.ts`)) as Record<string, unknown>;
    const found = mod[`${cat.prefix}Questions`];
    if (Array.isArray(found)) list = found as Question[];
  } catch (err) {
    rows.push(`${cat.name.padEnd(20)} EROARE: ${(err as Error).message.slice(0, 60)}`);
    continue;
  }
  total += list.length;
  const d = DIFFS.map((x) => list.filter((q) => q.difficulty === x).length).join('/');
  const r = REGIONS.map((x) => String(list.filter((q) => q.region === x).length).padStart(4)).join('');
  const mark = list.length === 150 ? '✔' : ' ';
  rows.push(`${mark} ${cat.name.padEnd(20)}${String(list.length).padStart(5)}   ${d.padEnd(12)}${r}`);
}

console.log(`\n  ${'Domeniu'.padEnd(22)}${'Tot'.padStart(5)}   ${'U/M/D'.padEnd(12)}${REGIONS.map((r) => r.slice(0, 4).padStart(4)).join('')}`);
console.log('  ' + '─'.repeat(64));
rows.forEach((r) => console.log('  ' + r));
console.log('  ' + '─'.repeat(64));
console.log(`  TOTAL: ${total} / 1500\n`);
