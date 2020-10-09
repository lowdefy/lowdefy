const path = require('path');
const { dependencies, devDependencies } = require('./package.json');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
  },
  mode: 'production',
  target: 'node',
  node: false,
  externals: Object.keys({ ...dependencies, ...devDependencies }),
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    node: '10',
                  },
                },
              ],
            ],
          },
        },
      },
    ],
  },
};
