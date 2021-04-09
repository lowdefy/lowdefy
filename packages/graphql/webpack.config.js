const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { dependencies, devDependencies } = require('./package.json');

const externals = [...Object.keys(dependencies), ...Object.keys(devDependencies)];

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
  externals,
  module: {
    rules: [
      {
        test: /\.m?js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    node: '12',
                  },
                },
              ],
            ],
          },
        },
      },
    ],
  },
  plugins: [new CleanWebpackPlugin()],
};
