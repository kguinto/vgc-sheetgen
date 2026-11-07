/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  test: {
    // Starting the text recognizer and reading takes a few seconds.
    testTimeout: 30_000,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['test/**/*.test.ts'],
          exclude: ['test/browser/**'],
          environment: 'node',
        },
      },
      {
        // Code that only runs in the browser, tested in headless Chromium.
        // The first run downloads the text recognizer from its CDN, so it
        // needs the internet and takes longer.
        extends: true,
        test: {
          name: 'browser',
          include: ['test/browser/**/*.test.ts'],
          testTimeout: 120_000,
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
