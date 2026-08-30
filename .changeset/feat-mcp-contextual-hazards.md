---
'@lowdefy/server-dev': minor
'@lowdefy/build': minor
'@lowdefy/docs-content': minor
'@lowdefy/blocks-basic': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/operators-js': patch
'@lowdefy/docs': patch
---

feat(server-dev): Return contextual hazards from the dev MCP with schemas, docs and config lookups.

`lowdefy_get_schema`, `lowdefy_get_doc` (by kind and type) and `lowdefy_find_config` (per match) now
include `hazards: [{ id, message, see }]` — behaviours of a type that its schema does not show, such as
`Html` stripping `<style>`, a closed `Modal` keeping its state, `_state` being `undefined` inside request
properties, or the tenant wall injecting a `$match` into every `$lookup` of a request over a walled
connection (`tenant-wall-lookup`, returned only when the request's connection is walled).

Hazards come from two channels. Plugins declare type-attached hazards through `meta.hazards`: the build
now carries them into `plugins/blockMetas.json`, request metas already ride along in
`plugins/requestSchemas.json`, and operator packages can export a `./metas` module which the build
writes to the new `plugins/operatorMetas.json`. Framework-level hazards ship hand-authored in
`@lowdefy/docs-content/hazards.json`. Seeds: `Html`, `DangerousHtml`, `Modal` and `_js` carry their
first hazards; the docs describe hazards and the `meta.hazards` plugin contract.
