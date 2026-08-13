import { describe, expect, it } from 'vitest';
import { CATEGORY_IDS, categoryName, isKnownCategory } from '../../data/categories';
import { QUESTIONS } from '../../data';
import {
  sanitizeCategories,
  sanitizeDifficulty,
  sanitizeRoundSize,
  sanitizeSeen,
  sanitizeStats,
} from '../migrate';

/**
 * Regresie pentru ecranul negru: datele rămase de la o ediție anterioară
 * conțineau categoria „cultura”, scoasă din joc. Căutarea numelui ei arunca
 * la prima randare și lăsa pagina complet goală.
 */
describe('curățarea datelor salvate de o ediție veche', () => {
  const OLD_CATEGORY = 'cultura';

  it('nu mai recunoaște categoria scoasă din joc', () => {
    expect(isKnownCategory(OLD_CATEGORY)).toBe(false);
    expect(CATEGORY_IDS).not.toContain(OLD_CATEGORY);
  });

  it('întoarce un nume utilizabil pentru orice categorie, chiar și necunoscută', () => {
    expect(categoryName('istorie')).toBe('Istorie');
    expect(() => categoryName(OLD_CATEGORY)).not.toThrow();
    expect(typeof categoryName(OLD_CATEGORY)).toBe('string');
    expect(categoryName('ceva-inexistent').length).toBeGreaterThan(0);
  });

  it('scoate categoriile dispărute din statistici', () => {
    const stats = sanitizeStats({
      byDifficulty: {
        usor: { rounds: 2, totalCorrect: 15, totalQuestions: 20, best: 8 },
        mediu: { rounds: 0, totalCorrect: 0, totalQuestions: 0, best: 0 },
        dificil: { rounds: 0, totalCorrect: 0, totalQuestions: 0, best: 0 },
      },
      byCategory: { istorie: { correct: 5, total: 6 }, [OLD_CATEGORY]: { correct: 4, total: 5 } },
    });
    expect(Object.keys(stats.byCategory)).toEqual(['istorie']);
    // Statisticile de dinainte de rundele de 20 primesc bestTotal, nu undefined.
    expect(stats.byDifficulty.usor.bestTotal).toBe(10);
    expect(stats.byDifficulty.mediu.bestTotal).toBe(0);
  });

  it('scoate categoria dispărută din selecția salvată', () => {
    const clean = sanitizeCategories([...CATEGORY_IDS, OLD_CATEGORY]);
    expect(clean).not.toContain(OLD_CATEGORY);
    expect(clean).toHaveLength(CATEGORY_IDS.length);
  });

  it('revine la toate categoriile dacă rămân sub minimul de trei', () => {
    expect(sanitizeCategories([OLD_CATEGORY, 'istorie'])).toEqual(CATEGORY_IDS);
    expect(sanitizeCategories([])).toEqual(CATEGORY_IDS);
  });

  it('uită id-urile de întrebări care nu mai există', () => {
    const realId = QUESTIONS[0].id;
    const seen = sanitizeSeen({ [realId]: 1, 'rom-042': 2, 'ist-999': 3 });
    expect(seen).toEqual({ [realId]: 1 });
  });

  it('rezistă la orice gunoi din localStorage, fără să arunce', () => {
    for (const junk of [null, undefined, 0, 'text', [], { byDifficulty: 'nu' }, { byCategory: 7 }]) {
      expect(() => sanitizeStats(junk)).not.toThrow();
      expect(() => sanitizeSeen(junk)).not.toThrow();
      expect(() => sanitizeCategories(junk)).not.toThrow();
      expect(() => sanitizeDifficulty(junk)).not.toThrow();
      expect(() => sanitizeRoundSize(junk)).not.toThrow();
    }
    expect(sanitizeStats(null).byCategory).toEqual({});
    expect(sanitizeSeen('text')).toEqual({});
    expect(sanitizeDifficulty('imposibil')).toBe('mediu');
    expect(sanitizeRoundSize(37)).toBe(10);
    expect(sanitizeRoundSize(20)).toBe(20);
  });

  it('păstrează datele valide neatinse', () => {
    expect(sanitizeDifficulty('dificil')).toBe('dificil');
    expect(sanitizeCategories(['istorie', 'sport', 'film'])).toEqual(['istorie', 'film', 'sport']);
    const stats = sanitizeStats({
      byDifficulty: {
        usor: { rounds: 3, totalCorrect: 20, totalQuestions: 30, best: 9, bestTotal: 10 },
        mediu: { rounds: 1, totalCorrect: 16, totalQuestions: 20, best: 16, bestTotal: 20 },
        dificil: { rounds: 0, totalCorrect: 0, totalQuestions: 0, best: 0, bestTotal: 0 },
      },
      byCategory: { sport: { correct: 3, total: 4 } },
    });
    expect(stats.byDifficulty.mediu.bestTotal).toBe(20);
    expect(stats.byCategory.sport).toEqual({ correct: 3, total: 4 });
  });
});

/** Fiecare categorie folosită de întrebări trebuie să existe în configurație. */
describe('coerența dintre întrebări și categorii', () => {
  it('nu are întrebări într-o categorie necunoscută', () => {
    const unknown = [...new Set(QUESTIONS.map((q) => q.category))].filter((c) => !isKnownCategory(c));
    expect(unknown).toEqual([]);
  });

  it('are întrebări în fiecare categorie declarată', () => {
    for (const id of CATEGORY_IDS) {
      expect(QUESTIONS.some((q) => q.category === id)).toBe(true);
    }
  });
});
