---
'@lowdefy/build': minor
'lowdefy': minor
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
---

feat(build): single-file plugins are loaded, not just discovered

A block, action or operator written as one file under `plugins/` is imported directly by the generated plugin barrels: in place under the config directory in development, so Vite hot-replaces it as you edit, and from a copy inside the server directory for production builds, together with any files it imports relatively. Meta, schema and hazards are read from the plugin's sibling JSON file, so a file block is schema-validated and meta-checked exactly like a package block, and a block with no meta is a build error naming the JSON file to add it to. Server-side and build operators written as files restart the dev server when edited. For production, the dependencies declared in the app's `package.json` are installed into the server whenever the app has a `plugins` directory, so a file plugin can `import` any package the app depends on; a package the server already ships keeps the server's version.
