import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    include: /\.[cm]?jsx?$/,
    exclude: [],
    lang: 'jsx',
    jsx: { runtime: 'classic', development: false },
  },
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'dist/**'],
    clearMocks: true,
    maxWorkers: 2,
  },
});
