import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CATEGORY_BY_ID } from '../data/categories';
import { DIFFICULTY_LABEL, OPTION_LETTERS, ro } from '../i18n/ro';
import { TIMER_SECONDS, useGame } from '../store/useGame';
import { ArrowRight, CheckMark, CrossMark, GhostNumeral, ProgressRail, ShareIcon } from './Motif';

export function QuestionScreen() {
  const round = useGame((s) => s.round);
  const index = useGame((s) => s.index);
  const answers = useGame((s) => s.answers);
  const selected = useGame((s) => s.selected);
  const revealed = useGame((s) => s.revealed);
  const timedOut = useGame((s) => s.timedOut);
  const timerEnabled = useGame((s) => s.timerEnabled);
  const answer = useGame((s) => s.answer);
  const advance = useGame((s) => s.advance);
  const onTimeout = useGame((s) => s.timeout);
  const quitRound = useGame((s) => s.quitRound);
  const shareLink = useGame((s) => s.shareLink);

  const reduceMotion = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [remaining, setRemaining] = useState(TIMER_SECONDS);
  const [invited, setInvited] = useState(false);
  const [inviteFallback, setInviteFallback] = useState<string | null>(null);

  /** Linkul rundei se poate trimite oricând, nu doar la final: jucați împreună. */
  async function handleInvite() {
    const link = shareLink();
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setInvited(true);
      window.setTimeout(() => setInvited(false), 2400);
    } catch {
      setInviteFallback(link);
    }
  }

  const item = round?.items[index];
  const total = round?.items.length ?? 0;

  // Focusul trece pe întrebarea nouă, ca cititoarele de ecran să nu rămână în urmă.
  useEffect(() => {
    headingRef.current?.focus();
    scrollRef.current?.scrollTo({ top: 0 });
  }, [index]);

  useEffect(() => {
    if (!timerEnabled || revealed || !item) return;
    setRemaining(TIMER_SECONDS);
    const started = Date.now();
    const id = window.setInterval(() => {
      const left = TIMER_SECONDS - Math.floor((Date.now() - started) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        window.clearInterval(id);
        onTimeout();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [timerEnabled, revealed, item, index, onTimeout]);

  useEffect(() => {
    if (!revealed) return;
    const node = scrollRef.current;
    if (!node) return;
    const id = window.setTimeout(() => {
      node.scrollTo({ top: node.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
    }, 60);
    return () => window.clearTimeout(id);
  }, [revealed, reduceMotion]);

  if (!round || !item) return null;

  const question = item.question;
  const category = CATEGORY_BY_ID[question.category];
  const results: (boolean | null)[] = Array.from({ length: total }, (_, i) =>
    i < answers.length ? answers[i].correct : null,
  );
  const isLast = index === total - 1;
  const answeredCorrectly = revealed && selected === question.correctIndex;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6">
        <ProgressRail total={total} current={index} results={results} />
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
          {/* ── Antetul rundei ── */}
          <div className="flex items-center justify-between gap-4 pt-4 lg:pt-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="label truncate text-[0.75rem] text-accent-ink sm:text-[0.8125rem]">{category.name}</span>
              <span aria-hidden="true" className="text-line-hi">
                /
              </span>
              <p
                className="label shrink-0 text-[0.75rem] text-faint sm:text-[0.8125rem]"
                role="status"
                aria-live="polite"
                aria-label={ro.a11y.progressRegion}
              >
                {ro.round.progressShort(index + 1, total)}
              </p>
              <span aria-hidden="true" className="hidden text-line-hi sm:inline">
                /
              </span>
              <span className="label hidden truncate text-[0.8125rem] text-faint sm:inline">
                {DIFFICULTY_LABEL[question.difficulty]}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className={[
                  'label flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[0.75rem] sm:text-[0.8125rem]',
                  'transition-[background-color,border-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]',
                  invited
                    ? 'border-accent bg-accent text-on-accent'
                    : 'border-accent/55 bg-accent-veil text-accent-ink hover:border-accent hover:bg-accent hover:text-on-accent',
                ].join(' ')}
                onClick={handleInvite}
                aria-label={ro.round.inviteAria}
              >
                {invited ? <CheckMark className="size-4" /> : <ShareIcon className="size-4" />}
                <span>{invited ? ro.round.inviteCopied : ro.round.invite}</span>
              </button>
              <button
                type="button"
                className="label min-h-11 text-[0.75rem] text-faint transition-colors hover:text-text sm:text-[0.8125rem]"
                onClick={() => {
                  if (window.confirm(ro.round.quitConfirm)) quitRound();
                }}
              >
                {ro.round.quit}
              </button>
            </div>
          </div>

          {timerEnabled && !revealed && (
            <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-accent transition-[width] duration-1000 ease-linear"
                style={{ width: `${(remaining / TIMER_SECONDS) * 100}%` }}
              />
            </div>
          )}

          {inviteFallback && (
            <div className="mt-3">
              <p className="label text-faint">{ro.results.shareFallback}</p>
              <input
                readOnly
                value={inviteFallback}
                onFocus={(e) => e.currentTarget.select()}
                className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2.5 font-mono text-[0.8125rem] text-dim"
              />
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={question.id}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative lg:grid lg:min-h-[74vh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16"
            >
              <GhostNumeral
                value={String(index + 1).padStart(2, '0')}
                className="-top-2 right-0 text-[8rem] sm:text-[11rem] lg:top-6 lg:left-0 lg:text-[19rem]"
              />

              {/* Cutie cu înălțime rezervată: opțiunile nu se mișcă între întrebări. */}
              <div className="relative flex min-h-[9rem] items-end pt-6 sm:min-h-[10rem] lg:min-h-0 lg:items-center lg:pt-0">
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  id="question-text"
                  className="text-[clamp(1.75rem,7vw,3rem)] text-text outline-none"
                >
                  {question.question}
                </h2>
              </div>

              <div className="relative">
                <div
                  role="group"
                  aria-labelledby="question-text"
                  className="mt-7 grid grid-cols-1 gap-2.5 lg:mt-0 lg:gap-3"
                >
                  {item.optionOrder.map((originalIndex, slot) => {
                    const isCorrect = originalIndex === question.correctIndex;
                    const isChosen = selected === originalIndex;
                    const showCorrect = revealed && isCorrect;
                    const showWrong = revealed && isChosen && !isCorrect;
                    const dimmed = revealed && !isCorrect && !isChosen;

                    return (
                      <button
                        key={originalIndex}
                        type="button"
                        disabled={revealed}
                        onClick={() => answer(originalIndex)}
                        aria-label={`${ro.a11y.optionPrefix(OPTION_LETTERS[slot])}: ${question.options[originalIndex]}`}
                        className={[
                          'group flex min-h-[4.25rem] w-full items-center gap-4 rounded-lg border px-4 py-3.5 text-left',
                          'transition-[background-color,border-color,opacity,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]',
                          showCorrect
                            ? 'border-accent bg-accent-veil text-text'
                            : showWrong
                              ? 'border-wrong bg-wrong-veil text-text'
                              : 'border-line bg-surface text-text',
                          dimmed ? 'opacity-55' : '',
                          !revealed
                            ? 'cursor-pointer hover:border-line-hi hover:bg-surface-hi active:scale-[0.995]'
                            : 'cursor-default',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'label flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors',
                            showCorrect
                              ? 'border-accent bg-accent text-on-accent'
                              : showWrong
                                ? 'border-wrong bg-wrong text-bg'
                                : 'border-line-hi text-faint group-hover:border-text group-hover:text-text',
                          ].join(' ')}
                        >
                          {showCorrect ? (
                            <CheckMark className="size-4" />
                          ) : showWrong ? (
                            <CrossMark className="size-3.5" />
                          ) : (
                            OPTION_LETTERS[slot]
                          )}
                        </span>
                        <span className="flex-1 text-[1.1875rem] leading-snug font-medium sm:text-[1.25rem]">
                          {question.options[originalIndex]}
                        </span>
                        {showCorrect && <span className="label shrink-0 text-accent-ink">{ro.round.correct}</span>}
                        {showWrong && <span className="label shrink-0 text-wrong-ink">{ro.round.incorrect}</span>}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {revealed && (
                    <motion.section
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-4 rounded-lg border border-line bg-surface p-5"
                    >
                      <div role="status" aria-live="polite" aria-label={ro.a11y.answerFeedback}>
                        <p className="label flex items-center gap-2">
                          {timedOut ? (
                            <span className="text-accent-ink">{ro.round.timeUp}</span>
                          ) : answeredCorrectly ? (
                            <span className="flex items-center gap-1.5 text-accent-ink">
                              <CheckMark className="size-3.5" /> {ro.round.correct}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-wrong-ink">
                              <CrossMark className="size-3.5" /> {ro.round.incorrect}
                            </span>
                          )}
                        </p>
                        {!answeredCorrectly && (
                          <p className="mt-2 text-[1.125rem] leading-snug text-faint">
                            {ro.round.reveal}{' '}
                            <span className="font-semibold text-text">{question.options[question.correctIndex]}</span>
                          </p>
                        )}
                      </div>
                      <p className="mt-3 text-[1.125rem] leading-[1.5] text-dim sm:text-[1.1875rem]">
                        {question.explanation}
                      </p>
                      {question.source && (
                        <p className="label mt-3.5 text-faint opacity-80">
                          {ro.round.source}: {question.source}
                        </p>
                      )}
                    </motion.section>
                  )}
                </AnimatePresence>

                <div className="hidden lg:mt-8 lg:block">
                  <button type="button" className="btn btn-primary w-full" onClick={advance} disabled={!revealed}>
                    {isLast ? ro.round.finish : ro.round.advance}
                    <ArrowRight className="size-5" />
                  </button>
                  <p className="label mt-3.5 text-center text-faint opacity-70">{ro.round.keyHint}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="h-6 lg:h-12" />
        </div>
      </div>

      {/* Subsol cu înălțime rezervată permanent: fără salt de layout între întrebări. */}
      <footer className="shrink-0 border-t border-line bg-bg px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3.5 sm:px-8 lg:hidden">
        <button type="button" className="btn btn-primary w-full" onClick={advance} disabled={!revealed}>
          {isLast ? ro.round.finish : ro.round.advance}
          <ArrowRight className="size-5" />
        </button>
      </footer>
    </div>
  );
}
