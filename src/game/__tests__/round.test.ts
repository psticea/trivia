import { describe, expect, it } from 'vitest';
import type { CategoryId, Difficulty, Question } from '../../data/types';
import { buildRound, buildRoundFromIds, optionOrderFor, type AnswerRecord } from '../round';
import {
  accuracy,
  applyResult,
  averageScore,
  emptyStats,
  isBetterScore,
  rankedCategories,
  scoreRound,
} from '../scoring';
import { decodeShare, encodeShare, readShareToken, shareUrl } from '../share';

function q(id: string, category: CategoryId, difficulty: Difficulty, correctIndex: 0 | 1 | 2 | 3): Question {
  return {
    id,
    category,
    difficulty,
    scope: 'international',
    question: `Întrebarea ${id}?`,
    options: ['unu', 'doi', 'trei', 'patru'],
    correctIndex,
    explanation: 'Explicație.',
  };
}

const DB: Question[] = [
  q('ist-001', 'istorie', 'mediu', 0),
  q('ist-002', 'istorie', 'mediu', 1),
  q('geo-001', 'geografie', 'mediu', 2),
  q('geo-002', 'geografie', 'mediu', 3),
  q('spo-001', 'sport', 'mediu', 1),
  q('spo-002', 'sport', 'mediu', 2),
];

