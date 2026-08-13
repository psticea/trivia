import { useEffect, useRef, useState } from 'react';
import { categoryName } from '../data/categories';
import type { Difficulty } from '../data/types';
import { DIFFICULTY_LABEL, ro } from '../i18n/ro';
import { accuracy, rankedCategories } from '../game/scoring';
import { useGame } from '../store/useGame';
import type { Theme } from '../theme';

/** Dialog nativ: focus trap, Escape și rol ARIA fără bibliotecă suplimentară. */
function Sheet({
  open,
  onClose,
  title,
  corner,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  corner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto max-h-[100dvh] w-full max-w-none border-0 bg-transparent p-0 sm:m-auto sm:max-w-[36rem]"
    >
      <div className="flex max-h-[92dvh] flex-col rounded-t-lg border border-line bg-veil sm:rounded-lg">
        <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-6 sm:px-8">
          <h2 className="text-[1.75rem] text-text">{title}</h2>
          <div className="flex items-center gap-4">
            {corner}
            <button
              type="button"
              className="label rounded-full border border-line-hi px-4 py-2.5 text-dim transition-colors hover:border-text hover:text-text"
              onClick={onClose}
            >
              {ro.stats.close}
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-8">
          {children}
        </div>
      </div>
    </dialog>
  );
}

export function StatsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stats = useGame((s) => s.stats);
  const tiers: Difficulty[] = ['copii', 'usor', 'mediu', 'dificil'];
  const played = tiers.reduce((n, t) => n + stats.byDifficulty[t].rounds, 0);
  const ranked = rankedCategories(stats);

  const totalAnswered = tiers.reduce((n, t) => n + stats.byDifficulty[t].totalQuestions, 0);
  const totalCorrect = tiers.reduce((n, t) => n + stats.byDifficulty[t].totalCorrect, 0);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={ro.stats.heading}
      corner={
        totalAnswered > 0 ? (
          <div className="text-right">
            <span className="label block text-faint">{ro.stats.overall}</span>
            <span className="numeral text-[1.5rem] leading-none text-accent-ink">
              {totalCorrect}
              <span className="text-faint">/{totalAnswered}</span>
            </span>
          </div>
        ) : null
      }
    >
      {played === 0 ? (
        <p className="text-[1.1875rem] leading-snug text-faint">{ro.stats.empty}</p>
      ) : (
        <>
          <p className="label text-faint">{ro.stats.perDifficulty}</p>
          <ul className="mt-4 space-y-2.5">
            {tiers.map((t) => {
              const s = stats.byDifficulty[t];
              const acc = accuracy(s);
              return (
                <li key={t} className="rounded-md border border-line bg-surface px-4 py-4">
                  <div className="flex items-center gap-4">
                    <span className="flex-1 text-[1.125rem] font-semibold text-text">
                      {DIFFICULTY_LABEL[t]}
                    </span>
                    <span className="w-14 text-right">
                      <span className="label block text-faint">{ro.stats.rounds}</span>
                      <span className="numeral text-[1.25rem] text-text">{s.rounds}</span>
                    </span>
                    <span className="w-16 text-right">
                      <span className="label block text-faint">{ro.stats.average}</span>
                      <span className="numeral text-[1.25rem] text-text">
                        {acc === null ? '—' : `${Math.round(acc * 100)}%`}
                      </span>
                    </span>
                    <span className="w-20 text-right">
                      <span className="label block text-faint">{ro.stats.best}</span>
                      <span className="numeral text-[1.25rem] text-accent-ink">
                        {s.rounds === 0 ? '—' : `${s.best}/${s.bestTotal}`}
                      </span>
                    </span>
                  </div>
                  <p className="label mt-3 border-t border-line pt-3 text-faint">
                    {s.totalQuestions === 0
                      ? ro.stats.noAnswers
                      : ro.stats.answeredLine(s.totalCorrect, s.totalQuestions)}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="mt-9">
            {ranked.length < 2 ? (
              <p className="text-[1.125rem] text-faint">{ro.stats.needMore}</p>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div>
                  <p className="label text-accent-ink">{ro.stats.strongest}</p>
                  <ul className="mt-3 space-y-2">
                    {ranked.slice(0, 3).map((r) => (
                      <li key={r.category} className="flex items-center gap-3 text-[1.0625rem] text-dim">
                        <span className="flex-1 truncate">{categoryName(r.category)}</span>
                        <span className="numeral text-text">{Math.round(r.pct * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="label text-wrong-ink">{ro.stats.weakest}</p>
                  <ul className="mt-3 space-y-2">
                    {ranked
                      .slice(-3)
                      .reverse()
                      .map((r) => (
                        <li key={r.category} className="flex items-center gap-3 text-[1.0625rem] text-dim">
                          <span className="flex-1 truncate">{categoryName(r.category)}</span>
                          <span className="numeral text-text">{Math.round(r.pct * 100)}%</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid shrink-0 rounded-full border border-line bg-surface p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={[
              'min-h-12 rounded-full px-4 text-[1rem] font-semibold transition-colors duration-[var(--dur-fast)]',
              active ? 'bg-accent text-on-accent' : 'text-dim hover:text-text',
            ].join(' ')}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const timerEnabled = useGame((s) => s.timerEnabled);
  const setTimerEnabled = useGame((s) => s.setTimerEnabled);
  const theme = useGame((s) => s.theme);
  const setTheme = useGame((s) => s.setTheme);
  const clearData = useGame((s) => s.clearData);
  const [cleared, setCleared] = useState(false);

  return (
    <Sheet open={open} onClose={onClose} title={ro.settings.heading}>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-[14rem] flex-1">
          <p className="text-[1.125rem] font-semibold text-text">{ro.settings.theme}</p>
          <p className="mt-1.5 text-[1rem] leading-snug text-faint">{ro.settings.themeHint}</p>
        </div>
        <Segmented<Theme>
          label={ro.settings.theme}
          value={theme}
          onChange={setTheme}
          options={[
            { id: 'dark', label: ro.settings.dark },
            { id: 'light', label: ro.settings.light },
          ]}
        />
      </div>

      <hr className="my-7 border-0 border-t border-line" />

      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-[14rem] flex-1">
          <p className="text-[1.125rem] font-semibold text-text">{ro.settings.timer}</p>
          <p className="mt-1.5 text-[1rem] leading-snug text-faint">{ro.settings.timerHint}</p>
        </div>
        <Segmented<'on' | 'off'>
          label={ro.settings.timer}
          value={timerEnabled ? 'on' : 'off'}
          onChange={(v) => setTimerEnabled(v === 'on')}
          options={[
            { id: 'off', label: ro.settings.off },
            { id: 'on', label: ro.settings.on },
          ]}
        />
      </div>

      <hr className="my-7 border-0 border-t border-line" />

      <p className="text-[1.125rem] font-semibold text-text">{ro.settings.data}</p>
      <p className="mt-1.5 text-[1rem] leading-snug text-faint">{ro.settings.dataHint}</p>
      <button
        type="button"
        className="btn btn-ghost mt-5 border-wrong text-wrong-ink hover:border-wrong hover:bg-wrong-veil"
        onClick={() => {
          if (window.confirm(ro.settings.clearConfirm)) {
            clearData();
            setCleared(true);
            window.setTimeout(() => setCleared(false), 2400);
          }
        }}
      >
        {cleared ? ro.settings.cleared : ro.settings.clear}
      </button>
    </Sheet>
  );
}
