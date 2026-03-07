const lowdefyConfig = require('./build/config.json');

const nextConfig = {
  basePath: lowdefyConfig.basePath,
  // reactStrictMode: true,
  turbopack: {},
  transpilePackages: [
    '@lowdefy/client',
    '@lowdefy/blocks-loaders',
    '@lowdefy/blocks-color-selectors',
    '@lowdefy/blocks-markdown',
  ],
  compress: false,
  poweredByHeader: false,
};

module.exports = nextConfig;
