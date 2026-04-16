# @lowdefy/server-enterprise

## 5.0.0

### Major Changes

- f430f02dde: Upgrade Next.js to 16 with Turbopack.

  ### Breaking Changes

  - **Next.js 16**: Both production and development servers run on Next.js 16 with Turbopack as the default bundler.
  - **Less removed**: `next-with-less` wrapper is removed. Styling uses CSS Modules and antd CSS-in-JS.
  - **SWC 1.15.18**: Updated SWC compiler.
  - **Dynamic transpilePackages**: Server resolves block packages for transpilation from a build artifact, supporting custom block plugins with CSS imports.
  - **antd as direct server dependency**: Both server packages list `antd` and `@ant-design/cssinjs` as direct dependencies for pnpm strict mode compatibility.

### Minor Changes

- c8f4a41063: Add `theme.darkMode` config with system preference support.

  **System Dark Mode (`theme.darkMode`)**

  - New `theme.darkMode` config key accepts `'system'` (default), `'light'`, or `'dark'`
  - When set to `'system'`, the app follows the OS dark mode preference and updates live when it changes
  - When set to `'light'` or `'dark'`, the developer locks the mode — user preferences are stored but not applied

  **SetDarkMode Action**

  - Now accepts string params: `darkMode: 'system' | 'light' | 'dark'`
  - Without params, cycles through light, dark, and system preferences

  **`_media` Operator**

  - New `_media: darkModePreference` returns the user's preference (`'system'`, `'light'`, or `'dark'`)
  - `_media: darkMode` continues to return the effective boolean state

  **Dark Mode Rendering**

  - Notification, Message, and ConfirmModal render with correct dark mode colors via `App.useApp()` hooks
  - Loader blocks (Skeleton, Spinner) use antd design tokens instead of hardcoded colors
  - 404 page and loading states use theme-aware backgrounds
  - Mobile menu drawer background matches the active theme

- f430f02dde: Add theme token system. Use `_theme` operator to access Ant Design v6 design tokens (colors, spacing, typography) at runtime. Theme is configured via `theme.antd.token` and `theme.antd.algorithm` in `lowdefy.yaml`. The `_theme` operator resolves the full computed token set including antd defaults.

### Patch Changes

- Updated dependencies [52ea769811]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [29eb199c7f]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [155c0b9724]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [0fe1bc38dd]
- Updated dependencies [130a569d36]
- Updated dependencies [e3e922538]
- Updated dependencies [c3b5b45ec5]
- Updated dependencies [c8f4a41063]
- Updated dependencies [fd8225b7a1]
- Updated dependencies [43528a8b9]
- Updated dependencies [905d5d406]
- Updated dependencies [c1b5ddb33a]
- Updated dependencies [f430f02dde]
- Updated dependencies [8b9f926d1]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [c570982e0f]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
  - @lowdefy/blocks-basic@5.0.0
  - @lowdefy/blocks-antd@5.0.0
  - @lowdefy/client@5.0.0
  - @lowdefy/layout@5.0.0
  - @lowdefy/block-utils@5.0.0
  - @lowdefy/blocks-loaders@5.0.0
  - @lowdefy/operators-js@5.0.0
  - @lowdefy/actions-core@5.0.0
  - @lowdefy/helpers@5.0.0
  - @lowdefy/plugin-next-auth@5.0.0
  - @lowdefy/node-utils@5.0.0
  - @lowdefy/api@5.0.0
  - @lowdefy/logger@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- Updated dependencies [c5ce5b972]
