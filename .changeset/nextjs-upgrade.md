---
'@lowdefy/server-dev': major
---

Upgrade Next.js from 13.5.4 to 16.x with Turbopack.

### Breaking Changes

- **Next.js 16**: Servers run on Next.js 16 with Turbopack as the default bundler in development.
- **Less removed**: `next-with-less` wrapper is removed. All styling uses CSS Modules or antd CSS-in-JS.
- **Node.js requirement**: Minimum Node.js version follows Next.js 16 requirements.
- **SWC 1.15.18**: Updated SWC compiler for faster builds.
