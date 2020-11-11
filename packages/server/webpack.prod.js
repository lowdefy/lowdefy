const path = require('path');
const { merge } = require('webpack-merge');
const webpack = require('webpack');
const { ModuleFederationPlugin } = require('webpack').container;

const common = require('./webpack.common.js');
const packageJson = require('./package.json');

module.exports = merge(common, {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist/shell'),
  },
  plugins: [
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
        lowdefy_renderer: `lowdefy_renderer@https://unpkg.com/@lowdefy/renderer@${packageJson.version}/dist/remoteEntry.js`,
      },
    }),
  ],
});
