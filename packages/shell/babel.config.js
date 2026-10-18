// intl-messageformat (through @lowdefy/helpers translate) ships static class blocks, which
// babel-preset-expo leaves alone; Metro and Jest transform node_modules with this config too.
module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['@babel/plugin-transform-class-static-block'],
  };
};
