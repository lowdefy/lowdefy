const withLess = require('next-with-less');
const appConfig = require('./build/app.json');

module.exports = withLess({
  lessLoaderOptions: {
    lessOptions: {
      modifyVars: appConfig.styles.lessVariables,
    },
  },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        assert: false,
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
