import { CATEGORY_BY_ID } from '../data/categories';
import { ro } from '../i18n/ro';
import { useGame } from '../store/useGame';
import { CheckMark, CrossMark } from './Motif';

/**
 * Recapitularea — ecranul unde jocul chiar dă ceva înapoi.
 * Fiecare întrebare devine o fișă completă: ce ai ales, ce era corect, de ce.
 */
export function ReviewScreen() {
  const round = useGame((s) => s.round);
  const answers = useGame((s) => s.answers);
  const result = useGame((s) => s.result);
  const goToResults = useGame((s) => s.goToResults);

  if (!round || !result) return null;
  const byId = new Map(answers.map((a) => [a.questionId, a]));

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-20 pt-6 sm:px-8 lg:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="label text-faint">{ro.review.counter(result.score, result.total)}</p>
          <h1 className="mt-3 text-[clamp(2.1rem,8vw,3.2rem)] text-text">{ro.review.heading}</h1>
        </div>
        <button type="button" className="btn btn-ghost" onClick={goToResults}>
          {ro.review.back}
        </button>
      </div>

      <ol className="mt-10 grid grid-cols-1 gap-3.5 lg:grid-cols-2 lg:gap-5">
        {round.items.map((item, i) => {
          const q = item.question;
          const answer = byId.get(q.id);
          const chosen = answer?.chosenIndex ?? null;
          const correct = answer?.correct ?? false;

          return (
            <li key={q.id} className="flex flex-col rounded-lg border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span
                  className={[
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    correct ? 'bg-accent text-on-accent' : 'bg-wrong text-bg',
                  ].join(' ')}
                >
                  {correct ? <CheckMark className="size-4" /> : <CrossMark className="size-3.5" />}
                </span>
                <span className="label min-w-0 flex-1 truncate text-faint">
                  {CATEGORY_BY_ID[q.category].name}
                </span>
                <span className="numeral shrink-0 text-[1.4rem] text-line-hi">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              <h2 className="mt-4 text-[1.3rem] leading-[1.2] text-text sm:text-[1.4rem]">{q.question}</h2>

              <dl className="mt-5 space-y-2.5 text-[1rem]">
                {!correct && (
                  <div className="flex gap-3">
                    <dt className="label w-[6.5rem] shrink-0 pt-1 text-faint">{ro.review.yourAnswer}</dt>
                    <dd className="flex-1 text-wrong-ink">
                      {chosen === null ? ro.review.noAnswer : q.options[chosen]}
                    </dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt className="label w-[6.5rem] shrink-0 pt-1 text-faint">{ro.review.correctAnswer}</dt>
                  <dd className="flex-1 font-semibold text-accent-ink">{q.options[q.correctIndex]}</dd>
                </div>
              </dl>

              <div className="mt-5 flex-1 border-t border-line pt-4">
                <p className="text-[1.0625rem] leading-[1.5] text-dim">{q.explanation}</p>
                {q.source && (
                  <p className="label mt-3 text-faint opacity-75">
                    {ro.round.source}: {q.source}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 flex justify-center">
        <button type="button" className="btn btn-primary" onClick={goToResults}>
          {ro.review.back}
        </button>
      </div>
    </div>
  );
}
