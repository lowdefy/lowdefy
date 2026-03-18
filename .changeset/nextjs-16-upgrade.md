---
'@lowdefy/server': major
'@lowdefy/server-dev': major
---

Upgrade Next.js to 16 with Turbopack.

### Breaking Changes

- **Next.js 16**: Both production and development servers run on Next.js 16 with Turbopack as the default bundler.
- **Less removed**: `next-with-less` wrapper is removed. Styling uses CSS Modules and antd CSS-in-JS.
- **SWC 1.15.18**: Updated SWC compiler.
- **Dynamic transpilePackages**: Server resolves block packages for transpilation from a build artifact, supporting custom block plugins with CSS imports.
