const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { dependencies, devDependencies } = require('./package.json');

module.exports = [
  // CLI
  {
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
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: ['**/*', '!shell/**'],
      }),
      new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
      new ModuleFederationPlugin({
        name: 'cli',
        filename: 'remoteEntry.js',
        remotes: {},
        exposes: {},
        shared: dependencies,
      }),
    ],
  },
  // Shell web app
  {
    entry: './src/commands/dev/shell/index.js',
    output: {
      filename: '[name].[contenthash].js',
      path: path.resolve(__dirname, 'dist/shell'),
    },
    mode: 'production',
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          options: {
            presets: ['@babel/preset-react'],
          },
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader', // translates CSS into CommonJS
            },
          ],
        },
      ],
    },
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
    },
    plugins: [
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: ['**/*', '!index.js'],
      }),
      new ModuleFederationPlugin({
        name: 'lowdefy_web_shell',
        shared: {
          ...dependencies,
          react: {
            singleton: true, // only a single version of the shared module is allowed
            requiredVersion: '~17.0.0',
            version: dependencies.react,
          },
          'react-dom': {
            singleton: true, // only a single version of the shared module is allowed
            requiredVersion: '~17.0.0',
            version: dependencies['react-dom'],
          },
        },
      }),
      new HtmlWebpackPlugin({
        template: './src/commands/dev/shell/index.html',
        publicPath: '/',
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      new CopyPlugin({
        patterns: [
          {
            from: './src/commands/dev/shell/public',
            to: 'public',
          },
        ],
      }),
    ],
  },
];
