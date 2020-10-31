const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const package = require('./package.json');

const sanitizeName = (name) => {
  return name
    .replace('@', '_at_')
    .replace('/', '_slash_')
    .replace('-', '_dash_')
    .replace(/^[a-zA-Z0-9_]/g, '_');
};

const addRemoteEntryUrl = (content, absoluteFrom) => {
  const scope = sanitizeName(package.name);
  const meta = JSON.parse(content);
  // if no moduleFederation info is provided, default to unpkg
  if (!meta.moduleFederation) {
    meta.moduleFederation = {
      module: path.basename(absoluteFrom, '.json'),
      scope,
      version: package.version,
      remoteEntryUrl: `https://unpkg.com/${package.name}@${package.version}/dist/remoteEntry.js`,
    };
  }
  return JSON.stringify(meta);
};

module.exports = merge(common, {
  entry: './src/index',
  mode: 'production',
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
