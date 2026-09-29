# Migration: Report Plugin Types That Override Lowdefy's Built-in Types

## Context

When a custom plugin exports a block, action, connection, request, operator or auth type with the same name as one of Lowdefy's built-in types, **the plugin's type wins**. The build merges the default types first and the app's plugins over them, so the plugin replaces the built-in type everywhere, without a warning.

Some overrides are deliberate. For example, `@lowdefy/community-plugin-mongodb` replaces the core MongoDB connection and request types. The risky case is a plugin that holds a **copy of a v5 built-in type**, often made to patch one detail. In v6 the rest of Lowdefy moved on, and the copy keeps its v5 behaviour:

- A local copy of the v5 `AwsS3Bucket` connection returned the v5 upload policy (`{ url, fields }`). The v6 upload blocks read `key` and `bucket` from the top level of the policy. Image drop and paste in `TiptapInput` threw, and `S3UploadDragger` saved files without the key needed to download them. The build and the upload itself both succeeded, so nothing pointed at the plugin.

This codemod is **report-only**: it lists every override, and the app author decides what to do with each one.

## Scope

`app` — the app's build output. Run it after a successful `lowdefy build`.

## What to Do

### Step 1: Build the app

```bash
lowdefy build
```

The build writes the types the app actually uses, and the package each one resolved to, to `build/types.json` in the server directory (`.lowdefy/server` by default; use the `--server-directory` passed to `lowdefy build` if set).

### Step 2: List types that override a built-in type

Save this script as `find-type-overrides.mjs` next to `lowdefy.yaml` and run it with the server directory:

```javascript
import fs from 'node:fs';
import path from 'node:path';

const server = path.resolve(process.argv[2] ?? '.lowdefy/server');
const { default: core } = await import(
  path.join(server, 'node_modules/@lowdefy/build/dist/defaultTypesMap.js')
);
const used = JSON.parse(fs.readFileSync(path.join(server, 'build/types.json'), 'utf8'));

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function walk(usedMap, coreMap, where) {
  Object.entries(usedMap).forEach(([name, entry]) => {
    if (!isPlainObject(entry)) return;
    if (typeof entry.package !== 'string') {
      walk(entry, coreMap?.[name] ?? {}, `${where}.${name}`);
      return;
    }
    const coreEntry = coreMap?.[name];
    if (coreEntry && coreEntry.package !== entry.package) {
      console.log(`${where}.${name}: ${entry.package} overrides ${coreEntry.package}`);
    }
  });
}

walk(used, core, 'types');
```

```bash
node find-type-overrides.mjs .lowdefy/server
```

Each line names a type, the plugin that provides it, and the built-in package it replaces:

```
types.connections.AwsS3Bucket: @acme/plugin-local overrides @lowdefy/plugin-aws
types.blocks.TreeSelector: @acme/plugin-local overrides @lowdefy/blocks-antd
```

Delete the script afterwards.

### Step 3: Classify each override

For every line, find the plugin's source for that type and decide which case it is:

| Case                                                | How to tell                                                                                                                 | Recommendation                                                                                                                                             |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deliberate replacement** from a maintained plugin | A published plugin whose purpose is to replace the built-in, e.g. `@lowdefy/community-plugin-mongodb`                       | Keep it. Check the plugin has a release for this Lowdefy major version.                                                                                    |
| **Copy of a built-in**                              | Same name, and the source is close to the v5 built-in (often with an old SDK, e.g. `aws-sdk` v2 instead of `@aws-sdk/*` v3) | **Delete the copy** so the v6 built-in is used. First check the app only uses properties the v6 built-in supports (its schema is in the built-in package). |
| **Different type that shares a name**               | Unrelated behaviour that happens to share a built-in's name                                                                 | **Rename** the plugin type (e.g. prefix it) and update the app's config to use the new name.                                                               |

### Step 4: Report

Produce one entry per override:

- The type and its kind (block, connection, request, ...).
- The plugin that provides it and the built-in package it replaces.
- The case from Step 3 and the recommended action.
- For a copy: the differences from the v6 built-in that the app relies on, if any.

Do not delete or rename anything without the app author's approval. A plugin may override a type on purpose, for a reason the source doesn't show.

### Step 5: Verify

After any deletions or renames, rebuild and rerun the script. Only the overrides the author chose to keep should remain. Then test the features that use each changed type, especially file uploads and downloads for connection and request types.

## Files to Check

- `build/types.json` in the server directory — the resolved package for every used type
- `node_modules/@lowdefy/build/dist/defaultTypesMap.js` in the server directory — Lowdefy's built-in types
- Each custom plugin's `types.js` and the source of every overriding type

## Edge Cases

- **Only used types are reported.** `build/types.json` lists types the app's config uses. A plugin type that shadows a built-in but isn't used anywhere doesn't appear, and doesn't affect the app.
- **Community plugins** are listed too. Their overrides are usually deliberate, so check the plugin's v6 compatibility rather than removing them.
- **Multiple apps in one repo:** run the script for each app's server directory.
