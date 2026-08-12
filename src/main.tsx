import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Fonturi găzduite local, din npm. Fișierele CSS importate aici conțin
 * EXPLICIT și blocul @font-face pentru subsetul latin-ext; fără el, ă, ș și ț
 * ar cădea pe fontul de sistem, în timp ce â și î ar rămâne în fontul ales —
 * glife amestecate în același cuvânt (vezi README, secțiunea despre fonturi).
 */
import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource-variable/archivo/wght.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-ext-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-ext-500.css';

import './index.css';
import App from './App';
import { applyTheme, readTheme } from './theme';

applyTheme(readTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
