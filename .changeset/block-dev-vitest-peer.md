---
'@lowdefy/block-dev': patch
---

fix(deps): Make vitest a peer dependency of `@lowdefy/block-dev`

`@lowdefy/block-dev` no longer installs its own copy of vitest. Its test helpers (`runRenderTests`, `runMockRenderTests`, `runMockMethodTests`, `runBlockSchemaTests` and `mockBlock`) register tests and mocks with vitest, so they must use the same vitest your plugin's tests run with. They now use yours, and work with vitest 4.1 and later 4.x releases, and with vitest 5.

If your plugin already has vitest 4.1 or later, or vitest 5, as a devDependency, nothing changes. Otherwise add vitest to your devDependencies. npm 7 and later and pnpm install a missing peer dependency for you, and warn when your vitest is outside `^4.1.0 || ^5.0.0`.
