const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');
const fs = require('fs');

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
  resolve: { fallback: { buffer: require.resolve('buffer/') } },
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
