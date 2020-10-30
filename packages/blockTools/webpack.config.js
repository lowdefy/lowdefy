const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './demo/index.js',
  mode: 'development',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 3001,
  },
  // webpack 5 support polyfills
  resolve: {
    alias: {
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser'),
      buffer: require.resolve('buffer'),
    },
    fallback: { buffer: false },
  },

  module: {
    rules: [
      // TODO: FIXME: do NOT webpack 5 support with this
      // x-ref: https://github.com/webpack/webpack/issues/11467
      // waiting for babel fix: https://github.com/vercel/next.js/pull/17095#issuecomment-692435147
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-react'],
        },
      },
      {
        test: /\.ya?ml$/,
        type: 'json',
        use: 'yaml-loader',
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
  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /runRenderTests/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /mockBlock/ }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