- Updated dependencies [9de3276dc]
  - @lowdefy/operators-js@4.7.3
  - @lowdefy/api@4.7.3
  - @lowdefy/client@4.7.3
  - @lowdefy/layout@4.7.3
  - @lowdefy/actions-core@4.7.3
  - @lowdefy/blocks-antd@4.7.3
  - @lowdefy/blocks-basic@4.7.3
  - @lowdefy/blocks-loaders@4.7.3
  - @lowdefy/blocks-markdown@4.7.3
  - @lowdefy/connection-axios-http@4.7.3
  - @lowdefy/connection-mongodb@4.7.3
  - @lowdefy/operators-nunjucks@4.7.3
  - @lowdefy/operators-uuid@4.7.3
  - @lowdefy/plugin-next-auth@4.7.3
  - @lowdefy/block-utils@4.7.3
  - @lowdefy/errors@4.7.3
  - @lowdefy/helpers@4.7.3
  - @lowdefy/logger@4.7.3
  - @lowdefy/node-utils@4.7.3

## 4.7.2

### Patch Changes

- 30616048d: fix: Fix dev server build hang when page files contain top-level \_ref.

  The dev server could hang indefinitely at "Building config..." when a page YAML file's entire content was a `_ref`. This caused a self-referencing parent in the ref map, leading to an infinite loop during page source resolution. Also fixed null `lowdefy.yaml` handling in custom plugin type map generation.

  - @lowdefy/api@4.7.2
  - @lowdefy/client@4.7.2
  - @lowdefy/layout@4.7.2
  - @lowdefy/actions-core@4.7.2
  - @lowdefy/blocks-antd@4.7.2
  - @lowdefy/blocks-basic@4.7.2
  - @lowdefy/blocks-loaders@4.7.2
  - @lowdefy/blocks-markdown@4.7.2
  - @lowdefy/connection-axios-http@4.7.2
  - @lowdefy/connection-mongodb@4.7.2
  - @lowdefy/operators-js@4.7.2
  - @lowdefy/operators-nunjucks@4.7.2
  - @lowdefy/operators-uuid@4.7.2
  - @lowdefy/plugin-next-auth@4.7.2
  - @lowdefy/block-utils@4.7.2
  - @lowdefy/errors@4.7.2
  - @lowdefy/helpers@4.7.2
  - @lowdefy/logger@4.7.2
  - @lowdefy/node-utils@4.7.2

## 4.7.1

### Patch Changes

- Updated dependencies [18d1c3bfa]
- Updated dependencies [fac48c10a]
  - @lowdefy/blocks-antd@4.7.1
  - @lowdefy/operators-js@4.7.1
  - @lowdefy/api@4.7.1
  - @lowdefy/blocks-basic@4.7.1
  - @lowdefy/blocks-loaders@4.7.1
  - @lowdefy/blocks-markdown@4.7.1
  - @lowdefy/client@4.7.1
  - @lowdefy/layout@4.7.1
  - @lowdefy/actions-core@4.7.1
  - @lowdefy/connection-axios-http@4.7.1
  - @lowdefy/connection-mongodb@4.7.1
  - @lowdefy/operators-nunjucks@4.7.1
  - @lowdefy/operators-uuid@4.7.1
  - @lowdefy/plugin-next-auth@4.7.1
  - @lowdefy/block-utils@4.7.1
  - @lowdefy/errors@4.7.1
  - @lowdefy/helpers@4.7.1
  - @lowdefy/logger@4.7.1
  - @lowdefy/node-utils@4.7.1

## 4.7.0

### Patch Changes

- d2baf5fa9: fix(server): Remove unused print mixin from build logger

  Removed the pino `mixin` that added a `print` field to every build log entry. This field was a leftover from a previous CLI display system and caused spurious `print: warn` lines in build output.

- Updated dependencies [4543688f7]
- Updated dependencies [811f80760]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0
  - @lowdefy/blocks-antd@4.7.0
  - @lowdefy/blocks-basic@4.7.0
  - @lowdefy/api@4.7.0
  - @lowdefy/operators-js@4.7.0
  - @lowdefy/operators-nunjucks@4.7.0
  - @lowdefy/operators-uuid@4.7.0
  - @lowdefy/client@4.7.0
  - @lowdefy/layout@4.7.0
  - @lowdefy/actions-core@4.7.0
  - @lowdefy/blocks-loaders@4.7.0
  - @lowdefy/connection-axios-http@4.7.0
  - @lowdefy/connection-mongodb@4.7.0
  - @lowdefy/block-utils@4.7.0
  - @lowdefy/logger@4.7.0
  - @lowdefy/node-utils@4.7.0
  - @lowdefy/blocks-markdown@4.7.0
  - @lowdefy/plugin-next-auth@4.7.0
  - @lowdefy/errors@4.7.0

