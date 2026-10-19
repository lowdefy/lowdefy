const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // The website is built from the pnpm monorepo but also keeps its own package-lock.json.
  // Pin the root Next would infer so it does not warn about multiple lockfiles.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });
    return config;
  },
};

module.exports = nextConfig;
