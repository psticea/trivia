/**
 * Contractul bazei de date de întrebări.
 * Orice modificare aici trebuie reflectată în scripts/validate.ts.
 */

/**
 * Nivelurile de dificultate.
 * `copii` e gândit pentru 9-10 ani: se joacă separat, cu propriile întrebări,
 * și schimbă și înfățișarea jocului cât ține runda.
 */
export type Difficulty = 'copii' | 'usor' | 'mediu' | 'dificil';

/**
 * Regiunea de care ține subiectul întrebării — nu limba, care e mereu româna.
 * Jucătorii sunt din România, așa că baza e construită dinspre ce știu ei:
 * întâi țara, apoi continentul, apoi America de Nord, apoi restul lumii.
 */
export type Region =
  /** România. */
  | 'ro'
  /** Restul Europei. */
  | 'europa'
  /** Statele Unite și Canada. */
  | 'america_nord'
  /** Asia, Africa, America de Sud, Oceania, Orientul Mijlociu. */
  | 'restul_lumii'
  /** Fără ancoră geografică: legi ale fizicii, teorie, concepte generale. */
  | 'universal';

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
  | 'religie';

export type Question = {
  /** Identificator stabil, ex. "ist-042". Nu se renumerotează în timpul unei ediții. */
  id: string;
  category: CategoryId;
  difficulty: Difficulty;
  region: Region;
  /** Textul întrebării, în română, se termină cu „?”. */
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  /** Una sau două propoziții, arătate după răspuns. */
  explanation: string;
  /** Obligatoriu pentru date, cifre, recorduri și superlative. */
  source?: string;
};

export const DIFFICULTIES: Difficulty[] = ['copii', 'usor', 'mediu', 'dificil'];

/** Dificultatea cu reguli proprii de conținut și de aspect. */
export const KID_DIFFICULTY: Difficulty = 'copii';

export const REGIONS: Region[] = ['ro', 'europa', 'america_nord', 'restul_lumii', 'universal'];

export const REGION_LABEL: Record<Region, string> = {
  ro: 'România',
  europa: 'Europa',
  america_nord: 'America de Nord',
  restul_lumii: 'Restul lumii',
  universal: 'Universal',
};
