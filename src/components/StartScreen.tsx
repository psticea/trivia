import { CATEGORIES } from '../data/categories';
import { QUESTION_COUNT } from '../data';
import type { Difficulty } from '../data/types';
import { ro } from '../i18n/ro';
import { MIN_CATEGORIES, ROUND_SIZES, useGame } from '../store/useGame';
import { ArrowRight, CheckMark, GhostNumeral } from './Motif';

const DIFFICULTIES: { id: Difficulty; label: string; hint: string }[] = [
  { id: 'usor', label: ro.difficulty.usor, hint: ro.difficulty.usorHint },
  { id: 'mediu', label: ro.difficulty.mediu, hint: ro.difficulty.mediuHint },
  { id: 'dificil', label: ro.difficulty.dificil, hint: ro.difficulty.dificilHint },
];

export function StartScreen() {
  const difficulty = useGame((s) => s.difficulty);
  const categories = useGame((s) => s.categories);
  const roundSize = useGame((s) => s.roundSize);
  const challenge = useGame((s) => s.challenge);
  const setDifficulty = useGame((s) => s.setDifficulty);
  const setRoundSize = useGame((s) => s.setRoundSize);
  const toggleCategory = useGame((s) => s.toggleCategory);
  const selectAllCategories = useGame((s) => s.selectAllCategories);
  const startRound = useGame((s) => s.startRound);
  const acceptChallenge = useGame((s) => s.acceptChallenge);
  const dismissChallenge = useGame((s) => s.dismissChallenge);

  const atMinimum = categories.length <= MIN_CATEGORIES;
  const activeIndex = DIFFICULTIES.findIndex((d) => d.id === difficulty);
  const activeHint = DIFFICULTIES[activeIndex]?.hint ?? '';

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-36 pt-4 sm:px-8 lg:pb-20 lg:pt-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-20">
        {/* ── Titlul ── */}
        <header className="relative lg:sticky lg:top-16">
          {/* Provocarea primează: apare prima, înaintea titlului. */}
          {challenge && (
            <section className="relative mt-2 rounded-lg border border-accent bg-accent-veil p-5 sm:p-6">
              <p className="label text-accent-ink">{ro.start.challengeIntro}</p>
              <p className="mt-2.5 text-[1.125rem] leading-snug text-text">
                {challenge.score === null
                  ? ro.start.challengeDetailOpen(challenge.questionIds.length)
                  : ro.start.challengeDetail(challenge.score, challenge.questionIds.length)}
              </p>
              <button type="button" className="btn btn-primary mt-5 w-full sm:w-auto" onClick={acceptChallenge}>
                {ro.start.challengeStart}
                <ArrowRight className="size-5" />
              </button>
              <button
                type="button"
                className="mt-4 block text-[1.0625rem] font-semibold text-dim underline-offset-4 transition-colors hover:text-text hover:underline"
                onClick={dismissChallenge}
              >
                {ro.start.challengeDismiss}
              </button>
            </section>
          )}

          <GhostNumeral
            value={QUESTION_COUNT}
            className={`-right-2 text-[9rem] sm:text-[13rem] lg:text-[16rem] ${challenge ? 'top-52 sm:top-56' : '-top-4 lg:-top-10'}`}
          />

          <h1 className="relative mt-10 text-[clamp(3.4rem,15.5vw,6rem)] text-text lg:mt-14">
            Nouă sute
            <span className="block text-accent-ink">de întrebări</span>
          </h1>

          <p className="relative mt-7 max-w-[36ch] text-[1.1875rem] leading-[1.5] text-dim sm:text-[1.3125rem]">
            {ro.meta.subtitle}
          </p>

          <dl className="relative mt-10 grid grid-cols-3 gap-5 border-t border-line pt-6">
            {[
              { label: ro.start.fondLabel, value: QUESTION_COUNT },
              { label: 'Categorii', value: 10 },
              { label: 'Pe rundă', value: roundSize },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="label text-faint">{stat.label}</dt>
                <dd className="numeral mt-2 text-[2.1rem] leading-none text-text">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        {/* ── Configurarea rundei ── */}
        <section className="mt-14 lg:mt-16">
          {challenge && <p className="mb-6 text-[1rem] leading-snug text-faint">{ro.start.settingsApplyToNewRound}</p>}
          <fieldset className="border-0 p-0">
            <legend className="label text-faint">{ro.start.chooseDifficulty}</legend>
            <div className="relative mt-4 grid grid-cols-3 rounded-full border border-line bg-surface p-1.5">
              <span
                aria-hidden="true"
                className="absolute inset-y-1.5 left-1.5 rounded-full bg-accent transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]"
                style={{
                  width: 'calc((100% - 0.75rem) / 3)',
                  transform: `translateX(${activeIndex * 100}%)`,
                }}
              />
              {DIFFICULTIES.map((d) => {
                const active = d.id === difficulty;
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setDifficulty(d.id)}
                    className={[
                      'relative z-10 min-h-14 rounded-full px-2 text-[1.125rem] font-semibold transition-colors duration-[var(--dur-fast)]',
                      active ? 'text-on-accent' : 'text-dim hover:text-text',
                    ].join(' ')}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3.5 pl-1 text-[1.125rem] text-faint">{activeHint}</p>
          </fieldset>

          <fieldset className="mt-10 border-0 p-0">
            <legend className="label text-faint">{ro.start.roundLength}</legend>
            <div className="relative mt-4 grid grid-cols-2 rounded-full border border-line bg-surface p-1.5">
              <span
                aria-hidden="true"
                className="absolute inset-y-1.5 left-1.5 rounded-full bg-accent transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]"
                style={{
                  width: 'calc((100% - 0.75rem) / 2)',
                  transform: `translateX(${ROUND_SIZES.indexOf(roundSize) * 100}%)`,
                }}
              />
              {ROUND_SIZES.map((n) => {
                const active = n === roundSize;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setRoundSize(n)}
                    className={[
                      'relative z-10 min-h-14 rounded-full px-2 text-[1.125rem] font-semibold transition-colors duration-[var(--dur-fast)]',
                      active ? 'text-on-accent' : 'text-dim hover:text-text',
                    ].join(' ')}
                  >
                    {ro.start.roundLengthValue(n)}
                  </button>
                );
              })}
            </div>
            <p className="mt-3.5 pl-1 text-[1.125rem] text-faint">{ro.start.roundLengthHint(roundSize)}</p>
          </fieldset>

          <div className="mt-12">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="label text-faint">{ro.start.categories}</h2>
              <span className="label text-faint">{ro.start.selected(categories.length)}</span>
            </div>

            <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {CATEGORIES.map((cat) => {
                const on = categories.includes(cat.id);
                const locked = on && atMinimum;
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={ro.a11y.categoryToggle(cat.name)}
                      aria-describedby={locked ? 'cat-min-note' : undefined}
                      disabled={locked}
                      onClick={() => toggleCategory(cat.id)}
                      className={[
                        'flex min-h-16 w-full items-center gap-3.5 rounded-md border px-4 text-left',
                        'transition-[background-color,border-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]',
                        on
                          ? 'border-accent/45 bg-accent-veil text-text'
                          : 'border-line bg-surface text-faint hover:border-line-hi hover:text-dim',
                        locked ? 'cursor-default' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                          on ? 'border-accent bg-accent text-on-accent' : 'border-line-hi',
                        ].join(' ')}
                      >
                        {on && <CheckMark className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[1.125rem] leading-tight font-semibold">
                          {cat.name}
                        </span>
                        <span className="mt-1 block truncate text-[0.9375rem] leading-tight text-faint">
                          {cat.blurb}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="text-[1.0625rem] font-semibold text-accent-ink underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-35"
                onClick={selectAllCategories}
                disabled={categories.length === CATEGORIES.length}
              >
                {ro.start.allCategories}
              </button>
              <p id="cat-min-note" className={`text-[1rem] ${atMinimum ? 'text-accent-ink' : 'text-faint'}`}>
                {ro.start.minWarning}
              </p>
            </div>
          </div>

          <div className="mt-12 hidden lg:block">
            {challenge ? (
              <div className="flex gap-3">
                <button type="button" className="btn btn-primary flex-1" onClick={acceptChallenge}>
                  {ro.start.challengeStart}
                  <ArrowRight className="size-5" />
                </button>
                <button type="button" className="btn btn-ghost shrink-0" onClick={startRound}>
                  {ro.start.newRound}
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-primary w-full" onClick={startRound}>
                {ro.start.play}
                <ArrowRight className="size-5" />
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Bara fixă urmează aceeași ierarhie: provocarea e acțiunea principală. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 lg:hidden">
        <div className="h-12 bg-gradient-to-t from-bg to-transparent" />
        <div className="pointer-events-auto bg-bg px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
          {challenge ? (
            <div className="flex gap-2.5">
              <button
                type="button"
                className="btn btn-primary min-w-0 flex-1 px-4 whitespace-nowrap"
                onClick={acceptChallenge}
              >
                <span className="hidden xs:inline">{ro.start.challengeStart}</span>
                <span className="xs:hidden">{ro.start.challengeStartShort}</span>
                <ArrowRight className="size-5" />
              </button>
              <button type="button" className="btn btn-ghost shrink-0 px-5 whitespace-nowrap" onClick={startRound}>
                {ro.start.newRound}
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-primary w-full" onClick={startRound}>
              {ro.start.play}
              <ArrowRight className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
