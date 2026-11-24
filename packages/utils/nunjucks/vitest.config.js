import { configDefaults, defineConfig } from 'vitest/config';

// The date tests expect UTC. Set here rather than in the test script so it also applies under
// Windows' cmd.exe; the test workers inherit it.
process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'dist/**'],
    clearMocks: true,
    maxWorkers: 2,
  },
});
