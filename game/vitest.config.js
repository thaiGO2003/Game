import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30000, // 30 seconds for property-based tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'src/main.js',
        'src/scenes/**/*.js', // Scenes are orchestration, harder to test in isolation
        'tests/**',
        '**/*.test.js',
        '**/*.spec.js'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      'phaser3spectorjs': new URL('./tests/mocks/phaser3spectorjs.js', import.meta.url).pathname
    }
  }
});
