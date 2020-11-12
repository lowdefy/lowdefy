const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const { ModuleFederationPlugin } = require('webpack').container;

const common = require('./webpack.common.js');
const packageJson = require('./package.json');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  output: {
    path: path.resolve(__dirname, 'dev/shell'),
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
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
        lowdefy_renderer: `lowdefy_renderer@http://localhost:3001/remoteEntry.js`,
      },
    }),
  ],
});
