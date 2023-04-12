const withLess = require('next-with-less');
const lowdefyConfig = require('./build/config.json');

module.exports = withLess({
  basePath: lowdefyConfig.basePath,
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
  output: process.env.LOWDEFY_BUILD_OUTPUT_STANDALONE === '1' ? 'standalone' : undefined,
  outputFileTracing: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
});
