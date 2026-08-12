import type { CategoryId, Difficulty } from '../data/types';
import type { AnswerRecord, Round } from './round';

export type CategoryBreakdown = {
  category: CategoryId;
  correct: number;
  total: number;
};

export type RoundResult = {
  score: number;
  total: number;
  difficulty: Difficulty;
  breakdown: CategoryBreakdown[];
};

export function scoreRound(round: Round, answers: readonly AnswerRecord[]): RoundResult {
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  const perCategory = new Map<CategoryId, CategoryBreakdown>();
  let score = 0;

  for (const item of round.items) {
    const cat = item.question.category;
    const entry = perCategory.get(cat) ?? { category: cat, correct: 0, total: 0 };
    entry.total += 1;
    const answer = byId.get(item.question.id);
    if (answer?.correct) {
      entry.correct += 1;
      score += 1;
    }
    perCategory.set(cat, entry);
  }

  return {
    score,
    total: round.items.length,
    difficulty: round.difficulty,
    breakdown: [...perCategory.values()].sort((a, b) => b.correct - a.correct || a.category.localeCompare(b.category)),
  };
}

export type DifficultyStats = {
  rounds: number;
  totalCorrect: number;
  totalQuestions: number;
  best: number;
};

export type CategoryStats = {
  correct: number;
  total: number;
};

export type Stats = {
  /** Statisticile se țin SEPARAT pe dificultăți: 10/10 la ușor ≠ 10/10 la dificil. */
  byDifficulty: Record<Difficulty, DifficultyStats>;
  byCategory: Partial<Record<CategoryId, CategoryStats>>;
};

export function emptyStats(): Stats {
  const blank = (): DifficultyStats => ({ rounds: 0, totalCorrect: 0, totalQuestions: 0, best: 0 });
  return {
    byDifficulty: { usor: blank(), mediu: blank(), dificil: blank() },
    byCategory: {},
  };
}

export function applyResult(stats: Stats, result: RoundResult): Stats {
  const next: Stats = {
    byDifficulty: { ...stats.byDifficulty },
    byCategory: { ...stats.byCategory },
  };
  const prev = next.byDifficulty[result.difficulty] ?? {
    rounds: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    best: 0,
  };
  next.byDifficulty[result.difficulty] = {
    rounds: prev.rounds + 1,
    totalCorrect: prev.totalCorrect + result.score,
    totalQuestions: prev.totalQuestions + result.total,
    best: Math.max(prev.best, result.score),
  };
  for (const row of result.breakdown) {
    const cur = next.byCategory[row.category] ?? { correct: 0, total: 0 };
    next.byCategory[row.category] = {
      correct: cur.correct + row.correct,
      total: cur.total + row.total,
    };
  }
  return next;
}

export function averageScore(stats: DifficultyStats): number | null {
  if (stats.rounds === 0) return null;
  return stats.totalCorrect / stats.rounds;
}

/** Categoriile cu cel puțin `minAnswered` răspunsuri, ordonate după procentaj. */
export function rankedCategories(
  stats: Stats,
  minAnswered = 5,
): { category: CategoryId; pct: number; total: number }[] {
  return Object.entries(stats.byCategory)
    .filter(([, v]) => v && v.total >= minAnswered)
    .map(([category, v]) => ({
      category: category as CategoryId,
      pct: v!.correct / v!.total,
      total: v!.total,
    }))
    .sort((a, b) => b.pct - a.pct);
}
