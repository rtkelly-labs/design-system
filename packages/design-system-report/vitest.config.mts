import { defineConfig } from 'vitest/config';

/**
 * Node environment throughout, unlike the design system's jsdom suite: every
 * test here drives esbuild, `react-dom/server` or a spawned compiler, and none
 * of them wants a DOM.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'reports/*.test.ts'],
  },
});
