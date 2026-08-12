import type { CategoryId, Difficulty, Question } from '../data/types';
import { hashString, mulberry32, shuffle } from './rng';
import { ROUND_SIZE, selectRound, type SeenMap } from './select';

export type RoundItem = {
  question: Question;
  /** optionOrder[indexAfișat] = indexul original din question.options */
  optionOrder: number[];
};

export type Round = {
  seed: number;
  difficulty: Difficulty;
  categories: CategoryId[];
  items: RoundItem[];
};

export type AnswerRecord = {
  questionId: string;
  /** Indexul original ales de jucător; null dacă a expirat cronometrul. */
  chosenIndex: number | null;
  correct: boolean;
};

/**
 * Ordinea opțiunilor se calculează O SINGURĂ DATĂ, la construirea rundei.
 * Nu se amestecă niciodată în timpul randării (vezi §6.4 din brief).
 */
export function optionOrderFor(questionId: string, seed: number): number[] {
  const rng = mulberry32((hashString(questionId) ^ seed) >>> 0);
  return shuffle([0, 1, 2, 3], rng);
}

function toItems(questions: Question[], seed: number): RoundItem[] {
  return questions.map((question) => ({
    question,
    optionOrder: optionOrderFor(question.id, seed),
  }));
}

export function buildRound(params: {
  all: readonly Question[];
  difficulty: Difficulty;
  categories: readonly CategoryId[];
  seen?: SeenMap;
  seed: number;
  count?: number;
}): { round: Round; exhausted: boolean } {
  const { all, difficulty, categories, seen, seed } = params;
  const { questions, exhausted } = selectRound({
    all,
    difficulty,
    categories,
    seen,
    seed,
    count: params.count ?? ROUND_SIZE,
  });
  return {
    round: {
      seed,
      difficulty,
      categories: [...categories],
      items: toItems(questions, seed),
    },
    exhausted,
  };
}

/** Reconstruiește exact aceeași rundă dintr-un link partajat. */
export function buildRoundFromIds(params: {
  all: readonly Question[];
  ids: readonly string[];
  difficulty: Difficulty;
  categories: readonly CategoryId[];
  seed: number;
}): Round | null {
  const index = new Map(params.all.map((q) => [q.id, q]));
  const questions: Question[] = [];
  for (const id of params.ids) {
    const q = index.get(id);
    if (!q) return null;
    questions.push(q);
  }
  return {
    seed: params.seed,
    difficulty: params.difficulty,
    categories: [...params.categories],
    items: toItems(questions, params.seed),
  };
}

export function isCorrect(item: RoundItem, chosenIndex: number | null): boolean {
  return chosenIndex !== null && chosenIndex === item.question.correctIndex;
}
