import path from 'path';

export default {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve('./dist'),
    libraryTarget: 'module',
    clean: true,
  },
  mode: 'production',
  target: 'web',
  node: false,
  externals: ['@lowdefy/helpers', 'dayjs', /^dayjs\/plugin\//],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        use: {
          loader: 'swc-loader',
          options: {
            exclude: ['.*.test.js$', '.*/tests/.*', '.*/__mocks__/.*'],
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: true,
                dynamicImport: true,
                topLevelAwait: true,
              },
              target: 'es2020',
              keepClassNames: true,
              transform: { react: { runtime: 'classic' } },
            },
            module: {
              type: 'es6',
            },
          },
        },
      },
    ],
  },
  experiments: { outputModule: true },
};
