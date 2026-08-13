/** Acces tolerant la localStorage: modul privat / storage plin nu trebuie să spargă jocul. */

const PREFIX = 'trivia-ro:';

/**
 * Versiunea formatului salvat. Se incrementează când o schimbare face datele
 * vechi incompatibile — de exemplu ștergerea unei categorii, care lăsa în
 * statistici chei fără corespondent și dobora aplicația la pornire.
 */
export const STORAGE_VERSION = 2;

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* fără persistență, jocul merge mai departe */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* nimic de șters */
  }
}

export function clearAll(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) doomed.push(key);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nimic de curățat */
  }
}

export const KEYS = {
  difficulty: 'difficulty',
  categories: 'categories',
  seen: 'seen',
  seenCounter: 'seen-counter',
  stats: 'stats',
  timer: 'timer',
  theme: 'theme',
  roundSize: 'round-size',
  version: 'version',
} as const;
