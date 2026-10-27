import { configDefaults, defineConfig } from 'vitest/config';

// The core runs in node: it must work without a browser. A test that needs DOM
// events (the page lifecycle manager) opts into jsdom in its own docblock.
export default defineConfig({
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'dist/**', 'src/test/**'],
    clearMocks: true,
    maxWorkers: 2,
  },
});
