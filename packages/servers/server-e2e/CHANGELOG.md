# @lowdefy/server-e2e

## 5.4.0

### Patch Changes

- d1fb1d7: feat: Plugin-driven `serverExternalPackages` for Next.js.

  Plugins can now declare which of their dependencies need to be passed
  through to Next.js's `serverExternalPackages` config — used for CJS
  packages whose runtime `require()` chains Turbopack can't resolve
  through pnpm's isolated symlink layout (e.g. `turndown` →
  `@mixmark-io/domino`, `@aws-sdk/client-s3` → `fast-xml-parser` →
  `strnum`).

  Declare in the plugin's `package.json`:

  ```json
  {
    "lowdefy": {
      "serverExternalPackages": ["turndown"]
    }
  }
  ```

  Build aggregates declarations from every plugin the app actually uses
  (across blocks, connections, operators, actions, agents, auth, icons,
  requests) and writes a per-app `serverExternalPackages.json` artifact,
  read by `server`, `server-dev`, and `server-e2e` Next.js configs.

  Replaces a hardcoded list in the three server configs. Apps not using
  `blocks-tiptap` or `plugin-aws` no longer carry their externals.

  Initial declarations:

  - `@lowdefy/blocks-tiptap` → `turndown`
  - `@lowdefy/plugin-aws` → `@aws-sdk/client-s3`

- 134792b: fix: Unblock Playwright e2e for v5+ Lowdefy apps.

  **`@lowdefy/server-e2e`**

  - `next.config.js` now declares `turbopack: {}` and drops the legacy `webpack` polyfill block, so Next 16 (Turbopack-by-default) no longer errors with `This build is using Turbopack, with a webpack config and no turbopack config`. The `transpilePackages` list is now built from the same `build/blockPackages.json` artifact used by `@lowdefy/server`.
  - Plugin `types` modules are now correctly unwrapped from their ESM default export, so apps using custom plugins (blocks, actions, operators, connections, requests, etc.) no longer fail with `Action/Block/... type "Foo" was used but is not defined`.
  - Plugin `blockMetas` are now collected on the e2e server, matching the behaviour of `@lowdefy/server` and `@lowdefy/server-dev`.
  - `lowdefy build --server e2e` no longer crashes when the project has no `lowdefy.yaml` or `lowdefy.yml` (returns an empty plugin set instead of `YAML.parse(undefined)`).
  - Page and API routes now use catch-all segments (`pages/[[...pageId]].js`, `pages/api/endpoints/[...endpointId].js`, `pages/api/request/[...path].js`), so apps with nested page paths (e.g. `pages: [{ id: 'foo/bar' }]`) render correctly under `--server e2e` instead of returning 404.
  - `_app.js` and `_document.js` now mirror `@lowdefy/server`'s dark-mode handling — `useDarkMode` from `@lowdefy/client`, a `ThemeTokenResolver` that exposes the resolved antd token on `lowdefy.theme._resolvedAntdToken`, and a pre-hydration background-colour script that prevents the light/dark flash on page navigation.
  - `pages/api/client-error.js` now enforces the same-origin host check and strips `~e.received` from incoming payloads, matching `@lowdefy/server`.
  - `lowdefy/build.mjs` now uses `instanceof BuildError` for the formatted-error shortcut (matches `@lowdefy/server`) and drops the obsolete `mixin` logger config.
  - Runtime dependency set now includes `@lowdefy/blocks-antd-x`, and `tailwindcss` / `@tailwindcss/postcss` are declared in `dependencies` (not just `devDependencies`). The unused `process` browser polyfill has been removed.

  **`@lowdefy/e2e-utils`**

  - `extractBlockMap` now traverses `slots.<name>.blocks` alongside `areas.<name>.blocks` and `blocks`. Compiled page artifacts under `.lowdefy/server/build/pages/<pageId>.json` use the `slots` container shape, which `extractBlockMap` was not walking — so `generateManifest` produced a `blockMap` containing only the page root and `ldf.block('<any-nested-id>')` threw `Block "<id>" not found on page. Available blocks: <pageId>` for every non-root block, reducing the e2e framework to root-block assertions and raw `ldf.page.locator(...)` fallbacks.

  **`lowdefy` CLI**

  - `lowdefy build --server <name>` now re-fetches the server package when the version matches but the name differs. Both `lowdefy build` and `lowdefy build --server e2e` write to the same `.lowdefy/server/` directory, so the previous version-only cache check meant flipping between them (in either order) would silently reuse whichever server package was fetched first.

