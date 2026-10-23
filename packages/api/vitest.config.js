import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'dist/**', 'src/test/**', '**/*.mongodb.test.js'],
    setupFiles: ['./vitest.setup.js'],
    clearMocks: true,
    maxWorkers: 2,
  },
});
