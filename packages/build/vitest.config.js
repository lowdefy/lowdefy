import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'dist/**', 'src/tests/**'],
    clearMocks: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    maxWorkers: 2,
  },
});
