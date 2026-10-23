import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'dist/**'],
    globalSetup: ['./mongodbGlobalSetup.js'],
    setupFiles: ['./test/closeClientsAfterAll.js'],
    clearMocks: true,
    maxWorkers: 2,
  },
});
