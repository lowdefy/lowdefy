const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const webpack = require('webpack');
const path = require('path');

const deps = require('./package.json').dependencies;

module.exports = {
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  // webpack 5 support polyfills
  resolve: {
    alias: {
      buffer: require.resolve('buffer'),
    },
    fallback: { buffer: false },
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
      name: 'lowdefy_renderer',
      library: { type: 'var', name: 'lowdefy_renderer' },
      filename: 'remoteEntry.js',
      exposes: {
        './Renderer': './src/Renderer',
      },
      shared: {
        ...deps,
        react: {
          singleton: true, // only a single version of the shared module is allowed
          requiredVersion: '~17.0.0',
          version: deps.react,
        },
        'react-dom': {
          singleton: true, // only a single version of the shared module is allowed
          requiredVersion: '~17.0.0',
          version: deps['react-dom'],
        },
      },
    }),
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
