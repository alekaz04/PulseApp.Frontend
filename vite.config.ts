import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5050',
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000' },
    },
    setupFiles: ['./src/test/setup.ts'],
    // Node 25+ объявляет свой localStorage (без --localstorage-file он undefined) и перекрывает jsdom
    poolOptions: {
      forks: { execArgv: ['--no-experimental-webstorage'] },
      threads: { execArgv: ['--no-experimental-webstorage'] },
    },
  },
});
