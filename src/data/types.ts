/**
 * Contractul bazei de date de întrebări.
 * Orice modificare aici trebuie reflectată în scripts/validate.ts.
 */

export type Difficulty = 'usor' | 'mediu' | 'dificil';

export type Scope = 'ro' | 'international';

export type CategoryId =
  | 'istorie'
  | 'geografie'
  | 'stiinta'
  | 'arta'
  | 'muzica'
  | 'film'
  | 'sport'
  | 'tehnologie'
  | 'gastronomie'
  | 'cultura';

export type Question = {
  /** Identificator stabil, ex. "ist-042". Nu se renumerotează niciodată. */
  id: string;
  category: CategoryId;
  difficulty: Difficulty;
  scope: Scope;
  /** Textul întrebării, în română, se termină cu „?”. */
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  /** Una sau două propoziții, arătate după răspuns. */
  explanation: string;
  /** Obligatoriu pentru date, cifre, recorduri și superlative. */
  source?: string;
};

export const DIFFICULTIES: Difficulty[] = ['usor', 'mediu', 'dificil'];
