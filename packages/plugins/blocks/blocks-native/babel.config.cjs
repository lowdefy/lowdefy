// Used only by Jest (babel-jest, from the React Native preset). The package itself builds with swc.
// intl-messageformat (through @lowdefy/helpers translate) ships static class blocks, which the
// React Native preset leaves alone.
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['@babel/plugin-transform-class-static-block'],
};
