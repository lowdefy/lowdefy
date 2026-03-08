const { withSentryConfig } = require('@sentry/nextjs');
const lowdefyConfig = require('./build/config.json');
const blockPackages = require('./build/blockPackages.json');

const nextConfig = {
  basePath: lowdefyConfig.basePath,
  reactStrictMode: true,
  transpilePackages: ['@lowdefy/client', ...blockPackages],
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
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// Only wrap with Sentry if SENTRY_DSN is configured
// This enables source map uploads when SENTRY_AUTH_TOKEN is present
module.exports = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      // Sentry options
      silent: true,
      hideSourceMaps: true,
    })
  : nextConfig;
