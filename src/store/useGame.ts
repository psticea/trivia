import { create } from 'zustand';
import { QUESTIONS } from '../data';
import { CATEGORY_IDS } from '../data/categories';
import type { CategoryId, Difficulty } from '../data/types';
import { buildRound, buildRoundFromIds, type AnswerRecord, type Round } from '../game/round';
import { randomSeed } from '../game/rng';
import { MIN_CATEGORIES, ROUND_SIZE, ROUND_SIZES, type RoundSize, type SeenMap } from '../game/select';
import {
  applyResult,
  emptyStats,
  isBetterScore,
  scoreRound,
  type RoundResult,
  type Stats,
} from '../game/scoring';
import { decodeShare, encodeShare, readShareToken, type SharePayload } from '../game/share';
import { clearAll, KEYS, readJson, writeJson } from '../game/storage';
import { applyTheme, persistTheme, readTheme, type Theme } from '../theme';

export type Screen = 'start' | 'question' | 'results' | 'review';

/** Fereastră moartă după schimbarea întrebării, ca un tap în curs să nu răspundă. */
const TRANSITION_LOCK_MS = 340;
/** Fereastră moartă după răspuns, ca un dublu-tap să nu apese și „Continuă”. */
const ADVANCE_LOCK_MS = 300;
export const TIMER_SECONDS = 30;

type GameState = {
  screen: Screen;
  difficulty: Difficulty;
  categories: CategoryId[];
  roundSize: RoundSize;
  timerEnabled: boolean;
  theme: Theme;

  round: Round | null;
  index: number;
  answers: AnswerRecord[];
  selected: number | null;
  revealed: boolean;
  timedOut: boolean;

  inputLockedUntil: number;
  advanceUnlockAt: number;

  result: RoundResult | null;
  isRecord: boolean;
  poolRecycled: boolean;
  /** Momentul pornirii rundei, ca să putem arăta cât a durat la final. */
  roundStartedAt: number | null;
  elapsedMs: number | null;

  stats: Stats;
  seen: SeenMap;
  seenCounter: number;

  challenge: SharePayload | null;

  setDifficulty: (d: Difficulty) => void;
  setRoundSize: (n: RoundSize) => void;
  toggleCategory: (c: CategoryId) => void;
  selectAllCategories: () => void;
  setTimerEnabled: (on: boolean) => void;
  setTheme: (theme: Theme) => void;

  startRound: () => void;
  acceptChallenge: () => void;
  dismissChallenge: () => void;

  answer: (originalIndex: number) => void;
  timeout: () => void;
  advance: () => void;
  quitRound: () => void;

  goToReview: () => void;
  goToResults: () => void;
  goToStart: () => void;
  syncChallengeFromHash: () => void;

  shareToken: () => string;
  shareLink: () => string;
  clearData: () => void;
};

function loadCategories(): CategoryId[] {
  const stored = readJson<CategoryId[]>(KEYS.categories, CATEGORY_IDS);
  const clean = stored.filter((c) => CATEGORY_IDS.includes(c));
  return clean.length >= MIN_CATEGORIES ? clean : [...CATEGORY_IDS];
}

function loadDifficulty(): Difficulty {
  const stored = readJson<Difficulty>(KEYS.difficulty, 'mediu');
  return stored === 'usor' || stored === 'mediu' || stored === 'dificil' ? stored : 'mediu';
}

function loadRoundSize(): RoundSize {
  const stored = readJson<number>(KEYS.roundSize, ROUND_SIZE);
  return (ROUND_SIZES as readonly number[]).includes(stored) ? (stored as RoundSize) : ROUND_SIZE;
}

/**
 * Statisticile salvate înainte de rundele de 20 nu au câmpul `bestTotal`.
 * Pe atunci exista o singură lungime de rundă, deci recordul era din 10.
 */
function loadStats(): Stats {
  const stored = readJson<Stats>(KEYS.stats, emptyStats());
  const base = emptyStats();
  const byDifficulty = { ...base.byDifficulty };
  for (const tier of ['usor', 'mediu', 'dificil'] as Difficulty[]) {
    const s = stored.byDifficulty?.[tier];
    if (!s) continue;
    byDifficulty[tier] = {
      rounds: s.rounds ?? 0,
      totalCorrect: s.totalCorrect ?? 0,
      totalQuestions: s.totalQuestions ?? 0,
      best: s.best ?? 0,
      bestTotal: s.bestTotal ?? (s.rounds > 0 ? ROUND_SIZE : 0),
    };
  }
  return { byDifficulty, byCategory: stored.byCategory ?? {} };
}