- Updated dependencies [ff7ed66]
- Updated dependencies [5e498dd]
- Updated dependencies [60401aa]
- Updated dependencies [c2c3a7f]
- Updated dependencies [25225ab]
- Updated dependencies [2aaf365]
- Updated dependencies [ba1d3bd]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [5f00be7]
- Updated dependencies [302e330]
- Updated dependencies [d1fb1d7]
- Updated dependencies [27659ef]
- Updated dependencies [4e189a0]
- Updated dependencies [0027a41]
- Updated dependencies [27659ef]
- Updated dependencies [e324c72]
- Updated dependencies [b6e555f]
- Updated dependencies [f8a5d80]
- Updated dependencies [60c193c]
- Updated dependencies [86919df]
  - @lowdefy/blocks-antd-x@5.4.0
  - @lowdefy/api@5.4.0
  - @lowdefy/client@5.4.0
  - @lowdefy/operators-js@5.4.0
  - @lowdefy/blocks-antd@5.4.0
  - @lowdefy/helpers@5.4.0
  - @lowdefy/actions-core@5.4.0
  - @lowdefy/block-utils@5.4.0
  - @lowdefy/errors@5.4.0
  - @lowdefy/blocks-tiptap@5.4.0
  - @lowdefy/connection-axios-http@5.4.0
  - @lowdefy/connection-mongodb@5.4.0
  - @lowdefy/operators-nunjucks@5.4.0
  - @lowdefy/operators-uuid@5.4.0
  - @lowdefy/layout@5.4.0
  - @lowdefy/blocks-basic@5.4.0
  - @lowdefy/blocks-loaders@5.4.0
  - @lowdefy/logger@5.4.0
  - @lowdefy/node-utils@5.4.0
  - @lowdefy/blocks-markdown@5.4.0

## 5.3.0

### Patch Changes

- Updated dependencies [6955341]
- Updated dependencies [28e2913]
- Updated dependencies [54d30f7]
  - @lowdefy/api@5.3.0
  - @lowdefy/blocks-markdown@5.3.0
  - @lowdefy/blocks-antd@5.3.0
  - @lowdefy/blocks-tiptap@5.3.0
  - @lowdefy/client@5.3.0
  - @lowdefy/layout@5.3.0
  - @lowdefy/actions-core@5.3.0
  - @lowdefy/blocks-basic@5.3.0
  - @lowdefy/blocks-loaders@5.3.0
  - @lowdefy/connection-axios-http@5.3.0
  - @lowdefy/connection-mongodb@5.3.0
  - @lowdefy/operators-js@5.3.0
  - @lowdefy/operators-nunjucks@5.3.0
  - @lowdefy/operators-uuid@5.3.0
  - @lowdefy/block-utils@5.3.0
  - @lowdefy/errors@5.3.0
  - @lowdefy/helpers@5.3.0
  - @lowdefy/logger@5.3.0
  - @lowdefy/node-utils@5.3.0

## 5.2.0

### Patch Changes

