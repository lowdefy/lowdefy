import { configDefaults, defineConfig } from 'vitest/config';
import yaml from '@lowdefy/vite-yaml-plugin';

export default defineConfig({
  plugins: [yaml()],
  oxc: {
    include: /\.[cm]?jsx?$/,
    exclude: [],
    lang: 'jsx',
    jsx: { runtime: 'classic', development: false },
  },
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'dist/**', 'src/blocks*', 'src/blocks*/**'],
    clearMocks: true,
    maxWorkers: 2,
  },
});
