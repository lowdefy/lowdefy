const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const packageJson = require('./package.json');

module.exports = {
  entry: './src/index',
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          babelrc: false,
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
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      minify: false,
      publicPath: '/',
      template: './src/index.html',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new ModuleFederationPlugin({
      name: 'lowdefy_web_shell',
      shared: {
        ...packageJson.dependencies,
        react: {
          singleton: true, // only a single version of the shared module is allowed
          requiredVersion: '~17.0.0',
          version: packageJson.dependencies.react,
        },
        'react-dom': {
          singleton: true, // only a single version of the shared module is allowed
          requiredVersion: '~17.0.0',
          version: packageJson.dependencies['react-dom'],
        },
      },
      remotes: {
        lowdefy_renderer: `lowdefy_renderer@https://blocks-cdn.lowdefy.com/v${packageJson.version}/renderer/remoteEntry.js`,
      },
    }),
    new CopyPlugin({
      patterns: [
        {
          from: './src/public',
          to: 'public',
        },
      ],
    }),
  ],
};
