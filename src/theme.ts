import { KEYS, readJson, writeJson } from './game/storage';

export type Theme = 'dark' | 'light';

const THEME_COLOR: Record<Theme, string> = {
  dark: '#0b0b0d',
  light: '#f6f6f3',
};

export function readTheme(): Theme {
  const stored = readJson<Theme>(KEYS.theme, 'dark');
  return stored === 'light' ? 'light' : 'dark';
}

/** Aplică tema pe <html> și ține bara de sus a browserului în ton cu ea. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

export function persistTheme(theme: Theme): void {
  writeJson(KEYS.theme, theme);
  applyTheme(theme);
}
