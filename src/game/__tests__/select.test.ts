import { describe, expect, it } from 'vitest';
import { CATEGORY_IDS } from '../../data/categories';
import type { CategoryId, Difficulty, Question } from '../../data/types';
import { allocate, poolSize, ROUND_SIZES, selectRound, type SeenMap } from '../select';
import { mulberry32 } from '../rng';

function makeQuestion(category: CategoryId, difficulty: Difficulty, n: number): Question {
  return {
    id: `${category}-${difficulty}-${n}`,
    category,
    difficulty,
    scope: 'international',
    question: `Întrebarea ${n}?`,
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 0,
    explanation: 'Explicație.',
  };
}

/** Bază sintetică: 30 de întrebări per categorie per dificultate, ca cea reală. */
function syntheticDb(perTier = 30): Question[] {
  const out: Question[] = [];
  for (const cat of CATEGORY_IDS) {
    for (const d of ['usor', 'mediu', 'dificil'] as Difficulty[]) {
      for (let i = 0; i < perTier; i += 1) out.push(makeQuestion(cat, d, i));
    }
  }
  return out;
}

const DB = syntheticDb();

function combinations<T>(items: T[], k: number): T[][] {
  const out: T[][] = [];
  const walk = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i < items.length; i += 1) walk(i + 1, [...acc, items[i]]);
  };
  walk(0, []);
  return out;
}

