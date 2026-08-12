import { useCallback, useEffect, useState } from 'react';
import { QUESTION_COUNT } from './data';
import { ro } from './i18n/ro';
import { useGame } from './store/useGame';
import { StartScreen } from './components/StartScreen';
import { QuestionScreen } from './components/QuestionScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { SettingsDialog, StatsDialog } from './components/Dialogs';

export default function App() {
  const screen = useGame((s) => s.screen);
  const round = useGame((s) => s.round);
  const revealed = useGame((s) => s.revealed);
  const answer = useGame((s) => s.answer);
  const advance = useGame((s) => s.advance);
  const index = useGame((s) => s.index);

  const [statsOpen, setStatsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Joc complet de la tastatură: 1–4 aleg răspunsul, Enter/Space avansează.
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (screen !== 'question' || !round) return;
      if (statsOpen || settingsOpen) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const item = round.items[index];
      if (!item) return;

      if (['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault();
        const originalIndex = item.optionOrder[Number(event.key) - 1];
        if (originalIndex !== undefined) answer(originalIndex);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        if (!revealed) return;
        event.preventDefault();
        advance();
      }
    },
    [screen, round, index, revealed, answer, advance, statsOpen, settingsOpen],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  useEffect(() => {
    const onHashChange = () => useGame.getState().syncChallengeFromHash();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const chrome = screen !== 'question';

  return (
    <>
      {chrome && (
        <header className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
          <a href="." className="label flex items-center gap-2.5 text-text transition-colors hover:text-accent-ink">
            <span aria-hidden="true" className="block h-1 w-5 rounded-full bg-accent" />
            <span className="hidden whitespace-nowrap sm:inline">{ro.meta.title}</span>
          </a>
          <nav className="flex items-center gap-1">
            <button
              type="button"
              className="label min-h-11 rounded-full px-3.5 text-faint transition-colors hover:text-text"
              onClick={() => setStatsOpen(true)}
              aria-label={ro.a11y.openStats}
            >
              {ro.stats.heading}
            </button>
            <button
              type="button"
              className="label min-h-11 rounded-full px-3.5 text-faint transition-colors hover:text-text"
              onClick={() => setSettingsOpen(true)}
              aria-label={ro.a11y.openSettings}
            >
              {ro.settings.heading}
            </button>
          </nav>
        </header>
      )}

      <main>
        {screen === 'start' && <StartScreen />}
        {screen === 'question' && <QuestionScreen />}
        {screen === 'results' && <ResultsScreen />}
        {screen === 'review' && <ReviewScreen />}
      </main>

      {screen === 'start' && (
        <footer className="mx-auto w-full max-w-[1240px] px-5 pb-36 sm:px-8 lg:pb-16">
          <div className="border-t border-line pt-6">
            <p className="label text-faint">
              {ro.footer.questions(QUESTION_COUNT)}
              <span className="mx-2 text-line-hi">/</span>
              <a
                href="https://github.com/psticea/trivia"
                className="underline-offset-4 transition-colors hover:text-text hover:underline"
              >
                {ro.footer.repo}
              </a>
            </p>
            <p className="mt-2.5 max-w-[64ch] text-[0.875rem] leading-relaxed text-faint opacity-75">
              {ro.footer.built} {ro.footer.noTracking}
            </p>
          </div>
        </footer>
      )}

      <StatsDialog open={statsOpen} onClose={() => setStatsOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
