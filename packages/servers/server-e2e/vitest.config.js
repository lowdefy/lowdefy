import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.mjs'],
    clearMocks: true,
    // The context tests import the whole of @lowdefy/api, which takes seconds on a loaded machine.
    testTimeout: 30000,
    hookTimeout: 30000,
    maxWorkers: 2,
  },
});