describe('allocate', () => {
  it('împarte exact, fără să piardă sau să inventeze locuri', () => {
    for (let buckets = 1; buckets <= 10; buckets += 1) {
      const alloc = allocate(10, buckets, mulberry32(7));
      expect(alloc).toHaveLength(buckets);
      expect(alloc.reduce((a, b) => a + b, 0)).toBe(10);
      expect(Math.max(...alloc) - Math.min(...alloc)).toBeLessThanOrEqual(1);
    }
  });

  it('nu dă mereu restul acelorași categorii', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 40; seed += 1) {
      seen.add(allocate(10, 3, mulberry32(seed)).join(','));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('întoarce un vector gol pentru zero categorii', () => {
    expect(allocate(10, 0, mulberry32(1))).toEqual([]);
  });
});

describe('selectRound', () => {
  it('dă exact 10 întrebări unice pentru orice combinație de 3 categorii × dificultate', () => {
    const trios = combinations(CATEGORY_IDS, 3);
    expect(trios).toHaveLength(120);
    let seed = 0;
    for (const d of ['usor', 'mediu', 'dificil'] as Difficulty[]) {
      for (const trio of trios) {
        seed += 1;
        const { questions } = selectRound({ all: DB, difficulty: d, categories: trio, seed });
        expect(questions).toHaveLength(10);
        expect(new Set(questions.map((q) => q.id)).size).toBe(10);
        expect(questions.every((q) => q.difficulty === d)).toBe(true);
        expect(questions.every((q) => trio.includes(q.category))).toBe(true);
      }
    }
  });

  it('dă și runde de 20 de întrebări unice, inclusiv la minimul de 3 categorii', () => {
    const trios = combinations(CATEGORY_IDS, 3);
    let seed = 5000;
    for (const d of ['usor', 'mediu', 'dificil'] as Difficulty[]) {
      for (const trio of trios) {
        seed += 1;
        const { questions } = selectRound({ all: DB, difficulty: d, categories: trio, seed, count: 20 });
        expect(questions).toHaveLength(20);
        expect(new Set(questions.map((q) => q.id)).size).toBe(20);
        expect(questions.every((q) => q.difficulty === d)).toBe(true);
      }
    }
  });

  it('stratifică o rundă de 20 peste 3 categorii, fără aglomerări', () => {
    const trio = CATEGORY_IDS.slice(0, 3);
    for (let seed = 1; seed <= 15; seed += 1) {
      const { questions } = selectRound({ all: DB, difficulty: 'mediu', categories: trio, seed, count: 20 });
      const counts = trio.map((c) => questions.filter((q) => q.category === c).length).sort();
      expect(counts).toEqual([6, 7, 7]);
    }
  });

  it('dă exact 10 unice pentru orice număr de categorii între 3 și 10', () => {
    for (let k = 3; k <= 10; k += 1) {
      const categories = CATEGORY_IDS.slice(0, k);
      const { questions } = selectRound({ all: DB, difficulty: 'mediu', categories, seed: 99 + k });
      expect(questions).toHaveLength(10);
      expect(new Set(questions.map((q) => q.id)).size).toBe(10);
    }
  });

  it('stratifică: cu 10 categorii active, exact una din fiecare', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const { questions } = selectRound({
        all: DB,
        difficulty: 'usor',
        categories: CATEGORY_IDS,
        seed,
      });
      const cats = questions.map((q) => q.category);
      expect(new Set(cats).size).toBe(10);
    }
  });

  it('stratifică 4/3/3 pe trei categorii, fără aglomerări', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const trio = CATEGORY_IDS.slice(0, 3);
      const { questions } = selectRound({ all: DB, difficulty: 'dificil', categories: trio, seed });
      const counts = trio.map((c) => questions.filter((q) => q.category === c).length).sort();
      expect(counts).toEqual([3, 3, 4]);
    }
  });

  it('preferă întrebările nevăzute', () => {
    const trio = CATEGORY_IDS.slice(0, 3) as CategoryId[];
    const seen: SeenMap = {};
    const fresh = new Set<string>();
    // Lăsăm 4 nevăzute în FIECARE categorie, ca stratificarea să le poată folosi pe toate.
    for (const cat of trio) {
      const inCat = DB.filter((q) => q.difficulty === 'mediu' && q.category === cat);
      inCat.slice(0, 4).forEach((q) => fresh.add(q.id));
      inCat.slice(4).forEach((q, i) => {
        seen[q.id] = i + 1;
      });
    }
    const { questions, exhausted } = selectRound({
      all: DB,
      difficulty: 'mediu',
      categories: trio,
      seen,
      seed: 5,
    });
    expect(exhausted).toBe(false);
    expect(questions.every((q) => fresh.has(q.id))).toBe(true);
  });

  it('reia întrebările vechi doar când o categorie nu mai are nevăzute', () => {
    const trio = CATEGORY_IDS.slice(0, 3) as CategoryId[];
    const seen: SeenMap = {};
    // O singură categorie mai are întrebări nevăzute; celelalte două sunt epuizate.
    const [fresh, ...stale] = trio;
    for (const cat of stale) {
      DB.filter((q) => q.difficulty === 'mediu' && q.category === cat).forEach((q, i) => {
        seen[q.id] = i + 1;
      });
    }
    const { questions } = selectRound({
      all: DB,
      difficulty: 'mediu',
      categories: trio,
      seen,
      seed: 8,
    });
    expect(questions).toHaveLength(10);
    expect(questions.filter((q) => q.category === fresh).every((q) => seen[q.id] === undefined)).toBe(true);
  });

  it('reia cele mai vechi întrebări când rezerva de nevăzute s-a epuizat', () => {
    const trio = CATEGORY_IDS.slice(0, 3) as CategoryId[];
    const seen: SeenMap = {};
    DB.forEach((q, i) => {
      seen[q.id] = i + 1;
    });
    const { questions, exhausted } = selectRound({
      all: DB,
      difficulty: 'usor',
      categories: trio,
      seen,
      seed: 11,
    });
    expect(exhausted).toBe(true);
    expect(questions).toHaveLength(10);
    expect(new Set(questions.map((q) => q.id)).size).toBe(10);
  });

  it('nu intră în buclă și nu crapă când rezerva e mai mică decât runda', () => {
    const tiny: Question[] = [
      makeQuestion('istorie', 'usor', 1),
      makeQuestion('istorie', 'usor', 2),
      makeQuestion('geografie', 'usor', 3),
    ];
    const { questions } = selectRound({
      all: tiny,
      difficulty: 'usor',
      categories: ['istorie', 'geografie', 'sport'],
      seed: 3,
    });
    expect(questions).toHaveLength(3);
    expect(new Set(questions.map((q) => q.id)).size).toBe(3);
  });

  it('întoarce gol dacă nu există nicio întrebare potrivită', () => {
    const { questions } = selectRound({
      all: DB.filter((q) => q.difficulty !== 'dificil'),
      difficulty: 'dificil',
      categories: CATEGORY_IDS,
      seed: 1,
    });
    expect(questions).toEqual([]);
  });

  it('este determinist pentru aceeași sămânță', () => {
    const args = { all: DB, difficulty: 'mediu' as Difficulty, categories: CATEGORY_IDS, seed: 4242 };
    const a = selectRound(args).questions.map((q) => q.id);
    const b = selectRound(args).questions.map((q) => q.id);
    expect(a).toEqual(b);
  });

  it('nu întoarce aceeași rundă pentru semințe diferite', () => {
    const a = selectRound({ all: DB, difficulty: 'mediu', categories: CATEGORY_IDS, seed: 1 });
    const b = selectRound({ all: DB, difficulty: 'mediu', categories: CATEGORY_IDS, seed: 2 });
    expect(a.questions.map((q) => q.id)).not.toEqual(b.questions.map((q) => q.id));
  });
});

describe('poolSize', () => {
  it('numără doar dificultatea și categoriile cerute', () => {
    expect(poolSize(DB, 'usor', ['istorie'])).toBe(30);
    expect(poolSize(DB, 'usor', ['istorie', 'sport', 'film'])).toBe(90);
    expect(poolSize(DB, 'dificil', [])).toBe(0);
  });

  it('acoperă cea mai mare rundă oferită, chiar la minimul de 3 categorii', () => {
    const largest = Math.max(...ROUND_SIZES);
    for (const trio of combinations(CATEGORY_IDS, 3)) {
      for (const d of ['usor', 'mediu', 'dificil'] as Difficulty[]) {
        expect(poolSize(DB, d, trio)).toBeGreaterThanOrEqual(largest);
      }
    }
  });
});
