import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30000, // 30 seconds for property-based tests
  },
  resolve: {
    alias: {
      'phaser3spectorjs': new URL('./tests/mocks/phaser3spectorjs.js', import.meta.url).pathname
    }
  }
});
