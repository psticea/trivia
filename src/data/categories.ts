import type { CategoryId } from './types';

export type CategoryMeta = {
  id: CategoryId;
  /** Prefixul folosit de ID-urile întrebărilor, ex. "ist-001". */
  prefix: string;
  name: string;
  /** Formă scurtă pentru ecrane înguste. */
  short: string;
  blurb: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'istorie',
    prefix: 'ist',
    name: 'Istorie',
    short: 'Istorie',
    blurb: 'Antichitate, Ev Mediu, epoca modernă, secolul XX',
  },
  {
    id: 'geografie',
    prefix: 'geo',
    name: 'Geografie',
    short: 'Geografie',
    blurb: 'Țări, capitale, fluvii, munți, oceane, steaguri',
  },
  {
    id: 'stiinta',
    prefix: 'sti',
    name: 'Știință și Natură',
    short: 'Știință',
    blurb: 'Fizică, chimie, biologie, astronomie, corpul uman',
  },
  {
    id: 'arta',
    prefix: 'art',
    name: 'Artă și Literatură',
    short: 'Artă',
    blurb: 'Pictură, sculptură, arhitectură, literatură',
  },
  {
    id: 'muzica',
    prefix: 'muz',
    name: 'Muzică',
    short: 'Muzică',
    blurb: 'Clasic, rock, pop, jazz, instrumente, teorie',
  },
  {
    id: 'film',
    prefix: 'flm',
    name: 'Film și Televiziune',
    short: 'Film',
    blurb: 'Cinema mondial, regizori, actori, seriale',
  },
  {
    id: 'sport',
    prefix: 'spo',
    name: 'Sport',
    short: 'Sport',
    blurb: 'Fotbal, Jocurile Olimpice, tenis, atletism, motorsport',
  },
  {
    id: 'tehnologie',
    prefix: 'teh',
    name: 'Tehnologie',
    short: 'Tehnologie',
    blurb: 'Calculatoare, internet, invenții, explorare spațială',
  },
  {
    id: 'gastronomie',
    prefix: 'gas',
    name: 'Gastronomie',
    short: 'Gastronomie',
    blurb: 'Bucătării ale lumii, ingrediente, băuturi, tehnici',
  },
  {
    id: 'cultura',
    prefix: 'rom',
    name: 'Cultură Românească',
    short: 'Cultură RO',
    blurb: 'Tradiții, folclor, obiceiuri, simboluri, limbă',
  },
];

export const CATEGORY_IDS: CategoryId[] = CATEGORIES.map((c) => c.id);

export const CATEGORY_BY_ID: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryMeta>;
