# Migration: Plugin `react`, `react-dom`, and `antd` to Peer Dependencies

## Context

In a pnpm monorepo, if a custom block plugin declares `react` or `react-dom` as direct dependencies (even with a range like `^18` or `^19`), pnpm may install a **second React instance** in the store. The Lowdefy dev server pins its own React version, and when plugin components resolve to a different copy, **two React context trees** exist at runtime. This breaks:

- **antd theme inheritance** — dark mode, compact algorithm, and design tokens from `ConfigProvider` are invisible to plugin blocks
- **React hooks** — hooks called in the plugin's React copy throw "Invalid hook call" or silently malfunction
- **React context** — any context (including antd's internal contexts) shared between the host app and plugin blocks is split across instances

The fix is to declare `react`, `react-dom`, and `antd` as **peer dependencies** in plugin packages, and optionally use `pnpm.overrides` in the root `package.json` to force a single version across the workspace.

This migration targets `package.json` files in custom block plugin directories, not YAML configs.

## Scope

`plugins` — scan `package.json` files in local block plugin directories.

## What to Do

### 1. Move `react` and `react-dom` from `dependencies` to `peerDependencies`

For each custom block plugin `package.json`, remove `react` and `react-dom` from `dependencies` and add them to `peerDependencies` with an open range:

```json
{
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  }
}
```

Do **not** pin a specific version (e.g., `"18.2.0"` or `"^19.0.0"`). The range `>=18` lets the plugin work with whatever React version the Lowdefy dev server provides.

### 2. Move `antd` from `dependencies` to `peerDependencies` (if present)

If the plugin imports from `antd` directly (e.g., `import { Tag } from 'antd'`), it should declare `antd` as a peer dependency:

```json
{
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
    "antd": ">=5"
  }
}
```

If the plugin only imports from `@lowdefy/blocks-antd` or other `@lowdefy/*` packages (not `antd` itself), antd does not need to be listed.

**Check which plugins import antd directly:**

```bash
grep -rn "from 'antd'" plugins/*/src/ --include='*.js'
grep -rn "from \"antd\"" plugins/*/src/ --include='*.js'
```

### 3. Add `pnpm.overrides` to the root `package.json`

In the monorepo root `package.json`, add `pnpm.overrides` to force a single React version across all workspace packages:

```json
{
  "pnpm": {
    "overrides": {
      "react": "18.2.0",
      "react-dom": "18.2.0"
    }
  }
}
```

This ensures that even if transitive dependencies pull in a different React version, pnpm collapses them all to one copy.

**Choose the version that the Lowdefy dev server uses.** As of Lowdefy v5, this is `18.2.0`.

### 4. Run `pnpm install`

Regenerate the lockfile to collapse duplicate installations:

```bash
pnpm install
```

### 5. Verify single React instance

Check that all plugin symlinks resolve to the same React copy:

```bash
readlink plugins/*/node_modules/react
```

All paths should point to the same `react@18.2.0` store entry.

## Files to Check

Glob: `plugins/*/package.json`

Grep patterns:

- `"react":` in `dependencies` — should only appear in `peerDependencies` for plugin packages
- `"react-dom":` in `dependencies` — same
- `"antd":` in `dependencies` — move to `peerDependencies` if plugin imports antd directly

Also check non-plugin packages that might pull in a competing React version:

```bash
grep -rn '"react":' */package.json --include='package.json'
```

If other non-plugin packages in the workspace have React as a direct dependency, consider aligning those versions too, or rely on `pnpm.overrides` to force alignment.

## Examples

### Before — plugin `package.json`

```json
{
  "name": "@my-org/plugin-blocks",
  "dependencies": {
    "@lowdefy/block-utils": "5.0.0",
    "@lowdefy/helpers": "5.0.0",
    "antd": "4.22.5",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "@swc/cli": "0.1.57",
    "@swc/core": "1.2.194"
  }
}
```

### After — plugin `package.json`

```json
{
  "name": "@my-org/plugin-blocks",
  "dependencies": {
    "@lowdefy/block-utils": "5.0.0",
    "@lowdefy/helpers": "5.0.0"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
    "antd": ">=5"
  },
  "devDependencies": {
    "@swc/cli": "0.1.57",
    "@swc/core": "1.2.194"
  }
}
```

### Before — root `package.json` (no overrides)

```json
{
  "name": "my-lowdefy-app",
  "private": true,
  "packageManager": "pnpm@8.15.4"
}
```

### After — root `package.json` (with overrides)

```json
{
  "name": "my-lowdefy-app",
  "private": true,
  "packageManager": "pnpm@8.15.4",
  "pnpm": {
    "overrides": {
      "react": "18.2.0",
      "react-dom": "18.2.0"
    }
  }
}
```

## Edge Cases

- **Non-plugin packages** (APIs, lambdas, Next.js apps): These are standalone apps that bundle their own React. They should keep `react` and `react-dom` as direct dependencies. The `pnpm.overrides` in the root ensures they still use the same version.
- **Plugins without blocks** (auth adapters, operators, connections): If a plugin doesn't render React components, it doesn't need `react` or `react-dom` at all — neither as dependencies nor peer dependencies. Only block plugins need this migration.
- **`@monaco-editor/react` and similar**: Libraries that have `react` as a peer dependency themselves work correctly when the plugin also uses peer dependencies — pnpm resolves them all to the same overridden version.
- **Transitive React dependencies**: If another workspace package depends on a library that has its own React peer dependency (e.g., an email rendering library, a rich text editor), the `pnpm.overrides` will force alignment. Verify the library accepts the pinned version before upgrading.
- **Future React 19 upgrade**: When Lowdefy upgrades to React 19, update the `pnpm.overrides` version. The plugin peer dep ranges (`>=18`) will continue to work without changes.
- **`antd` version**: In Lowdefy v5, antd is v6.x. Plugins that import antd directly should use `"antd": ">=5"` as the peer dep range (not `>=4`) to prevent accidentally resolving to antd v4 which has incompatible APIs.

## Verification

1. No plugin should have `react` or `react-dom` in `dependencies`:

   ```bash
   # Should return no matches in plugin package.json files
   grep -A1 '"dependencies"' plugins/*/package.json | grep '"react"'
   ```

2. All plugins with block exports should have `react` and `react-dom` in `peerDependencies`:

   ```bash
   grep -A3 '"peerDependencies"' plugins/*/package.json | grep '"react"'
   ```

3. Root `package.json` should have `pnpm.overrides`:

   ```bash
   grep -A4 '"overrides"' package.json
   ```

4. After `pnpm install`, all plugins resolve to the same React version:

   ```bash
   readlink plugins/*/node_modules/react
   ```

5. Build each plugin and start the dev server — blocks should inherit the antd theme (dark mode toggle, compact algorithm, design tokens)
