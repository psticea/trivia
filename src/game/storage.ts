/** Acces tolerant la localStorage: modul privat / storage plin nu trebuie să spargă jocul. */

const PREFIX = 'trivia-ro:';

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
} as const;
