import { configDefaults, defineConfig } from 'vitest/config';

// The date tests expect UTC. Set here rather than in the test script so it also applies under
// Windows' cmd.exe; the test workers inherit it.
process.env.TZ = 'UTC';

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
      {
        extends: true,
        test: {
          name: 'CLIENT',
          environment: 'jsdom',
          // The default URL of jest's jsdom environment.
          environmentOptions: { jsdom: { url: 'http://localhost/' } },
          exclude: [
            ...configDefaults.exclude,
            'dist/**',
            'src/test/**',
            'src/operators/server/**',
            'src/operators/build/**',
          ],
          clearMocks: true,
        },
      },
    ],
  },
});
