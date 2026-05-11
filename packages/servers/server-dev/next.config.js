const lowdefyConfig = require('./build/config.json');
const blockPackages = require('./build/blockPackages.json');

// Transpile @lowdefy/client plus all block plugin packages that may
// contain CSS imports (e.g., AG Grid themes, loaders, markdown).
// Built dynamically so custom user plugins are included automatically.
const transpilePackages = [
  '@lowdefy/client',
  '@ant-design/x',
  '@ant-design/x-markdown',
  ...blockPackages,
];

const nextConfig = {
  basePath: lowdefyConfig.basePath,
  // reactStrictMode: true,
  turbopack: {},
  transpilePackages,
  compress: false,
  poweredByHeader: false,
};

module.exports = nextConfig;
