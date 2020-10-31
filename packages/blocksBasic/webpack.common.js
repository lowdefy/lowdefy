const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');
const fs = require('fs');

const package = require('./package.json');

const sanitizeName = (name) => {
  return name
    .replace('@', '_at_')
    .replace('/', '_slash_')
    .replace('-', '_dash_')
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
    new ModuleFederationPlugin({
      name: sanitizeName(package.name),
      library: { type: 'var', name: sanitizeName(package.name) },
      filename: 'remoteEntry.js',
      exposes: blockModules(),
      shared: {
        ...package.dependencies,
        react: {
          singleton: true, // only a single version of the shared module is allowed
          requiredVersion: '~17.0.0',
          version: package.dependencies.react,
        },
        'react-dom': {
          singleton: true, // only a single version of the shared module is allowed
          requiredVersion: '~17.0.0',
          version: package.dependencies['react-dom'],
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
