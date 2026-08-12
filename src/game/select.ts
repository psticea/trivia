import type { CategoryId, Difficulty, Question } from '../data/types';
import { mulberry32, shuffle, type Rng } from './rng';

export const ROUND_SIZE = 10;
export const ROUND_SIZES = [10, 20] as const;
export type RoundSize = (typeof ROUND_SIZES)[number];
export const MIN_CATEGORIES = 3;

export type SeenMap = Record<string, number>;

export type SelectionInput = {
  all: readonly Question[];
  difficulty: Difficulty;
  categories: readonly CategoryId[];
  /** id întrebare -> contor de ordine în care a fost văzută (mai mic = mai veche). */
  seen?: SeenMap;
  count?: number;
  seed: number;
};

export type SelectionResult = {
  questions: Question[];
  /** true dacă rezerva de întrebări nevăzute s-a epuizat și s-a resetat tierul. */
  exhausted: boolean;
};

/**
 * Împarte `count` cât mai uniform peste `buckets`, restul mergând la
 * categorii alese aleator (altfel aceleași categorii primesc mereu în plus).
 */
export function allocate(count: number, buckets: number, rng: Rng): number[] {
  if (buckets <= 0) return [];
  const base = Math.floor(count / buckets);
  const remainder = count - base * buckets;
  const alloc = new Array<number>(buckets).fill(base);
  const order = shuffle(
    Array.from({ length: buckets }, (_, i) => i),
    rng,
  );
  for (let i = 0; i < remainder; i += 1) alloc[order[i]] += 1;
  return alloc;
}

/**
 * Alege întrebările unei runde: pool filtrat, stratificat pe categorii,
 * preferând întrebările nevăzute, apoi pe cele văzute cel mai demult.
 */
export function selectRound(input: SelectionInput): SelectionResult {
  const { all, difficulty, categories, seen = {}, seed } = input;
  const count = input.count ?? ROUND_SIZE;
  const rng = mulberry32(seed);

  const active = categories.length > 0 ? categories : [];
  const pool = all.filter((q) => q.difficulty === difficulty && active.includes(q.category));

  if (pool.length === 0) return { questions: [], exhausted: false };

  const byCategory = new Map<CategoryId, Question[]>();
  for (const cat of active) byCategory.set(cat, []);
  for (const q of pool) byCategory.get(q.category)?.push(q);

  // Categoriile fără întrebări nu primesc alocare.
  const usable = active.filter((c) => (byCategory.get(c)?.length ?? 0) > 0);
  const wanted = Math.min(count, pool.length);

  // Dacă întregul tier a fost văzut, resetăm evidența pentru acest pool.
  const unseenTotal = pool.filter((q) => seen[q.id] === undefined).length;
  const exhausted = unseenTotal < wanted;
  const effectiveSeen: SeenMap = exhausted ? {} : seen;

  let alloc = allocate(wanted, usable.length, rng);

  const picked: Question[] = [];
  const leftovers: Question[] = [];

  usable.forEach((cat, i) => {
    const bucket = byCategory.get(cat) ?? [];
    const ranked = rankCandidates(bucket, effectiveSeen, rng);
    const take = Math.min(alloc[i], ranked.length);
    picked.push(...ranked.slice(0, take));
    leftovers.push(...ranked.slice(take));
  });

  // Redistribuim ce n-a putut fi acoperit de categoriile sărace.
  if (picked.length < wanted) {
    const rest = rankCandidates(leftovers, effectiveSeen, rng);
    for (const q of rest) {
      if (picked.length >= wanted) break;
      picked.push(q);
    }
  }

  alloc = [];
  return { questions: shuffle(picked.slice(0, wanted), rng), exhausted };
}

/** Nevăzutele primele (în ordine aleatoare), apoi văzutele, cele mai vechi întâi. */
function rankCandidates(bucket: readonly Question[], seen: SeenMap, rng: Rng): Question[] {
  const unseen: Question[] = [];
  const seenOnes: Question[] = [];
  for (const q of bucket) {
    if (seen[q.id] === undefined) unseen.push(q);
    else seenOnes.push(q);
  }
  seenOnes.sort((a, b) => (seen[a.id] ?? 0) - (seen[b.id] ?? 0));
  return [...shuffle(unseen, rng), ...seenOnes];
}

/** Câte întrebări sunt disponibile pentru o combinație dificultate × categorii. */
export function poolSize(
  all: readonly Question[],
  difficulty: Difficulty,
  categories: readonly CategoryId[],
): number {
  let n = 0;
  for (const q of all) {
    if (q.difficulty === difficulty && categories.includes(q.category)) n += 1;
  }
  return n;
}
