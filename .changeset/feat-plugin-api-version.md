---
'@lowdefy/block-utils': minor
'@lowdefy/client': minor
'@lowdefy/build': minor
'@lowdefy/codemods': patch
'@lowdefy/docs': patch
---

feat: Version the plugin API and make deprecations self-explaining.

`@lowdefy/block-utils` now exports `PLUGIN_API_VERSION` (`1`) and `REMOVED_BLOCK_METHODS`, and
`code-docs/architecture/plugin-api.md` names the public plugin API — the block component contract,
the `meta` shape, the two `_js` prototypes, the request/connection, action and operator signatures —
with a four-stage deprecation policy (deprecate, explain, codemod, remove).

A block that calls a removed method (`methods.makeCssClass`) now fails with a located `BlockError`
naming the block, its type and the replacement, instead of a bare
`methods.makeCssClass is not a function`:

```
BlockError: Block "my-autocomplete" (type MyAutocomplete) called the removed block method "makeCssClass". Blocks receive resolved class names on the `classNames` prop and style objects on the `styles` prop … (plugin API v1)
```

The build now validates every installed block plugin's `meta` before anything reads it: a missing or
invalid `category`, an unknown `valueType`, `initValue` without a `valueType`, malformed `icons`,
`properties`, `cssKeys`, `slots`, `methods`, `events`, `dynamicEvents` or `hazards` is a
`ConfigError` naming the type, the package, the field and the received value; every bad field of one
meta is reported in a single build. Unknown meta keys are a warning and stay allowed.

**Breaking:** a block plugin whose `./metas` module does not export a meta for a block type the app
uses no longer builds — previously the block silently rendered as a plain display block. Add a
`meta.js` per block and a `metas.js` barrel; the `v5-0-0/21-migrate-custom-block-plugins` prompt in
`@lowdefy/codemods` covers the migration. A plugin package that is not installed yet (first build of
an app that adds it) is still skipped, as before.

`@lowdefy/codemods` adds `v8-0-0/02-removed-block-methods.md`, a standalone re-runnable prompt for
`methods.makeCssClass` that the runtime error points at.
