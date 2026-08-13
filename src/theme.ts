import { KEYS, readJson, writeJson } from './game/storage';

export type Theme = 'dark' | 'light';

const THEME_COLOR: Record<Theme, string> = {
  dark: '#0b0b0d',
  light: '#f6f6f3',
};

const KID_THEME_COLOR: Record<Theme, string> = {
  dark: '#0b0b10',
  light: '#fffdf6',
};

export function readTheme(): Theme {
  const stored = readJson<Theme>(KEYS.theme, 'dark');
  return stored === 'light' ? 'light' : 'dark';
}

/** Aplică tema pe <html> și ține bara de sus a browserului în ton cu ea. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  const kid = root.dataset.mode === 'kid';
  const color = kid ? KID_THEME_COLOR[theme] : THEME_COLOR[theme];
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}

export function persistTheme(theme: Theme): void {
  writeJson(KEYS.theme, theme);
  applyTheme(theme);
}

/**
 * Modul de prezentare. „kid” se aplică doar cât ține o rundă Junior, plus
 * rezultatele și recapitularea ei; peste tot altundeva jocul revine la
 * înfățișarea obișnuită. Nu se salvează: ține de rundă, nu de preferință.
 */
export type Mode = 'normal' | 'kid';

export function applyMode(mode: Mode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'kid') root.dataset.mode = 'kid';
  else delete root.dataset.mode;

  const theme = root.dataset.theme === 'light' ? 'light' : 'dark';
  const color = mode === 'kid' ? KID_THEME_COLOR[theme] : THEME_COLOR[theme];
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}