function readChallenge(): SharePayload | null {
  if (typeof window === 'undefined') return null;
  const token = readShareToken(window.location.hash);
  if (!token) return null;
  const payload = decodeShare(token);
  if (!payload || payload.questionIds.length === 0) return null;
  return payload;
}

export const useGame = create<GameState>((set, get) => ({
  screen: 'start',
  difficulty: loadDifficulty(),
  categories: loadCategories(),
  roundSize: loadRoundSize(),
  timerEnabled: readJson<boolean>(KEYS.timer, false),
  theme: readTheme(),

  round: null,
  index: 0,
  answers: [],
  selected: null,
  revealed: false,
  timedOut: false,

  inputLockedUntil: 0,
  advanceUnlockAt: 0,

  result: null,
  isRecord: false,
  poolRecycled: false,
  roundStartedAt: null,
  elapsedMs: null,

  stats: loadStats(),
  seen: readJson<SeenMap>(KEYS.seen, {}),
  seenCounter: readJson<number>(KEYS.seenCounter, 0),

  challenge: readChallenge(),

  setDifficulty: (difficulty) => {
    writeJson(KEYS.difficulty, difficulty);
    set({ difficulty });
  },

  setRoundSize: (roundSize) => {
    writeJson(KEYS.roundSize, roundSize);
    set({ roundSize });
  },

  toggleCategory: (category) => {
    const { categories } = get();
    const isOn = categories.includes(category);
    // Minimul se impune în interfață: ultimele trei nu se mai pot debifa.
    if (isOn && categories.length <= MIN_CATEGORIES) return;
    const next = isOn ? categories.filter((c) => c !== category) : [...categories, category];
    const ordered = CATEGORY_IDS.filter((c) => next.includes(c));
    writeJson(KEYS.categories, ordered);
    set({ categories: ordered });
  },

  selectAllCategories: () => {
    writeJson(KEYS.categories, CATEGORY_IDS);
    set({ categories: [...CATEGORY_IDS] });
  },

  setTimerEnabled: (on) => {
    writeJson(KEYS.timer, on);
    set({ timerEnabled: on });
  },

  setTheme: (theme) => {
    persistTheme(theme);
    set({ theme });
  },

  startRound: () => {
    const { difficulty, categories, seen, seenCounter, roundSize } = get();
    const { round, exhausted } = buildRound({
      all: QUESTIONS,
      difficulty,
      categories,
      seen,
      seed: randomSeed(),
      count: roundSize,
    });
    if (round.items.length === 0) return;
    const { seen: nextSeen, counter } = markSeen(exhausted ? {} : seen, seenCounter, round);
    set({
      round,
      screen: 'question',
      index: 0,
      answers: [],
      selected: null,
      revealed: false,
      timedOut: false,
      result: null,
      isRecord: false,
      poolRecycled: exhausted,
      roundStartedAt: Date.now(),
      elapsedMs: null,
      inputLockedUntil: Date.now() + TRANSITION_LOCK_MS,
      advanceUnlockAt: 0,
      seen: nextSeen,
      seenCounter: counter,
      challenge: null,
    });
  },

  acceptChallenge: () => {
    const payload = get().challenge;
    if (!payload) return;
    const round = buildRoundFromIds({
      all: QUESTIONS,
      ids: payload.questionIds,
      difficulty: payload.difficulty,
      categories: payload.categories,
      seed: payload.seed,
    });
    if (!round) {
      set({ challenge: null });
      return;
    }
    const { seen, seenCounter } = get();
    const marked = markSeen(seen, seenCounter, round);
    set({
      round,
      screen: 'question',
      difficulty: payload.difficulty,
      index: 0,
      answers: [],
      selected: null,
      revealed: false,
      timedOut: false,
      result: null,
      isRecord: false,
      poolRecycled: false,
      roundStartedAt: Date.now(),
      elapsedMs: null,
      inputLockedUntil: Date.now() + TRANSITION_LOCK_MS,
      advanceUnlockAt: 0,
      seen: marked.seen,
      seenCounter: marked.counter,
    });
  },

  dismissChallenge: () => set({ challenge: null }),

  answer: (originalIndex) => {
    const state = get();
    const item = state.round?.items[state.index];
    if (!item || state.revealed) return;
    if (Date.now() < state.inputLockedUntil) return;

    const correct = originalIndex === item.question.correctIndex;
    set({
      selected: originalIndex,
      revealed: true,
      timedOut: false,
      advanceUnlockAt: Date.now() + ADVANCE_LOCK_MS,
      answers: [
        ...state.answers,
        { questionId: item.question.id, chosenIndex: originalIndex, correct },
      ],
    });
  },

  timeout: () => {
    const state = get();
    const item = state.round?.items[state.index];
    if (!item || state.revealed) return;
    set({
      selected: null,
      revealed: true,
      timedOut: true,
      advanceUnlockAt: Date.now() + ADVANCE_LOCK_MS,
      answers: [...state.answers, { questionId: item.question.id, chosenIndex: null, correct: false }],
    });
  },

  advance: () => {
    const state = get();
    if (!state.round || !state.revealed) return;
    if (Date.now() < state.advanceUnlockAt) return;

    const next = state.index + 1;
    if (next < state.round.items.length) {
      set({
        index: next,
        selected: null,
        revealed: false,
        timedOut: false,
        inputLockedUntil: Date.now() + TRANSITION_LOCK_MS,
        advanceUnlockAt: 0,
      });
      return;
    }

    const result = scoreRound(state.round, state.answers);
    const previous = state.stats.byDifficulty[result.difficulty];
    const previousRounds = previous?.rounds ?? 0;
    const beatsPrevious = isBetterScore(
      result.score,
      result.total,
      previous?.best ?? 0,
      previous?.bestTotal ?? 0,
    );
    const stats = applyResult(state.stats, result);
    writeJson(KEYS.stats, stats);
    set({
      screen: 'results',
      result,
      stats,
      elapsedMs: state.roundStartedAt === null ? null : Date.now() - state.roundStartedAt,
      // Prima rundă la o dificultate nu e „record”, oricât de bine ar merge.
      isRecord: previousRounds > 0 && beatsPrevious,
    });
  },

  quitRound: () =>
    set({
      screen: 'start',
      round: null,
      answers: [],
      index: 0,
      selected: null,
      revealed: false,
      timedOut: false,
      result: null,
      roundStartedAt: null,
      elapsedMs: null,
    }),

  goToReview: () => set({ screen: 'review' }),
  goToResults: () => set({ screen: 'results' }),

  /** Un link de provocare deschis într-o filă deja pornită trebuie să fie observat. */
  syncChallengeFromHash: () => {
    const payload = readChallenge();
    if (!payload) return;
    const current = get().challenge;
    if (current && current.seed === payload.seed && current.score === payload.score) return;
    set({
      challenge: payload,
      screen: 'start',
      round: null,
      answers: [],
      index: 0,
      selected: null,
      revealed: false,
      result: null,
    });
  },
  goToStart: () =>
    set({
      screen: 'start',
      round: null,
      answers: [],
      index: 0,
      selected: null,
      revealed: false,
      result: null,
    }),

  shareToken: () => {
    const { round, result } = get();
    if (!round) return '';
    return encodeShare({
      difficulty: round.difficulty,
      categories: round.categories,
      seed: round.seed,
      questionIds: round.items.map((i) => i.question.id),
      // În timpul rundei nu există încă scor: linkul invită la aceeași rundă.
      score: result ? result.score : null,
    });
  },

  shareLink: () => {
    const token = get().shareToken();
    if (!token || typeof window === 'undefined') return '';
    return `${window.location.href.replace(/#.*$/, '').replace(/\?.*$/, '')}#p=${token}`;
  },

  clearData: () => {
    clearAll();
    applyTheme('dark');
    set({
      stats: emptyStats(),
      seen: {},
      seenCounter: 0,
      difficulty: 'mediu',
      categories: [...CATEGORY_IDS],
      timerEnabled: false,
      theme: 'dark',
      roundSize: ROUND_SIZE,
    });
  },
}));

function markSeen(seen: SeenMap, counter: number, round: Round): { seen: SeenMap; counter: number } {
  const next: SeenMap = { ...seen };
  let c = counter;
  for (const item of round.items) {
    c += 1;
    next[item.question.id] = c;
  }
  writeJson(KEYS.seen, next);
  writeJson(KEYS.seenCounter, c);
  return { seen: next, counter: c };
}

export { ROUND_SIZE, ROUND_SIZES, MIN_CATEGORIES };
export type { RoundSize };
