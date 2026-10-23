import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.js'],
    exclude: [...configDefaults.exclude, 'dist/**', 'src/test/**'],
    clearMocks: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    maxWorkers: 2,
  },
});
