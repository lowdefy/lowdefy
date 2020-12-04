const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const packageJson = require('./package.json');

const sanitizeName = (name) => {
  return name
    .replace(/@/g, '_at_')
    .replace(/\//g, '_slash_')
    .replace(/-/g, '_dash_')
    .replace(/^[a-zA-Z0-9_]/g, '_');
};

const addRemoteEntryUrl = (content, absoluteFrom) => {
  const scope = sanitizeName(packageJson.name);
  const meta = JSON.parse(content);
  // if no moduleFederation info is provided, default to unpkg
  if (!meta.moduleFederation) {
    meta.moduleFederation = {
      module: path.basename(absoluteFrom, '.json'),
      scope,
      version: packageJson.version,
      remoteEntryUrl: `https://unpkg.com/${packageJson.name}@${packageJson.version}/dist/remoteEntry.js`,
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
