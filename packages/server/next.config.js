const withLess = require('next-with-less');
const lowdefyConfig = require('./build/config.json');

// TODO: Trace env and args from cli that is required on the server.
module.exports = withLess({
  basePath: process.env.LOWDEFY_BASE_PATH || lowdefyConfig.basePath,
  lessLoaderOptions: {
    lessOptions: {
      modifyVars: lowdefyConfig.theme.lessVariables,
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
        process: require.resolve('process/browser'),
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
  outputFileTracing: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
});
