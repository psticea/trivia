import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CATEGORY_BY_ID } from '../data/categories';
import { DIFFICULTY_LABEL, ro } from '../i18n/ro';
import { shareUrl } from '../game/share';
import { useGame } from '../store/useGame';
import { CheckMark, GhostNumeral, ScoreBar } from './Motif';

function verdict(score: number, total: number): string {
  const ratio = score / total;
  if (score === total) return ro.results.perfect;
  if (ratio >= 0.7) return ro.results.strong;
  if (ratio >= 0.4) return ro.results.fair;
  return ro.results.weak;
}

export function ResultsScreen() {
  const result = useGame((s) => s.result);
  const round = useGame((s) => s.round);
  const isRecord = useGame((s) => s.isRecord);
  const goToReview = useGame((s) => s.goToReview);
  const startRound = useGame((s) => s.startRound);
  const goToStart = useGame((s) => s.goToStart);
  const shareToken = useGame((s) => s.shareToken);

  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  if (!result || !round) return null;

  const link = shareUrl(
    {
      difficulty: round.difficulty,
      categories: round.categories,
      seed: round.seed,
      questionIds: round.items.map((i) => i.question.id),
      score: result.score,
    },
    typeof window === 'undefined' ? '' : window.location.href,
  );

  async function handleShare() {
    if (!shareToken()) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setFallbackUrl(link);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-20 pt-6 sm:px-8 lg:pt-12">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-20">
        {/* ── Scorul ── */}
        <section className="relative">
          <p className="label text-faint">{ro.results.heading}</p>

          <div className="mt-4 flex items-end gap-3">
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="numeral text-[clamp(6rem,30vw,11rem)] leading-[0.8] text-accent-ink"
            >
              {result.score}
            </motion.span>
            <span className="numeral mb-2 text-[clamp(2rem,8vw,3rem)] leading-none text-faint">
              /{result.total}
            </span>
          </div>

          <h1 className="mt-6 text-[clamp(1.9rem,7.5vw,2.9rem)] text-text">{verdict(result.score, result.total)}</h1>
          <p className="mt-3 text-[1.0625rem] text-dim sm:text-[1.125rem]">
            {ro.results.scoreLine(result.score, result.total)}
            <span className="mx-2 text-line-hi">/</span>
            {DIFFICULTY_LABEL[result.difficulty]}
          </p>

          {isRecord && (
            <p className="label mt-5 inline-flex items-center gap-2 rounded-full border border-accent bg-accent-veil px-4 py-2 text-accent-ink">
              {ro.results.newRecord(DIFFICULTY_LABEL[result.difficulty])}
            </p>
          )}

          <div className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <button type="button" className="btn btn-primary flex-1 sm:flex-none" onClick={goToReview}>
              {ro.results.review}
            </button>
            <button type="button" className="btn btn-ghost flex-1 sm:flex-none" onClick={startRound}>
              {ro.results.playAgain}
            </button>
            <button type="button" className="btn btn-ghost flex-1 sm:flex-none" onClick={handleShare}>
              {copied ? (
                <span className="flex items-center gap-2 text-accent-ink">
                  <CheckMark className="size-4" /> {ro.results.shareCopied}
                </span>
              ) : (
                ro.results.share
              )}
            </button>
          </div>

          {fallbackUrl && (
            <div className="mt-5">
              <p className="label text-faint">{ro.results.shareFallback}</p>
              <input
                readOnly
                value={fallbackUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-3 font-mono text-[0.8125rem] text-dim"
              />
            </div>
          )}

          <button
            type="button"
            className="mt-7 block text-[1rem] font-semibold text-faint underline-offset-4 transition-colors hover:text-text hover:underline"
            onClick={goToStart}
          >
            {ro.results.backToStart}
          </button>
        </section>

        {/* ── Defalcarea pe categorii ── */}
        <section className="relative mt-14 lg:mt-0">
          <GhostNumeral value="%" className="-top-8 right-0 hidden text-[14rem] lg:block" />
          <h2 className="label text-faint">{ro.results.breakdown}</h2>
          <ul className="mt-5 space-y-4">
            {result.breakdown.map((row) => (
              <li key={row.category}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="min-w-0 flex-1 truncate text-[1.0625rem] font-medium text-text">
                    {CATEGORY_BY_ID[row.category].name}
                  </span>
                  <span className="numeral shrink-0 text-[1.125rem] text-dim">
                    {row.correct}/{row.total}
                  </span>
                </div>
                <div className="mt-2">
                  <ScoreBar correct={row.correct} total={row.total} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
