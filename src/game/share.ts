import { CATEGORY_IDS } from '../data/categories';
import type { CategoryId, Difficulty } from '../data/types';

export type SharePayload = {
  difficulty: Difficulty;
  categories: CategoryId[];
  seed: number;
  questionIds: string[];
  /** null = provocare trimisă înainte de final, fără scor de bătut. */
  score: number | null;
};

const DIFF_CODE: Record<Difficulty, string> = { copii: 'j', usor: 'u', mediu: 'm', dificil: 'd' };
const CODE_DIFF: Record<string, Difficulty> = { j: 'copii', u: 'usor', m: 'mediu', d: 'dificil' };
const VERSION = '1';

function toBase64Url(input: string): string {
  const b64 = typeof btoa === 'function' ? btoa(input) : Buffer.from(input, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string | null {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  } catch {
    return null;
  }
}

/** Codifică runda terminată într-un șir compact, sigur pentru URL. */
export function encodeShare(payload: SharePayload): string {
  const cats = payload.categories
    .map((c) => CATEGORY_IDS.indexOf(c))
    .filter((i) => i >= 0)
    .join('.');
  const raw = [
    VERSION,
    DIFF_CODE[payload.difficulty],
    cats,
    payload.seed.toString(36),
    payload.questionIds.join('.'),
    payload.score === null ? '' : String(payload.score),
  ].join('|');
  return toBase64Url(raw);
}

export function decodeShare(token: string): SharePayload | null {
  const raw = fromBase64Url(token);
  if (!raw) return null;
  const parts = raw.split('|');
  if (parts.length !== 6 || parts[0] !== VERSION) return null;
  const difficulty = CODE_DIFF[parts[1]];
  if (!difficulty) return null;

  const categories = parts[2]
    .split('.')
    .filter(Boolean)
    .map((i) => CATEGORY_IDS[Number(i)])
    .filter((c): c is CategoryId => Boolean(c));

  const seed = Number.parseInt(parts[3], 36);
  if (!Number.isFinite(seed)) return null;

  const questionIds = parts[4].split('.').filter(Boolean);
  if (questionIds.length === 0) return null;

  const score = parts[5] === '' ? null : Number.parseInt(parts[5], 10);
  if (score !== null && !Number.isFinite(score)) return null;

  return { difficulty, categories, seed, questionIds, score };
}

export function shareUrl(payload: SharePayload, origin: string): string {
  const base = origin.replace(/#.*$/, '').replace(/\?.*$/, '');
  return `${base}#p=${encodeShare(payload)}`;
}

export function readShareToken(hash: string): string | null {
  const match = /(?:^#|&)p=([A-Za-z0-9_-]+)/.exec(hash);
  return match ? match[1] : null;
}
