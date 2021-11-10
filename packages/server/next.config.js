const withLess = require('next-with-less');

const lessConfig = withLess({
  lessLoaderOptions: {
    lessOptions: {
      modifyVars: {
        'primary-color': '#9900FF',
        'border-radius-base': '32px',
      },
    },
  },
});

module.exports = {
  ...lessConfig,
  reactStrictMode: true,
  // productionBrowserSourceMaps: true
  // experimental: {
  //   concurrentFeatures: true,
  // },
};
