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
  // productionBrowserSourceMaps: true
  // experimental: {
  //   concurrentFeatures: true,
  // },
};
