const { withSentryConfig } = require('@sentry/nextjs');
const withLess = require('next-with-less');
const lowdefyConfig = require('./build/config.json');

const nextConfig = withLess({
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
  compress: false,
  outputFileTracing: false,
  poweredByHeader: false,
  generateEtags: false,
  optimizeFonts: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
});

// Only wrap with Sentry if SENTRY_DSN is configured
// This enables source map uploads when SENTRY_AUTH_TOKEN is present
module.exports = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      // Sentry options
      silent: true,
      hideSourceMaps: true,
    })
  : nextConfig;
