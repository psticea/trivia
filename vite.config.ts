import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Pagină de proiect: https://psticea.github.io/trivia/  →  base '/trivia/'.
// Pentru domeniu propriu sau user page, base devine '/'.
export default defineConfig({
  base: '/trivia/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
