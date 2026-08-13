import { CATEGORY_IDS, isKnownCategory } from '../data/categories';
import { QUESTIONS } from '../data';
import type { CategoryId, Difficulty } from '../data/types';
import { DIFFICULTIES } from '../data/types';
import { emptyStats, type Stats } from './scoring';
import { KEYS, readJson, removeKey, STORAGE_VERSION, writeJson } from './storage';
import { ROUND_SIZE, ROUND_SIZES, type RoundSize, type SeenMap } from './select';

/**
 * Curățarea datelor salvate în browser.
 *
 * Baza de întrebări se schimbă între ediții: categorii dispar, id-uri se
 * renumerotează. Datele rămase de la ediția precedentă nu au voie să dea peste
 * cap aplicația — a fost exact cauza unui ecran negru, când o categorie ștearsă
 * a rămas în statistici și căutarea numelui ei a aruncat la prima randare.
 *
 * Regula: la citire, tot ce vine din localStorage e considerat nesigur.
 */

export function sanitizeDifficulty(value: unknown): Difficulty {
  return (DIFFICULTIES as string[]).includes(value as string) ? (value as Difficulty) : 'mediu';
}

export function sanitizeCategories(value: unknown): CategoryId[] {
  if (!Array.isArray(value)) return [...CATEGORY_IDS];
  const clean = value.filter((c): c is CategoryId => typeof c === 'string' && isKnownCategory(c));
  const ordered = CATEGORY_IDS.filter((c) => clean.includes(c));
  return ordered.length >= 3 ? ordered : [...CATEGORY_IDS];
}

export function sanitizeRoundSize(value: unknown): RoundSize {
  return (ROUND_SIZES as readonly number[]).includes(value as number) ? (value as RoundSize) : ROUND_SIZE;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Statisticile salvate pot conține categorii scoase din joc și, dacă vin de
 * dinainte de rundele de 20, le lipsește `bestTotal`. Pe atunci exista o
 * singură lungime de rundă, deci recordul era din 10.
 */
export function sanitizeStats(value: unknown): Stats {
  const base = emptyStats();
  if (!value || typeof value !== 'object') return base;
  const stored = value as Partial<Stats>;

  const byDifficulty = { ...base.byDifficulty };
  for (const tier of DIFFICULTIES) {
    const s = stored.byDifficulty?.[tier];
    if (!s || typeof s !== 'object') continue;
    const rounds = num(s.rounds);
    byDifficulty[tier] = {
      rounds,
      totalCorrect: num(s.totalCorrect),
      totalQuestions: num(s.totalQuestions),
      best: num(s.best),
      bestTotal: num(s.bestTotal, rounds > 0 ? ROUND_SIZE : 0),
    };
  }

  const byCategory: Stats['byCategory'] = {};
  const storedCategories = stored.byCategory;
  if (storedCategories && typeof storedCategories === 'object') {
    for (const [key, entry] of Object.entries(storedCategories)) {
      // Categoriile dispărute între ediții se aruncă, nu se păstrează „orfane”.
      if (!isKnownCategory(key) || !entry || typeof entry !== 'object') continue;
      byCategory[key] = { correct: num(entry.correct), total: num(entry.total) };
    }
  }

  return { byDifficulty, byCategory };
}

/** Evidența întrebărilor văzute păstrează doar id-uri care mai există. */
export function sanitizeSeen(value: unknown): SeenMap {
  if (!value || typeof value !== 'object') return {};
  const known = new Set(QUESTIONS.map((q) => q.id));
  const out: SeenMap = {};
  for (const [id, order] of Object.entries(value as Record<string, unknown>)) {
    if (known.has(id) && typeof order === 'number' && Number.isFinite(order)) out[id] = order;
  }
  return out;
}

/**
 * Rulează o singură dată, înainte ca aplicația să citească ceva.
 * Rescrie datele în forma curată și marchează versiunea, ca migrarea să nu se
 * repete la fiecare pornire.
 */
export function migrateStoredData(): void {
  const stored = readJson<number>(KEYS.version, 0);
  if (stored === STORAGE_VERSION) return;

  // Ediția a doua a rescris toată baza de întrebări și a schimbat domeniile.
  // O selecție salvată înainte nu poate conține domeniul nou, așa că jucătorii
  // vechi ar rămâne fără el fără să afle vreodată. Repornim de la toate.
  writeJson(KEYS.categories, [...CATEGORY_IDS]);
  writeJson(KEYS.difficulty, sanitizeDifficulty(readJson<unknown>(KEYS.difficulty, null)));
  writeJson(KEYS.roundSize, sanitizeRoundSize(readJson<unknown>(KEYS.roundSize, null)));
  writeJson(KEYS.stats, sanitizeStats(readJson<unknown>(KEYS.stats, null)));

  const seen = sanitizeSeen(readJson<unknown>(KEYS.seen, null));
  writeJson(KEYS.seen, seen);
  // Contorul trebuie să rămână peste ordinele păstrate, altfel „cel mai vechi
  // văzut” se calculează greșit la reluarea întrebărilor.
  const maxOrder = Object.values(seen).reduce((m, v) => Math.max(m, v), 0);
  writeJson(KEYS.seenCounter, Math.max(maxOrder, num(readJson<unknown>(KEYS.seenCounter, 0))));

  if (typeof readJson<unknown>(KEYS.timer, null) !== 'boolean') removeKey(KEYS.timer);

  writeJson(KEYS.version, STORAGE_VERSION);
}
