import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'dist/**', 'e2e/**'],
    clearMocks: true,
    maxWorkers: 2,
  },
});
