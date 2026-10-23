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
          exclude: [...configDefaults.exclude, 'dist/**', 'src/index.js/**'],
          clearMocks: true,
        },
      },
      {
        extends: true,
        test: {
          name: 'CLIENT',
          environment: 'jsdom',
          // The default URL of jest's jsdom environment.
          environmentOptions: { jsdom: { url: 'http://localhost/' } },
          exclude: [...configDefaults.exclude, 'dist/**', 'src/index.js/**'],
          clearMocks: true,
        },
      },
    ],
  },
});
