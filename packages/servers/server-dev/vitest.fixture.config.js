import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/journeyFixture/**/*.test.mjs'],
    globalSetup: ['./test/journeyFixture/globalSetup.mjs'],
    testTimeout: 120000,
    hookTimeout: 120000,
    maxWorkers: 1,
    fileParallelism: false,
  },
});