- 596fddc: chore(connection-knex): update knex and SQL drivers; replace `sqlite3` with `better-sqlite3`; replace `mysql` with `mysql2`.

  Bumped knex and its dialect drivers, and consolidated onto the actively-maintained drivers — replaced `sqlite3` with `better-sqlite3` and `mysql` with `mysql2`. Subsumes the prior `sqlite3@5.1.7` darwin-arm64 fix.

  `@lowdefy/connection-knex` dependency changes:

  - `knex` `2.5.1` → `3.2.9`. Knex 3.x drops Node < 16; Lowdefy already requires Node 18+. The `knex(config)`, `.raw()`, and dynamic query-builder API surface used by `KnexRaw` / `KnexBuilder` is unchanged.
  - `pg` `8.11.3` → `8.20.0`.
  - **Removed** `mssql`. Knex's `mssql` dialect actually requires `tedious` (not the `mssql` package), and Lowdefy never imported `mssql` directly — it was only ever a vehicle for pulling tedious into the install tree. `client: mssql` in user YAML is unchanged: the knex client name stays the same, only the underlying npm package shipped with `connection-knex` changes.
  - **Added** `tedious` `19.2.1` as the SQL Server driver — the package knex actually loads when `client: mssql` is used.
  - **Removed** `sqlite3`. The driver is in maintenance-only mode upstream (the v6 release marked the repo unmaintained).
  - **Added** `better-sqlite3` `12.9.0` as the SQLite driver. Selectable as `client: better-sqlite3` (or `client: sqlite`, which is now an alias of `better-sqlite3` — see runtime client handling below).
  - **Removed** `mysql`. Unmaintained upstream since 2020.
  - **Added** `mysql2` `3.22.3` as the MySQL / MariaDB driver. Selectable as `client: mysql2` in connection YAML.

  Runtime client handling (in `createKnex`):

  - `client: sqlite` is silently remapped to `client: better-sqlite3`. `sqlite` was historically a knex-level alias of `sqlite3`; this preserves the YAML alias while the underlying driver changes.
  - `client: sqlite3` now throws a `ConfigError` with a migration message: `Knex connection "client: sqlite3" is no longer supported. Use "client: better-sqlite3" or "client: sqlite" instead.` Existing apps using `client: sqlite3` need to update their connection YAML.
  - `client: mysql` now throws a `ConfigError` with a migration message: `Knex connection "client: mysql" is no longer supported. Use "client: mysql2" instead.` Existing apps using `client: mysql` need to update their connection YAML. `mysql` is **not** silently remapped because knex treats `mysql` and `mysql2` as separate dialects with subtly different SQL formatters, not aliases — the migration is a deliberate user choice.

  `pnpm.onlyBuiltDependencies` allowlist for `better-sqlite3`:

  `better-sqlite3` runs a native-binding install script (`prebuild-install` with a `node-gyp rebuild` fallback). pnpm 10 silently suppresses postinstall scripts for unapproved packages, which leaves the binding unbuilt and crashes `KnexRaw` / `KnexBuilder` at runtime.

  - Added `better-sqlite3` to the allowlist on `@lowdefy/server`, `@lowdefy/server-dev`, and `@lowdefy/server-e2e`. These are the install roots in the CLI fetch flow under `.lowdefy/{dev,build}/`, where pnpm honors the per-package `pnpm.onlyBuiltDependencies` field.
  - Also added the same allowlist to the monorepo root `package.json`. The per-package field is ignored at workspace-root install (pnpm 10 only honors it on the install root), so contributors running `pnpm install` at the repo root would otherwise have to `pnpm rebuild better-sqlite3` manually.

