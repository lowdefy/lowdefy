const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './demo/index',
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
      {
        test: /\.less$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader', // translates CSS into CommonJS
          },
          {
            loader: 'less-loader', // compiles Less to CSS
            options: {
              lessOptions: {
                modifyVars: {
                  '@primary-color': '#697a8c',
                  '@link-color': '#1890ff',
                  '@layout-header-background': '#30383f',
                  '@layout-sider-background': '#30383f',
                  '@menu-dark-submenu-bg': '#21262b',
                },
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
    new webpack.ProvidePlugin({ process: ['process'] }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
