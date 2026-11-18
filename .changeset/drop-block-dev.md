---
'@lowdefy/block-dev-e2e': major
---

feat!: Remove `@lowdefy/block-dev`

`@lowdefy/block-dev`, the vitest helpers for unit testing block plugins (`runRenderTests`, `runMockRenderTests`, `runMockMethodTests`, `runBlockSchemaTests`, `mockBlock`, `stubBlockProps`), is no longer published. No Lowdefy package used it, and in Lowdefy 7 it could not be imported at all: it imported `createIcon` from `@lowdefy/block-utils`, which had moved to `@lowdefy/client`.

Lowdefy tests its blocks in a browser with Playwright instead, through `@lowdefy/block-dev-e2e`: each block package builds and serves a small Lowdefy app of example pages, and the tests drive the blocks on those pages. `@lowdefy/block-dev-e2e` expects the Lowdefy monorepo's layout, so for a block plugin in its own repository, write a small app that uses the plugin and test it with `@lowdefy/e2e-utils`. Remove `@lowdefy/block-dev` from your plugin's devDependencies; there is no replacement for its schema and snapshot unit tests.
