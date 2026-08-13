import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { categoryName } from '../data/categories';
import { DIFFICULTY_LABEL, ro } from '../i18n/ro';
import { verdictFor } from '../i18n/verdicts';
import { averagePerQuestion, formatDuration } from '../game/duration';
import { useGame } from '../store/useGame';
import { CheckMark, GhostNumeral, ScoreBar, ShareIcon } from './Motif';

export function ResultsScreen() {
  const result = useGame((s) => s.result);
  const round = useGame((s) => s.round);
  const isRecord = useGame((s) => s.isRecord);
  const elapsedMs = useGame((s) => s.elapsedMs);
  const goToReview = useGame((s) => s.goToReview);
  const goToStart = useGame((s) => s.goToStart);
  const shareLink = useGame((s) => s.shareLink);

  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  if (!result || !round) return null;

  // Verdictul e legat de sămânța rundei, ca să nu se schimbe la re-randare.
  const verdict = verdictFor(result.score, result.total, round.seed);
  const perQuestion = elapsedMs === null ? null : averagePerQuestion(elapsedMs, result.total);

  async function handleShare() {
    const link = shareLink();
    if (!link) return;
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

          <h1 className="mt-6 text-[clamp(1.9rem,7.5vw,2.9rem)] text-text">{verdict}</h1>
          <p className="mt-3 text-[1.125rem] text-dim sm:text-[1.1875rem]">
            {ro.results.scoreLine(result.score, result.total)}
            <span className="mx-2 text-line-hi">/</span>
            {DIFFICULTY_LABEL[result.difficulty]}
          </p>

          {elapsedMs !== null && (
            <p className="mt-5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-mono text-[0.9375rem] tracking-[0.02em] text-dim">
              <span className="whitespace-nowrap">
                {ro.results.duration} <span className="font-semibold text-text">{formatDuration(elapsedMs)}</span>
              </span>
              {perQuestion && (
                <>
                  <span aria-hidden="true" className="text-line-hi">
                    ·
                  </span>
                  <span className="whitespace-nowrap">
                    {ro.results.perQuestionPrefix} <span className="font-semibold text-text">{perQuestion}</span>{' '}
                    {ro.results.perQuestionSuffix}
                  </span>
                </>
              )}
            </p>
          )}

          {isRecord && (
            <p className="label mt-5 inline-flex items-center gap-2 rounded-full border border-accent bg-accent-veil px-4 py-2 text-accent-ink">
              {ro.results.newRecord(DIFFICULTY_LABEL[result.difficulty])}
            </p>
          )}

          <div className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <button type="button" className="btn btn-primary flex-1 sm:flex-none" onClick={goToReview}>
              {ro.results.review}
            </button>
            <button type="button" className="btn btn-share flex-1 sm:flex-none" onClick={handleShare}>
              {copied ? (
                <>
                  <CheckMark className="size-5" /> {ro.results.shareCopied}
                </>
              ) : (
                <>
                  <ShareIcon className="size-5" /> {ro.results.share}
                </>
              )}
            </button>
            <button type="button" className="btn btn-ghost flex-1 sm:flex-none" onClick={goToStart}>
              {ro.results.playAgain}
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
        </section>

        {/* ── Defalcarea pe categorii ── */}
        <section className="relative mt-14 lg:mt-0">
          <GhostNumeral value="%" className="-top-8 right-0 hidden text-[14rem] lg:block" />
          <h2 className="label text-faint">{ro.results.breakdown}</h2>
          <ul className="mt-5 space-y-4">
            {result.breakdown.map((row) => (
              <li key={row.category}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="min-w-0 flex-1 truncate text-[1.125rem] font-medium text-text">
                    {categoryName(row.category)}
                  </span>
                  <span className="numeral shrink-0 text-[1.1875rem] text-dim">
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
