import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/journeyFixture/**/*.test.mjs'],
    globalSetup: ['./test/journeyFixture/globalSetup.mjs'],
    testTimeout: 300000,
    hookTimeout: 300000,
    maxWorkers: 1,
    fileParallelism: false,
  },
});
