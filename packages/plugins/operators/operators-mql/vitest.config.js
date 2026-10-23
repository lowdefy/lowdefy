import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    maxWorkers: 2,
    projects: [
      {
        extends: true,
        test: {
          name: 'SERVER',
          environment: 'node',
          exclude: [...configDefaults.exclude, 'dist/**', 'src/test/**', 'src/operators/client/**'],
          clearMocks: true,
        },
      },
    ],
  },
});