## 4.6.0

### Minor Changes

- aa0d6d363e: feat: Config-aware error tracing and Sentry integration

  **Config-Aware Error Tracing (#1940)**

  - Errors now trace back to exact YAML config locations with file:line
  - Clickable VSCode links in terminal and browser
  - Build-time validation catches typos with "Did you mean?" suggestions
  - Service vs Config error classification

  **Plugin Error Refactoring**

  - Operators throw simple error messages without formatting
  - Parsers (WebParser, ServerParser, BuildParser) format errors with received value and location
  - Removed redundant "Operator Error:" prefix from error messages
  - Consistent error format: "{message} Received: {params} at {location}."
  - Actions and connections also simplified: removed inline `received` from error messages (interface layer adds it)
  - Connection plugins (axios-http, knex, redis, sendgrid) no longer expose raw response data in errors

  **Error Class Hierarchy**

  - Unified error system in `@lowdefy/errors` with all error classes
    - `@lowdefy/errors/build` - Build-time classes with sync location resolution
  - Error classes: `LowdefyError`, `ConfigError`, `ConfigWarning`, `PluginError`, `ServiceError`
  - `ConfigWarning` supports `prodError` flag to throw in production builds
  - `ServiceError.isServiceError()` detects network/timeout/5xx errors
  - `~ignoreBuildChecks` cascades through descendants to suppress warnings/errors

  **Build Error Collection**

  - Errors collected in `context.errors[]` instead of throwing immediately
  - `tryBuildStep()` wrapper catches and collects errors from build steps
  - All errors logged together before summary message for proper ordering

  **Sentry Integration (#1945)**

  - Zero-config Sentry support - just set SENTRY_DSN
  - Client and server error capture with Lowdefy context (pageId, blockId, config location)
  - Configurable sampling rates, session replay, user feedback
  - Graceful no-op when DSN not set

### Patch Changes

- aa0d6d363e: fix: Add missing uuid dependency to servers
- af61715d5: feat: JIT page building for dev server

  **Shallow Refs and JIT Build (`@lowdefy/build`)**

  - Shallow `_ref` resolution stops at configured JSON paths, leaving `~shallow` markers for on-demand resolution
  - `shallowBuild` produces a page registry with dependency tracking instead of fully built pages
  - `buildPageJit` fully resolves a single page on demand using the shallow build output
  - File dependency map tracks which config files affect which pages for targeted rebuilds
  - Build package reorganized: `jit/` folder for dev-server-only files, `full/` folder for production-only files

  **JIT Page Building (`@lowdefy/server-dev`)**

  - Pages are built on-demand when requested instead of all at once during initial build
  - Page cache with file-watcher invalidation for fast rebuilds
  - `/api/page/[pageId]` endpoint triggers JIT build if page not cached
  - `/api/js/[env]` endpoint serves operator JS maps
  - Build error page component displays errors inline in the browser

  **Operator JS Hash Check (`@lowdefy/operators-js`)**

  - Added hash validation for jsMap to detect stale operator definitions

- Updated dependencies [fb7910f62]
- Updated dependencies [c62468b98]
- Updated dependencies [5e03091ee]
- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8250d8d3e]
- Updated dependencies [bb3222a5a]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [af61715d5]
- Updated dependencies [f673e3ab3d]
- Updated dependencies [43a5243da]
- Updated dependencies [f673e3ab3]
  - @lowdefy/blocks-antd@4.6.0
  - @lowdefy/blocks-basic@4.6.0
  - @lowdefy/client@4.6.0
  - @lowdefy/api@4.6.0
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0
  - @lowdefy/node-utils@4.6.0
  - @lowdefy/block-utils@4.6.0
  - @lowdefy/operators-js@4.6.0
  - @lowdefy/operators-nunjucks@4.6.0
  - @lowdefy/operators-uuid@4.6.0
  - @lowdefy/actions-core@4.6.0
  - @lowdefy/connection-axios-http@4.6.0
  - @lowdefy/logger@4.6.0
  - @lowdefy/layout@4.6.0
  - @lowdefy/blocks-loaders@4.6.0
  - @lowdefy/connection-mongodb@4.6.0
  - @lowdefy/blocks-markdown@4.6.0
  - @lowdefy/plugin-next-auth@4.6.0

## 4.5.2

### Patch Changes

- Updated dependencies [d573e8ff8]
  - @lowdefy/client@4.5.2
  - @lowdefy/api@4.5.2
  - @lowdefy/layout@4.5.2
  - @lowdefy/actions-core@4.5.2
  - @lowdefy/blocks-antd@4.5.2
  - @lowdefy/blocks-basic@4.5.2
  - @lowdefy/blocks-loaders@4.5.2
  - @lowdefy/blocks-markdown@4.5.2
  - @lowdefy/connection-axios-http@4.5.2
  - @lowdefy/connection-mongodb@4.5.2
  - @lowdefy/operators-js@4.5.2
  - @lowdefy/operators-nunjucks@4.5.2
  - @lowdefy/operators-uuid@4.5.2
  - @lowdefy/plugin-next-auth@4.5.2
  - @lowdefy/block-utils@4.5.2
  - @lowdefy/helpers@4.5.2
  - @lowdefy/node-utils@4.5.2

## 4.5.1

### Patch Changes

- 51f7f9dbe: Use uuid instead of crypto.randomUUID(), update uuid to v13.
- Updated dependencies [51f7f9dbe]
  - @lowdefy/operators-uuid@4.5.1
  - @lowdefy/api@4.5.1
  - @lowdefy/client@4.5.1
  - @lowdefy/layout@4.5.1
  - @lowdefy/actions-core@4.5.1
  - @lowdefy/blocks-antd@4.5.1
  - @lowdefy/blocks-basic@4.5.1
  - @lowdefy/blocks-loaders@4.5.1
  - @lowdefy/blocks-markdown@4.5.1
  - @lowdefy/connection-axios-http@4.5.1
  - @lowdefy/connection-mongodb@4.5.1
  - @lowdefy/operators-js@4.5.1
  - @lowdefy/operators-nunjucks@4.5.1
  - @lowdefy/plugin-next-auth@4.5.1
  - @lowdefy/block-utils@4.5.1
  - @lowdefy/helpers@4.5.1
  - @lowdefy/node-utils@4.5.1

## 4.5.0

### Minor Changes

- abc90f3f7: Change to Apache 2.0 license for all packages. All license checks and restrictions have been removed.
- 16084c1bd: Adds Lowdefy APIs. Lowdefy APIs allow you to create custom server-side API endpoints within your Lowdefy application. See https://docs.lowdefy.com/lowdefy-api for more info.

### Patch Changes

- Updated dependencies [d9512d9be]
- Updated dependencies [4f610de5c]
- Updated dependencies [d6c58fe97]
- Updated dependencies [b3a2e6662]
  - @lowdefy/client@4.5.0
  - @lowdefy/blocks-antd@4.5.0
  - @lowdefy/api@4.5.0
  - @lowdefy/operators-js@4.5.0
  - @lowdefy/layout@4.5.0
  - @lowdefy/actions-core@4.5.0
  - @lowdefy/blocks-basic@4.5.0
  - @lowdefy/blocks-loaders@4.5.0
  - @lowdefy/plugin-next-auth@4.5.0
  - @lowdefy/block-utils@4.5.0
  - @lowdefy/helpers@4.5.0
  - @lowdefy/node-utils@4.5.0

## 4.4.0

### Patch Changes

- Updated dependencies [bcfbb1a9b]
  - @lowdefy/blocks-antd@4.4.0
  - @lowdefy/api@4.4.0
  - @lowdefy/client@4.4.0
  - @lowdefy/layout@4.4.0
  - @lowdefy/actions-core@4.4.0
  - @lowdefy/blocks-basic@4.4.0
  - @lowdefy/blocks-loaders@4.4.0
  - @lowdefy/operators-js@4.4.0
  - @lowdefy/plugin-next-auth@4.4.0
  - @lowdefy/block-utils@4.4.0
  - @lowdefy/helpers@4.4.0
  - @lowdefy/node-utils@4.4.0

## 4.3.2

### Patch Changes

- Updated dependencies [efefb8ca0]
  - @lowdefy/blocks-antd@4.3.2
  - @lowdefy/api@4.3.2
  - @lowdefy/client@4.3.2
  - @lowdefy/layout@4.3.2
  - @lowdefy/actions-core@4.3.2
  - @lowdefy/blocks-basic@4.3.2
  - @lowdefy/blocks-loaders@4.3.2
  - @lowdefy/operators-js@4.3.2
  - @lowdefy/plugin-next-auth@4.3.2
  - @lowdefy/block-utils@4.3.2
  - @lowdefy/helpers@4.3.2
  - @lowdefy/node-utils@4.3.2

## 4.3.1

### Patch Changes

- Updated dependencies [3e574857c]
  - @lowdefy/blocks-antd@4.3.1
  - @lowdefy/api@4.3.1
  - @lowdefy/client@4.3.1
  - @lowdefy/layout@4.3.1
  - @lowdefy/actions-core@4.3.1
  - @lowdefy/blocks-basic@4.3.1
  - @lowdefy/blocks-loaders@4.3.1
  - @lowdefy/operators-js@4.3.1
  - @lowdefy/plugin-next-auth@4.3.1
  - @lowdefy/block-utils@4.3.1
  - @lowdefy/helpers@4.3.1
  - @lowdefy/node-utils@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/api@4.3.0
- @lowdefy/client@4.3.0
- @lowdefy/layout@4.3.0
- @lowdefy/actions-core@4.3.0
- @lowdefy/blocks-antd@4.3.0
- @lowdefy/blocks-basic@4.3.0
- @lowdefy/blocks-loaders@4.3.0
- @lowdefy/operators-js@4.3.0
- @lowdefy/plugin-next-auth@4.3.0
- @lowdefy/block-utils@4.3.0
- @lowdefy/helpers@4.3.0
- @lowdefy/node-utils@4.3.0

## 4.2.2

### Patch Changes

- Updated dependencies [e4ec43505]
  - @lowdefy/blocks-antd@4.2.2
  - @lowdefy/api@4.2.2
  - @lowdefy/client@4.2.2
  - @lowdefy/layout@4.2.2
  - @lowdefy/actions-core@4.2.2
  - @lowdefy/blocks-basic@4.2.2
  - @lowdefy/blocks-loaders@4.2.2
  - @lowdefy/operators-js@4.2.2
  - @lowdefy/plugin-next-auth@4.2.2
  - @lowdefy/block-utils@4.2.2
  - @lowdefy/helpers@4.2.2
  - @lowdefy/node-utils@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/client@4.2.1
  - @lowdefy/layout@4.2.1
  - @lowdefy/api@4.2.1
  - @lowdefy/actions-core@4.2.1
  - @lowdefy/blocks-antd@4.2.1
  - @lowdefy/blocks-basic@4.2.1
  - @lowdefy/blocks-loaders@4.2.1
  - @lowdefy/operators-js@4.2.1
  - @lowdefy/plugin-next-auth@4.2.1
  - @lowdefy/block-utils@4.2.1
  - @lowdefy/helpers@4.2.1
  - @lowdefy/node-utils@4.2.1

## 4.2.0

### Patch Changes

- Updated dependencies [47d855918]
- Updated dependencies [47d855918]
  - @lowdefy/client@4.2.0
  - @lowdefy/layout@4.2.0
  - @lowdefy/api@4.2.0
  - @lowdefy/actions-core@4.2.0
  - @lowdefy/blocks-antd@4.2.0
  - @lowdefy/blocks-basic@4.2.0
  - @lowdefy/blocks-loaders@4.2.0
  - @lowdefy/operators-js@4.2.0
  - @lowdefy/plugin-next-auth@4.2.0
  - @lowdefy/block-utils@4.2.0
  - @lowdefy/helpers@4.2.0
  - @lowdefy/node-utils@4.2.0

## 4.1.0

### Patch Changes

- Updated dependencies [221ba93c9]
- Updated dependencies [f14270465]
- Updated dependencies [f571e90da]
- Updated dependencies [f9d00b4d3]
- Updated dependencies [5b3ccc958]
  - @lowdefy/actions-core@4.1.0
  - @lowdefy/blocks-antd@4.1.0
  - @lowdefy/client@4.1.0
  - @lowdefy/api@4.1.0
  - @lowdefy/layout@4.1.0
  - @lowdefy/blocks-basic@4.1.0
  - @lowdefy/blocks-loaders@4.1.0
  - @lowdefy/operators-js@4.1.0
  - @lowdefy/plugin-next-auth@4.1.0
  - @lowdefy/block-utils@4.1.0
  - @lowdefy/helpers@4.1.0
  - @lowdefy/node-utils@4.1.0

## 4.0.2

### Patch Changes

- Updated dependencies [628c6e2f6]
- Updated dependencies [126a61267]
- Updated dependencies [126a61267]
- Updated dependencies [7fa709f19]
- Updated dependencies [126a61267]
- Updated dependencies [bbcf07a27]
  - @lowdefy/blocks-antd@4.0.2
  - @lowdefy/blocks-basic@4.0.2
  - @lowdefy/api@4.0.2
  - @lowdefy/client@4.0.2
  - @lowdefy/layout@4.0.2
  - @lowdefy/actions-core@4.0.2
  - @lowdefy/blocks-loaders@4.0.2
  - @lowdefy/operators-js@4.0.2
  - @lowdefy/plugin-next-auth@4.0.2
  - @lowdefy/block-utils@4.0.2
  - @lowdefy/helpers@4.0.2
  - @lowdefy/node-utils@4.0.2

## 4.0.1

### Patch Changes

- Fix build issue on release.
  - @lowdefy/api@4.0.1
  - @lowdefy/client@4.0.1
  - @lowdefy/layout@4.0.1
  - @lowdefy/actions-core@4.0.1
  - @lowdefy/blocks-antd@4.0.1
  - @lowdefy/blocks-basic@4.0.1
  - @lowdefy/blocks-loaders@4.0.1
  - @lowdefy/operators-js@4.0.1
  - @lowdefy/plugin-next-auth@4.0.1
  - @lowdefy/block-utils@4.0.1
  - @lowdefy/helpers@4.0.1
  - @lowdefy/node-utils@4.0.1

## 4.0.0

### Minor Changes

- f44cfa0cb: Add built with lowdefy branding to servers.

### Patch Changes

- Updated dependencies [f44cfa0cb]
- Updated dependencies [e694f72ee]
- Updated dependencies [84e479d11]
  - @lowdefy/client@4.0.0
  - @lowdefy/node-utils@4.0.0
  - @lowdefy/api@4.0.0
  - @lowdefy/blocks-antd@4.0.0
  - @lowdefy/layout@4.0.0
  - @lowdefy/actions-core@4.0.0
  - @lowdefy/blocks-basic@4.0.0
  - @lowdefy/blocks-loaders@4.0.0
  - @lowdefy/operators-js@4.0.0
  - @lowdefy/plugin-next-auth@4.0.0
  - @lowdefy/block-utils@4.0.0
  - @lowdefy/helpers@4.0.0
