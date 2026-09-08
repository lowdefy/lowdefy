# Migration: Plugin Packages for the Hono + Vite Server (ESM Exports, Auth.js Imports)

## Context

In Lowdefy v6 the server no longer runs on Next.js. The production server is a Hono app running as **plain, unbundled Node.js ESM**, and the client is bundled by Vite. This changes how plugin packages are loaded:

- **Server-side plugin files** (`connections`, `agents`, `operators/server`, `auth/*`) are imported by Node.js directly from the generated `build/plugins/*.js` files. Node's ESM resolver is **stricter than a bundler**: it does not try `.js` completion and does not resolve `index.js` inside directories.
- **Client-side plugin files** (`blocks`, `actions`, `operators/client`, `metas`, `icons`, plus any CSS the blocks import) are bundled by Vite, which resolves package `exports` the standard way.

A plugin that worked in v5 can crash the v6 server at startup with:

```
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '.../node_modules/<plugin>/dist/connections'
is not supported resolving ES modules imported from .../build/plugins/connections.js
```

This happens when the plugin's `exports` map resolves a subpath to a **directory** instead of a file. A wildcard like `"./*": "./dist/*"` substitutes literally — the specifier `<plugin>/connections` maps to `dist/connections`, and if that is a directory (with the real barrel at `dist/connections.js` or `dist/connections/index.js`), Node refuses it. Bundlers silently completed this to a file, which is why v5 never surfaced the problem.

Additionally, **auth plugins can no longer import from `next-auth`**. The v6 auth engine is Auth.js (`@auth/core`). The `next-auth` package is gone from the server, and although a plugin that ships its own `next-auth` dependency may still load, it should migrate to `@auth/core` imports, which are clean ESM (no `.default` CJS workaround).

This migration targets **plugin package source and `package.json`** (local plugins and published plugin packages), not YAML configs.

## Scope

`plugins` — scan `package.json` and source files of custom plugin packages (workspace plugins, `git:`/`link:` plugins, and your published plugin packages).

## What to Do

### 1. Make every Lowdefy entry-point subpath in `exports` resolve to a file

List the subpaths Lowdefy generates imports for, based on what the plugin provides:

| Plugin provides | Imported subpath |
| --- | --- |
| Connections/requests | `<plugin>/connections` |
| Blocks | `<plugin>/blocks`, `<plugin>/metas` |
| Actions | `<plugin>/actions` |
| Operators | `<plugin>/operators/client`, `<plugin>/operators/server` |
| Auth providers/adapters/callbacks/events | `<plugin>/auth/providers`, `<plugin>/auth/adapters`, `<plugin>/auth/callbacks`, `<plugin>/auth/events` |
| Agents | `<plugin>/agents` |
| All plugins | `<plugin>/types` (and optionally `<plugin>/schemas`) |

For each of these that the plugin uses, add an **explicit file entry** to `exports`. Explicit entries take precedence over wildcards, so the wildcard can stay for other paths:

```json
{
  "exports": {
    "./connections": "./dist/connections.js",
    "./types": "./dist/types.js",
    "./*": "./dist/*"
  }
}
```

Do **not** rely on `"./*": "./dist/*"` alone for any of the entry-point subpaths above — it maps the specifier to a directory whenever a folder with the same name exists next to the barrel file.

If the barrel file does not exist (e.g. only `dist/connections/MyConnection.js` exists), create a barrel `src/connections.js` that re-exports each type and rebuild, then point the export at it.

### 2. Replace `next-auth` imports in auth plugins with `@auth/core`

For auth provider plugins:

```javascript
// Before (v4/v5)
import _googleProvider from 'next-auth/providers/google';
const GoogleProvider = _googleProvider.default; // CJS workaround

// After (v6)
import GoogleProvider from '@auth/core/providers/google';
```

All provider module ids are unchanged (`@auth/core/providers/<id>` matches the old `next-auth/providers/<id>`), and the `.default` CJS workaround is no longer needed — `@auth/core` is native ESM.

For custom OAuth/OIDC provider objects, the v4 shape still works; for OpenID Connect providers prefer the v5 `type: 'oidc'` (discovery and ID token handling are built in, so `idToken: true` is redundant).

For adapter plugins wrapping the MongoDB adapter:

```javascript
// Before
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';

// After — same call shape
import { MongoDBAdapter } from '@auth/mongodb-adapter';
```

