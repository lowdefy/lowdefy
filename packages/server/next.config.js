const withLess = require('next-with-less');
const lowdefyConfig = require('./build/config.json');

// TODO: Trace env and args from cli that is required on the server.
module.exports = withLess({
  basePath: process.env.LOWDEFY_BASE_PATH || lowdefyConfig.basePath,
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
  experimental: {
    // TODO: Convert from experimental.outputStandalone to output: 'standalone' when upgrading to Next 13
    outputStandalone: process.env.LOWDEFY_BUILD_OUTPUT_STANDALONE === '1' || false,
    // concurrentFeatures: true,
  },
  outputFileTracing: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
});
