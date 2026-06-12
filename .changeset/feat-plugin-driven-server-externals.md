---
'@lowdefy/build': minor
'@lowdefy/blocks-tiptap': patch
'@lowdefy/plugin-aws': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

feat: Plugin-driven `serverExternalPackages` for Next.js.

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
