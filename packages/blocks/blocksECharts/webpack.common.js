const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');
const fs = require('fs');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const packageJson = require('./package.json');

const sanitizeName = (name) => {
  return name
    .replace(/@/g, '_at_')
    .replace(/\//g, '_slash_')
    .replace(/-/g, '_dash_')
    .replace(/^[a-zA-Z0-9_]/g, '_');
};

// Get all directories in ./src/blocks folder and create module definition for ModuleFederation
const getDirectories = (srcPath) =>
  fs.readdirSync(srcPath).filter((file) => fs.statSync(path.join(srcPath, file)).isDirectory());
const blockModules = () => {
  const blocks = getDirectories('./src/blocks');
  const modules = {};
  blocks.forEach((block) => {
    modules[`./${block}`] = `./src/blocks/${block}/${block}.js`;
    // modules[`./${block}/meta`] = `./src/blocks/${block}/${block}.json`;
  });
  return modules;
};

module.exports = {
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: { fallback: { buffer: require.resolve('buffer/'), tslib: require.resolve('tslib/') } },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
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
    new CleanWebpackPlugin(),
    new ModuleFederationPlugin({
      name: sanitizeName(packageJson.name),
      library: { type: 'var', name: sanitizeName(packageJson.name) },
      filename: 'remoteEntry.js',
      exposes: blockModules(),
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
    }),
  ],
};