Update `package.json`: remove `next` and `next-auth` from dependencies/peerDependencies; add `@auth/core` (and `@auth/mongodb-adapter` if used).

Plugins that keep their own `next-auth@4` dependency for provider factories (e.g. a custom email provider wrapping `next-auth/providers/email`) continue to work — the v4 provider object shape is compatible with the Auth.js engine — but migrating removes a duplicate auth engine from the install.

### 3. Remove any `next/*` imports and `NEXT_PUBLIC_*` env reads

Client plugin code is bundled by Vite. `next/head`, `next/link`, `next/router`, `next/dynamic` no longer exist — blocks receive `Components.Head`, `Components.Link` and `router` through the framework adapter props as before, so most blocks need no change. `process.env.NEXT_PUBLIC_*` variables are not defined under Vite; only `process.env.NODE_ENV` is replaced.

### 4. Prefer ESM dists

Server-side plugin files load as Node ESM. CJS dists still load through Node's interop, but explicit file exports are required either way. If the plugin's build outputs CJS, consider adding `"type": "module"` and building ESM output — this matches all `@lowdefy/*` plugin packages.

## Files to Check

- `package.json` — `exports` map, `type`, dependencies (`next`, `next-auth`, `@next-auth/mongodb-adapter`)
- `src/auth/**` — `next-auth` imports
- `src/**` — `next/*` imports, `NEXT_PUBLIC_*` reads
- Build output (`dist/`) — confirm the barrel files the exports point at actually exist

## Examples

### Before — plugin `package.json` (crashes the v6 server)

```json
{
  "name": "@my-org/plugin-local",
  "type": "module",
  "exports": {
    "./*": "./dist/*"
  },
  "peerDependencies": {
    "next-auth": ">=4.24"
  }
}
```

### After — plugin `package.json`

```json
{
  "name": "@my-org/plugin-local",
  "type": "module",
  "exports": {
    "./connections": "./dist/connections.js",
    "./types": "./dist/types.js",
    "./*": "./dist/*"
  },
  "dependencies": {
    "@auth/core": "0.41.2"
  }
}
```

## Edge Cases

- **`<plugin>/schemas` and `<plugin>/metas`**: the build imports these inside `try/catch` — a missing `schemas` export degrades gracefully (no schema validation for that plugin), but a wrong one that resolves to a directory still warns. Point them at files or omit them.
- **Deep wildcard exports** (`"./connections/*": "./dist/connections/*"`) for per-file imports can coexist with the explicit barrel entry.
- **Published plugins**: a new version must be published; `lowdefy build` installs from the registry. For local testing, use a `link:`/`file:` plugin reference.

## Verification

1. Resolve every generated plugin import the way Node will. From the built server directory (`<config-directory>/.lowdefy/server`):

   ```bash
   node --input-type=module -e "
   import fs from 'node:fs';
   import { fileURLToPath } from 'node:url';
   const files = ['build/plugins/connections.js','build/plugins/agents.js','build/plugins/operators/server.js','build/plugins/auth/adapters.js','build/plugins/auth/callbacks.js','build/plugins/auth/events.js','build/plugins/auth/providers.js'];
   let bad = 0;
   for (const f of files) {
     if (!fs.existsSync(f)) continue;
     for (const m of fs.readFileSync(f, 'utf8').matchAll(/from '([^']+)'/g)) {
       try {
         const p = fileURLToPath(import.meta.resolve(m[1], new URL('build/plugins/x.js', import.meta.url).href));
         const stat = fs.statSync(p, { throwIfNoEntry: false });
         if (!stat || stat.isDirectory()) { console.log('BAD:', m[1], '→', p); bad++; }
       } catch (e) { console.log('BAD:', m[1], e.code); bad++; }
     }
   }
   console.log(bad === 0 ? 'all server plugin imports resolve to files' : bad + ' failing imports');
   "
   ```

   Note: a plain `import.meta.resolve` check is not enough — it does not touch the filesystem, so the `stat` check is what catches directory resolutions.

2. `lowdefy build && lowdefy start` — the server must boot without `ERR_UNSUPPORTED_DIR_IMPORT` or `ERR_MODULE_NOT_FOUND`.

3. For auth plugins: complete a sign-in flow (the providers list at `/api/auth/providers` must include the plugin's provider ids).
