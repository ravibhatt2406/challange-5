/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Keep browser-like component tests and server/shared tests under one runner.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@client': path.resolve(import.meta.dirname, 'src/client'),
      '@shared': path.resolve(import.meta.dirname, 'src/shared'),
      '@server': path.resolve(import.meta.dirname, 'src/server'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/client/test/setup.ts'],
    testTimeout: 15000,
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/client/test/**', 'src/**/*.d.ts'],
    },
  },
});