- 762755c: feat(blocks-tiptap): Add new default block package with `TiptapInput` and `TiptapMentionInput` rich-text editors.

  `@lowdefy/blocks-tiptap` ships two rich-text editor blocks built on [TipTap](https://tiptap.dev):

  - **`TiptapInput`** — standard rich-text editor with bold/italic/strike-through, multi-color highlight, headings, lists, tables, links, and a bubble menu.
  - **`TiptapMentionInput`** — everything `TiptapInput` does, plus an @-mention dropdown populated from a static options list or a Lowdefy request. Resolved mentions are returned on the block value as `mentions: [...]`.

  Both blocks emit an object value shaped `{ html, text, markdown, fileList, mentions? }` and register `clear`, `setContent`, and `focus` methods.

  **Configurable extensions** — defaults preserve the bundled editor; override any of these to trim the editor down or tune it:

  - `properties.starterKit` — object forwarded to TipTap [StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit), e.g. `{ heading: false, codeBlock: false }`.
  - `properties.image` — `{ enabled, maxWidth, zoom }`
  - `properties.table` — `{ enabled, resizable }`
  - `properties.link` — `{ enabled, autolink, linkOnPaste, openOnClick, defaultProtocol }`
  - `properties.highlight` — `{ enabled, multicolor }`
  - `properties.mentions.char` / `properties.mentions.allowSpaces` — change the trigger char (e.g. `#` for hashtags) or disable spaces inside a mention query (`TiptapMentionInput` only).

  Image drag/drop and paste are supported by pointing `properties.s3PostPolicyRequestId` at a request that returns an S3 presigned POST policy (e.g. `AwsS3PresignedPostPolicy`). The file handler is optional — omit the request id to disable uploads entirely.

  The blocks are registered in the default types map and are available out of the box on `@lowdefy/server-dev`. No private-registry tokens are required: the blocks use the open-source [`@tiptap/extension-file-handler`](https://www.npmjs.com/package/@tiptap/extension-file-handler) instead of `@tiptap-pro/extension-file-handler`, so projects that migrated from a custom TipTap plugin can drop their `TIPTAP_PRO_TOKEN` environment variable and `.npmrc` scoped-registry config.

- Updated dependencies [1d18a13]
- Updated dependencies [01e249b]
- Updated dependencies [762755c]
- Updated dependencies [73fa2b9]
- Updated dependencies [69a59c0]
- Updated dependencies [6ec2cd9]
- Updated dependencies [0d44433]
- Updated dependencies [fd1604f]
- Updated dependencies [a4ecee5]
- Updated dependencies [6ec0dd4]
- Updated dependencies [e3fc007]
- Updated dependencies [cea34ac]
- Updated dependencies [c91003d]
  - @lowdefy/actions-core@5.2.0
  - @lowdefy/operators-js@5.2.0
  - @lowdefy/blocks-antd@5.2.0
  - @lowdefy/client@5.2.0
  - @lowdefy/blocks-tiptap@5.2.0
  - @lowdefy/api@5.2.0
  - @lowdefy/logger@5.2.0
  - @lowdefy/blocks-loaders@5.2.0
  - @lowdefy/operators-nunjucks@5.2.0
  - @lowdefy/operators-uuid@5.2.0
  - @lowdefy/layout@5.2.0
  - @lowdefy/blocks-basic@5.2.0
  - @lowdefy/blocks-markdown@5.2.0
  - @lowdefy/connection-axios-http@5.2.0
  - @lowdefy/connection-mongodb@5.2.0
  - @lowdefy/block-utils@5.2.0
  - @lowdefy/errors@5.2.0
  - @lowdefy/helpers@5.2.0
  - @lowdefy/node-utils@5.2.0

## 5.1.0

### Patch Changes

- Updated dependencies [95388a581]
- Updated dependencies [573b90369]
- Updated dependencies [be367bebd]
- Updated dependencies [b1e0c9944]
- Updated dependencies [447f8ce57]
- Updated dependencies [36a2d1bca]
- Updated dependencies [081d79634]
- Updated dependencies [f56a47d87]
- Updated dependencies [6c6aab961]
- Updated dependencies [af8ef77cb]
  - @lowdefy/blocks-antd@5.1.0
  - @lowdefy/client@5.1.0
  - @lowdefy/operators-js@5.1.0
  - @lowdefy/api@5.1.0
  - @lowdefy/layout@5.1.0
  - @lowdefy/actions-core@5.1.0
  - @lowdefy/blocks-basic@5.1.0
  - @lowdefy/blocks-loaders@5.1.0
  - @lowdefy/blocks-markdown@5.1.0
  - @lowdefy/connection-axios-http@5.1.0
  - @lowdefy/connection-mongodb@5.1.0
  - @lowdefy/operators-nunjucks@5.1.0
  - @lowdefy/operators-uuid@5.1.0
  - @lowdefy/block-utils@5.1.0
  - @lowdefy/errors@5.1.0
  - @lowdefy/helpers@5.1.0
  - @lowdefy/logger@5.1.0
  - @lowdefy/node-utils@5.1.0

## 5.0.0

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
  - @lowdefy/blocks-markdown@5.0.0
  - @lowdefy/operators-js@5.0.0
  - @lowdefy/actions-core@5.0.0
  - @lowdefy/helpers@5.0.0
  - @lowdefy/connection-axios-http@5.0.0
  - @lowdefy/operators-nunjucks@5.0.0
  - @lowdefy/operators-uuid@5.0.0
  - @lowdefy/node-utils@5.0.0
  - @lowdefy/api@5.0.0
  - @lowdefy/connection-mongodb@5.0.0
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
  - @lowdefy/block-utils@4.7.3
  - @lowdefy/errors@4.7.3
  - @lowdefy/helpers@4.7.3
  - @lowdefy/logger@4.7.3
  - @lowdefy/node-utils@4.7.3

## 4.7.2

### Patch Changes

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
- @lowdefy/block-utils@4.7.2
- @lowdefy/errors@4.7.2
- @lowdefy/helpers@4.7.2
- @lowdefy/logger@4.7.2
- @lowdefy/node-utils@4.7.2

## 4.7.1

### Patch Changes

- d2cd70c3f: feat(server-e2e): Add LOWDEFY*E2E_SECRET*\* override support.

  Secrets can now be overridden in e2e tests using `LOWDEFY_E2E_SECRET_*` environment variables. These take precedence over `LOWDEFY_SECRET_*` values, allowing test infrastructure (e.g. MongoMemoryServer) to coexist with secret managers injected via `commandPrefix`.

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
  - @lowdefy/block-utils@4.7.1
  - @lowdefy/errors@4.7.1
  - @lowdefy/helpers@4.7.1
  - @lowdefy/logger@4.7.1
  - @lowdefy/node-utils@4.7.1

## 4.7.0

### Patch Changes

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
  - @lowdefy/errors@4.7.0

## 4.6.0

### Patch Changes

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
