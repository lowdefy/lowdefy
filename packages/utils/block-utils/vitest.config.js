import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    include: /\.[cm]?jsx?$/,
    exclude: [],
    lang: 'jsx',
    jsx: { runtime: 'classic', development: false },
  },
  resolve: { extensions: ['.js', '.json', '.jsx', '.ts', '.tsx', '.node', '.yaml', '.css'] },
  test: {
    environment: 'jsdom',
    // The default URL of jest's jsdom environment.
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    exclude: [...configDefaults.exclude, 'dist/**'],
    setupFiles: ['./vitest.setup.js'],
    clearMocks: true,
    snapshotSerializers: ['jest-serializer-html'],
    maxWorkers: 2,
  },
});
