import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.mongodb.test.mjs'],
    globalSetup: ['./mongodbGlobalSetup.js'],
    setupFiles: ['./vitest.setup.js'],
    clearMocks: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    maxWorkers: 2,
  },
});
