/**
 * Generează public/apple-touch-icon.png din public/favicon.svg.
 * Se rulează manual, la nevoie:  npx tsx scripts/icons.ts
 * Rezultatul se comite în repo, ca buildul să nu depindă de sharp.
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const svg = readFileSync(`${root}public/favicon.svg`);

await sharp(svg, { density: 512 })
  .resize(180, 180)
  .png({ compressionLevel: 9 })
  .toFile(`${root}public/apple-touch-icon.png`);

console.log('public/apple-touch-icon.png regenerat (180x180)');
