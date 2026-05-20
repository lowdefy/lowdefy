const lowdefyConfig = require('./build/config.json');
const blockPackages = require('./build/blockPackages.json');

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
  output: process.env.LOWDEFY_BUILD_OUTPUT_STANDALONE === '1' ? 'standalone' : undefined,
};

module.exports = nextConfig;
