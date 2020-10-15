const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

const deps = require('./package.json').dependencies;

module.exports = {
  entry: './shell/src/index',
  output: {
    path: path.resolve(__dirname, 'shell/dist'),
  },
  module: {
    rules: [
      {
        test: /bootstrap\.js$/,
        loader: 'bundle-loader',
        options: {
          lazy: true,
        },
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['@babel/preset-react'],
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'web-shell',
      library: { type: 'var', name: 'web-shell' },
      shared: {
        ...deps,
        react: {
          import: 'react', // the "react" package will be used a provided and fallback module
          shareKey: 'react', // under this name the shared module will be placed in the share scope
          shareScope: 'default', // share scope with this name will be used
          singleton: true, // only a single version of the shared module is allowed
        },
        'react-dom': {
          singleton: true, // only a single version of the shared module is allowed
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './shell/public/index.html',
    }),
  ],
};
