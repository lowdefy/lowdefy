const withLess = require('next-with-less');

module.exports = withLess({
  lessLoaderOptions: {
    lessOptions: {
      modifyVars: {
        'primary-color': '#9900FF',
      },
    },
  },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        buffer: false,
        crypto: false,
        events: false,
        fs: false,
        path: false,
        process: false,
        util: false,
      };
    }
    return config;
  },
  poweredByHeader: false,
  // productionBrowserSourceMaps: true
  // experimental: {
  //   concurrentFeatures: true,
  // },
});
