import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.mongodb.test.js'],
    globalSetup: ['./mongodbGlobalSetup.js'],
    exclude: [...configDefaults.exclude, 'dist/**'],
    setupFiles: ['./vitest.setup.js'],
    clearMocks: true,
    maxWorkers: 2,
  },
});
