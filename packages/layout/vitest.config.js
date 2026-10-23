import path from 'path';
import { fileURLToPath } from 'url';
import { configDefaults, defineConfig } from 'vitest/config';
import yaml from '@lowdefy/vite-yaml-plugin';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [yaml()],
  oxc: {
    include: /\.[cm]?jsx?$/,
    exclude: [],
    lang: 'jsx',
    jsx: { runtime: 'classic', development: false },
  },
  resolve: {
    alias: [
      {
        find: /^.*?(?:\.(css|less)$)/,
        replacement: path.join(rootDir, 'src/tests/__mocks__/styleMock.js'),
      },
    ],
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx', '.node', '.yaml', '.css'],
  },
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
