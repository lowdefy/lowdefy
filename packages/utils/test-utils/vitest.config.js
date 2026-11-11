import { configDefaults, defineConfig } from 'vitest/config';

// The suites read production builds of three apps in this repository, which the global setup
// builds once per run (test/globalSetup.mjs), so the timeouts leave room for a loaded machine.
export default defineConfig({
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'dist/**'],
    globalSetup: ['./test/globalSetup.mjs'],
    clearMocks: true,
    testTimeout: 120000,
    hookTimeout: 120000,
    maxWorkers: 2,
  },
});
