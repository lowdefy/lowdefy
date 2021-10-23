const { merge } = require('webpack-merge');
const webpack = require('webpack');
// const path = require('path');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  // devServer: {
  //   static: path.join(__dirname, 'dist'),
  //   port: 3001,
  // },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
  ],
});
