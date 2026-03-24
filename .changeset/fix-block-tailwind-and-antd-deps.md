---
'@lowdefy/build': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix: Block plugin Tailwind classes and antd dependency resolution.

**Block Tailwind scanning (`@lowdefy/build`)**

- Block plugin JS source files are now collected at build time using `require.resolve` to find real filesystem paths. This replaces the `@source` node_modules glob which couldn't follow pnpm symlinks to the `.pnpm` store. Tailwind classes in block components (e.g., `hidden lg:flex` in PageHeaderMenu) now compile correctly in standalone apps using pnpm.
- Added `@lowdefy/block-utils` to build dependencies (required by `writeBlockSchemaMap`).

**Antd dependencies (`@lowdefy/server`, `@lowdefy/server-dev`)**

- Added `antd` and `@ant-design/cssinjs` as direct dependencies of both server packages. Required for pnpm strict mode — `_app.js` imports these directly.
- Added singleton override mechanism in `scripts/lib/rewriteDeps.mjs` to prevent duplicate antd instances in monorepo local dev (which breaks CSS-in-JS context sharing and dark mode).
