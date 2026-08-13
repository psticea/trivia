import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearAll } from '../game/storage';

/**
 * Plasa de siguranță.
 *
 * O eroare la randare lăsa pagina complet neagră, fără niciun indiciu — exact
 * ce au pățit jucătorii care aveau salvate date de la o ediție anterioară.
 * Datele din browser pot rămâne mereu în urma codului, așa că e nevoie de un
 * ecran de recuperare cu o ieșire clară, nu de un ecran gol.
 */
type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Eroare la randare:', error, info.componentStack);
  }

  private reset = () => {
    clearAll();
    window.location.replace(window.location.pathname);
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[42rem] flex-col justify-center px-5 py-12 sm:px-8">
        <p className="label text-accent-ink">Ceva s-a stricat</p>
        <h1 className="mt-4 text-[clamp(2rem,8vw,3rem)] text-text">Jocul nu a putut porni</h1>
        <p className="mt-5 text-[1.125rem] leading-[1.5] text-dim">
          Cel mai probabil au rămas date salvate de la o versiune mai veche a jocului. Ștergerea lor rezolvă
          problema — pierzi doar statisticile și evidența întrebărilor deja văzute.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={this.reset}>
            Șterge datele și repornește
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
            Încearcă din nou
          </button>
        </div>
        <p className="mt-8 font-mono text-[0.8125rem] break-words text-faint">{error.message}</p>
      </div>
    );
  }
}