describe('optionOrderFor', () => {
  it('este o permutare a celor patru indici', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const order = optionOrderFor(`ist-${seed}`, seed);
      expect([...order].sort()).toEqual([0, 1, 2, 3]);
    }
  });

  it('este stabil pentru aceeași întrebare și aceeași sămânță — nu se reamestecă la re-render', () => {
    const a = optionOrderFor('ist-042', 999);
    const b = optionOrderFor('ist-042', 999);
    expect(a).toEqual(b);
  });

  it('diferă între întrebări din aceeași rundă', () => {
    const orders = new Set(
      ['ist-001', 'ist-002', 'geo-001', 'geo-002', 'spo-001'].map((id) => optionOrderFor(id, 7).join('')),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it('chiar amestecă: poziția răspunsului corect nu rămâne fixă', () => {
    const positions = new Set<number>();
    for (let i = 0; i < 60; i += 1) {
      positions.add(optionOrderFor(`q-${i}`, 3).indexOf(0));
    }
    expect(positions.size).toBe(4);
  });
});

describe('buildRound / buildRoundFromIds', () => {
  it('precalculează ordinea opțiunilor pentru fiecare întrebare', () => {
    const { round } = buildRound({
      all: DB,
      difficulty: 'mediu',
      categories: ['istorie', 'geografie', 'sport'],
      seed: 21,
      count: 6,
    });
    expect(round.items).toHaveLength(6);
    for (const item of round.items) {
      expect([...item.optionOrder].sort()).toEqual([0, 1, 2, 3]);
    }
  });

  it('reconstruiește identic o rundă partajată', () => {
    const { round } = buildRound({
      all: DB,
      difficulty: 'mediu',
      categories: ['istorie', 'geografie', 'sport'],
      seed: 777,
      count: 6,
    });
    const rebuilt = buildRoundFromIds({
      all: DB,
      ids: round.items.map((i) => i.question.id),
      difficulty: round.difficulty,
      categories: round.categories,
      seed: round.seed,
    });
    expect(rebuilt).not.toBeNull();
    expect(rebuilt!.items.map((i) => i.question.id)).toEqual(round.items.map((i) => i.question.id));
    expect(rebuilt!.items.map((i) => i.optionOrder)).toEqual(round.items.map((i) => i.optionOrder));
  });

  it('întoarce null dacă un id din link nu mai există', () => {
    const rebuilt = buildRoundFromIds({
      all: DB,
      ids: ['ist-001', 'nu-exista-999'],
      difficulty: 'mediu',
      categories: ['istorie'],
      seed: 1,
    });
    expect(rebuilt).toBeNull();
  });
});

describe('scoreRound', () => {
  const { round } = buildRound({
    all: DB,
    difficulty: 'mediu',
    categories: ['istorie', 'geografie', 'sport'],
    seed: 5,
    count: 6,
  });

  it('acordă un punct pentru fiecare răspuns corect', () => {
    const answers: AnswerRecord[] = round.items.map((item, i) => ({
      questionId: item.question.id,
      chosenIndex: i < 4 ? item.question.correctIndex : (item.question.correctIndex + 1) % 4,
      correct: i < 4,
    }));
    const result = scoreRound(round, answers);
    expect(result.score).toBe(4);
    expect(result.total).toBe(6);
    expect(result.breakdown.reduce((n, r) => n + r.total, 0)).toBe(6);
    expect(result.breakdown.reduce((n, r) => n + r.correct, 0)).toBe(4);
  });

  it('tratează întrebările fără răspuns ca greșite', () => {
    const answers: AnswerRecord[] = round.items.map((item) => ({
      questionId: item.question.id,
      chosenIndex: null,
      correct: false,
    }));
    expect(scoreRound(round, answers).score).toBe(0);
  });

  it('dă zero când nu s-a răspuns deloc', () => {
    expect(scoreRound(round, []).score).toBe(0);
  });
});

describe('statistici', () => {
  it('ține evidența separat pe dificultăți', () => {
    let stats = emptyStats();
    stats = applyResult(stats, { score: 10, total: 10, difficulty: 'usor', breakdown: [] });
    stats = applyResult(stats, { score: 4, total: 10, difficulty: 'dificil', breakdown: [] });

    expect(stats.byDifficulty.usor.best).toBe(10);
    expect(stats.byDifficulty.usor.rounds).toBe(1);
    expect(stats.byDifficulty.dificil.best).toBe(4);
    expect(stats.byDifficulty.mediu.rounds).toBe(0);
    expect(averageScore(stats.byDifficulty.mediu)).toBeNull();
    expect(accuracy(stats.byDifficulty.mediu)).toBeNull();
  });

  it('calculează media pe mai multe runde', () => {
    let stats = emptyStats();
    stats = applyResult(stats, { score: 6, total: 10, difficulty: 'mediu', breakdown: [] });
    stats = applyResult(stats, { score: 8, total: 10, difficulty: 'mediu', breakdown: [] });
    expect(averageScore(stats.byDifficulty.mediu)).toBe(7);
    expect(accuracy(stats.byDifficulty.mediu)).toBe(0.7);
    expect(stats.byDifficulty.mediu.best).toBe(8);
    expect(stats.byDifficulty.mediu.bestTotal).toBe(10);
  });

  it('compară recordurile pe procentaj, nu pe scor brut', () => {
    // 11 din 20 nu bate 10 din 10, oricât de mare ar fi cifra.
    expect(isBetterScore(11, 20, 10, 10)).toBe(false);
    expect(isBetterScore(10, 10, 11, 20)).toBe(true);
    // La procentaj egal, runda mai lungă e realizarea mai mare.
    expect(isBetterScore(20, 20, 10, 10)).toBe(true);
    expect(isBetterScore(10, 10, 20, 20)).toBe(false);
    // Primul rezultat devine automat record.
    expect(isBetterScore(0, 10, 0, 0)).toBe(true);
  });

  it('păstrează recordul procentual când se joacă runde de lungimi diferite', () => {
    let stats = emptyStats();
    stats = applyResult(stats, { score: 10, total: 10, difficulty: 'mediu', breakdown: [] });
    stats = applyResult(stats, { score: 11, total: 20, difficulty: 'mediu', breakdown: [] });
    expect(stats.byDifficulty.mediu.best).toBe(10);
    expect(stats.byDifficulty.mediu.bestTotal).toBe(10);
    expect(stats.byDifficulty.mediu.totalQuestions).toBe(30);
    expect(accuracy(stats.byDifficulty.mediu)).toBe(21 / 30);

    stats = applyResult(stats, { score: 20, total: 20, difficulty: 'mediu', breakdown: [] });
    expect(stats.byDifficulty.mediu.best).toBe(20);
    expect(stats.byDifficulty.mediu.bestTotal).toBe(20);
  });

  it('cumulează pe categorii și le ordonează după procentaj', () => {
    let stats = emptyStats();
    stats = applyResult(stats, {
      score: 5,
      total: 10,
      difficulty: 'mediu',
      breakdown: [
        { category: 'istorie', correct: 5, total: 5 },
        { category: 'sport', correct: 0, total: 5 },
      ],
    });
    const ranked = rankedCategories(stats);
    expect(ranked[0].category).toBe('istorie');
    expect(ranked[ranked.length - 1].category).toBe('sport');
  });

  it('ignoră categoriile cu prea puține răspunsuri', () => {
    let stats = emptyStats();
    stats = applyResult(stats, {
      score: 1,
      total: 1,
      difficulty: 'mediu',
      breakdown: [{ category: 'film', correct: 1, total: 1 }],
    });
    expect(rankedCategories(stats)).toHaveLength(0);
  });
});

describe('linkuri de partajare', () => {
  const payload = {
    difficulty: 'dificil' as Difficulty,
    categories: ['istorie', 'geografie', 'sport'] as CategoryId[],
    seed: 123456789,
    questionIds: ['ist-001', 'geo-014', 'spo-030'],
    score: 7,
  };

  it('face drumul dus-întors fără pierderi', () => {
    const decoded = decodeShare(encodeShare(payload));
    expect(decoded).toEqual(payload);
  });

  it('duce și o provocare fără scor, trimisă în timpul rundei', () => {
    const open = { ...payload, score: null };
    const decoded = decodeShare(encodeShare(open));
    expect(decoded).toEqual(open);
    expect(decoded!.score).toBeNull();
  });

  it('păstrează scorul zero, care nu e același lucru cu „fără scor”', () => {
    const zero = { ...payload, score: 0 };
    expect(decodeShare(encodeShare(zero))!.score).toBe(0);
  });

  it('produce un token sigur pentru URL', () => {
    expect(encodeShare(payload)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('citește tokenul din hash', () => {
    const url = shareUrl(payload, 'https://exemplu.ro/trivia/');
    expect(url.startsWith('https://exemplu.ro/trivia/#p=')).toBe(true);
    const token = readShareToken(new URL(url).hash);
    expect(token).not.toBeNull();
    expect(decodeShare(token!)).toEqual(payload);
  });

  it('înlocuiește un hash existent în loc să îl adauge', () => {
    const url = shareUrl(payload, 'https://exemplu.ro/trivia/#p=vechi');
    expect(url.match(/#/g)).toHaveLength(1);
  });

  it('respinge tokenurile stricate în loc să crape', () => {
    expect(decodeShare('nu-e-un-token')).toBeNull();
    expect(decodeShare('')).toBeNull();
    expect(readShareToken('#altceva=1')).toBeNull();
  });
});
