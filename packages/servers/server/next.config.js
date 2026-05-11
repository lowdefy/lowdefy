const { withSentryConfig } = require('@sentry/nextjs');
const lowdefyConfig = require('./build/config.json');
const blockPackages = require('./build/blockPackages.json');
const agentFileSystems = require('./build/agentFileSystems.json');

const nextConfig = {
  basePath: lowdefyConfig.basePath,
  reactStrictMode: true,
  transpilePackages: [
    '@lowdefy/client',
    '@ant-design/x',
    '@ant-design/x-markdown',
    ...blockPackages,
  ],
  turbopack: {},
  poweredByHeader: false,
  // productionBrowserSourceMaps: true
  output: process.env.LOWDEFY_BUILD_OUTPUT_STANDALONE === '1' ? 'standalone' : undefined,
  outputFileTracingIncludes: agentFileSystems.length
    ? { '/api/agent/*': agentFileSystems.map((p) => `${p}/**/*`) }
    : undefined,
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
