const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const packageJson = require('./package.json');

const sanitizeName = (name) => {
  return name
    .replace('@', '_at_')
    .replace('/', '_slash_')
    .replace('-', '_dash_')
    .replace(/^[a-zA-Z0-9_]/g, '_');
};

const addRemoteEntryUrl = (content, absoluteFrom) => {
  const scope = sanitizeName(packageJson.name);
  const meta = JSON.parse(content);
  meta.moduleFederation = {
    module: path.basename(absoluteFrom, '.json'),
    scope,
    version: packageJson.version,
    remoteEntryUrl: 'http://localhost:3002/remoteEntry.js',
  };
  return JSON.stringify(meta);
};

module.exports = merge(common, {
  entry: './src/index.js',
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 3002,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/blocks/**/*.json',
          transformPath: (targetPath) => {
            return path.join('meta', path.basename(targetPath));
          },
          transform: addRemoteEntryUrl,
        },
      ],
    }),
  ],
});
