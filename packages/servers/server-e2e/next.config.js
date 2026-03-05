const lowdefyConfig = require('./build/config.json');

const nextConfig = {
  basePath: lowdefyConfig.basePath,
  reactStrictMode: true,
  transpilePackages: [
    '@lowdefy/client',
    '@lowdefy/blocks-loaders',
    '@lowdefy/blocks-color-selectors',
    '@lowdefy/blocks-markdown',
  ],
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
  output: process.env.LOWDEFY_BUILD_OUTPUT_STANDALONE === '1' ? 'standalone' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
