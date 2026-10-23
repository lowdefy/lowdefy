import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.mjs'],
    exclude: [...configDefaults.exclude, 'test/journeyFixture/**', '**/*.mongodb.test.mjs'],
    setupFiles: ['./vitest.setup.js'],
    clearMocks: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    maxWorkers: 2,
  },
});
