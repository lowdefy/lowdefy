const path = require('path');
const { ModuleFederationPlugin } = require('webpack').container;
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { dependencies } = require('./package.json');

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
  externals: [
    'fs',
    'path',
    'chokidar',
    'oracledb',
    'mssql',
    'mysql',
    'mysql2',
    'pg',
    'pg-query-stream',
    'sqlite3',
    'tedious',
  ],
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
  plugins: [
    new CleanWebpackPlugin(),
    new ModuleFederationPlugin({
      name: 'graphql',
      library: { type: 'commonjs' },
      filename: 'remoteEntry.js',
      exposes: {
        './graphql': './src/index.js',
      },
      shared: dependencies,
    }),
  ],
};
