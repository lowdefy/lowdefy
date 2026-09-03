---
name: lowdefy-block-plugins
description: Use when the built-in blocks are not enough and a custom React block plugin is needed — the package layout, meta.js schema, how the dev server picks up local plugins, and when a plugin is the wrong answer.
kind: reference
lowdefyVersion: 5.5.1
---

# Custom block plugins

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `plugins/plugins-introduction`, `plugins/plugins-dev`.
<!-- generated:reference:end -->

## Recipe

Must cover: the block function signature (`blockId`, `properties`, `methods`, `events`), `meta.js` with `properties` schema and `events`, `types.js` exports, registering a local plugin in `lowdefy.yaml`, and when `Html`/`_js` already suffice.
