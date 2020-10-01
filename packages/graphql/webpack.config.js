const path = require('path');
const { dependencies, devDependencies } = require('./package.json');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
  },
  target: 'node',
  node: false,
  externals: Object.keys({ ...dependencies, ...devDependencies }),
};
