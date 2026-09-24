import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Dev-сервер: запросы на 127.0.0.1 перенаправляются на localhost. Redirect URI в Keycloak прописан
 * для http://localhost:5173, а с origin 127.0.0.1 вход падает с «Invalid parameter: redirect_uri».
 */
function redirectLoopbackIpToLocalhost(): Plugin {
  return {
    name: 'pulse:redirect-loopback-ip-to-localhost',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const host = req.headers.host ?? '';
        if (host.startsWith('127.0.0.1:')) {
          res.statusCode = 302;
          res.setHeader('Location', `http://localhost:${host.slice('127.0.0.1:'.length)}${req.url ?? '/'}`);
          res.end();
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), redirectLoopbackIpToLocalhost()],
  server: {
    // На Windows Node разрешает localhost в ::1, и Vite слушал только IPv6 — браузер по 127.0.0.1 получал отказ
    host: '127.0.0.1',
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
