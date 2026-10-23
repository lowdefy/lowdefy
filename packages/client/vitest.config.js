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
        replacement: path.join(rootDir, 'src/test/__mocks__/styleMock.js'),
      },
      // @ant-design/icons 6.3+ resolves to es/*.js under jsdom, and its CommonJS build requires
      // @ant-design/colors/es/generate. Use the CommonJS builds, as the jest config did.
      {
        find: /^@ant-design\/icons$/,
        replacement: path.join(rootDir, 'node_modules/@ant-design/icons/lib/index.js'),
      },
      { find: /^@ant-design\/colors\/es\/(.*)$/, replacement: '@ant-design/colors/lib/$1' },
    ],
  },
  test: {
    environment: 'jsdom',
    // The default URL of jest's jsdom environment.
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    exclude: [...configDefaults.exclude, 'dist/**', 'src/test/**'],
    setupFiles: ['./vitest.setup.js'],
    clearMocks: true,
    snapshotSerializers: ['jest-serializer-html'],
    maxWorkers: 2,
  },
});
