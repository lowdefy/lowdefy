import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'dist/**'],
    clearMocks: true,
    maxWorkers: 2,
  },
});
