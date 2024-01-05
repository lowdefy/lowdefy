const withLess = require('next-with-less');
const lowdefyConfig = require('./build/config.json');

module.exports = withLess({
  basePath: lowdefyConfig.basePath,
  // reactStrictMode: true,
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
  swcMinify: false,
  compress: false,
  outputFileTracing: false,
  poweredByHeader: false,
  generateEtags: false,
  optimizeFonts: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
});
