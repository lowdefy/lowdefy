const withLess = require('next-with-less');
const lowdefyConfig = require('./build/config.json');

module.exports = withLess({
  lessLoaderOptions: {
    lessOptions: {
      modifyVars: lowdefyConfig.theme.lessVariables,
    },
  },
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
        process: false,
        util: false,
      };
    }
    return config;
  },
  swcMinify: true,
  compress: false,
  outputFileTracing: false,
  poweredByHeader: false,
  generateEtags: false,
  optimizeFonts: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
});
