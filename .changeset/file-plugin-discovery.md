---
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(build): single-file plugins are discovered in the app's `plugins` directory

Blocks in `plugins/blocks`, actions in `plugins/actions`, and operators in `plugins/operators/{build,client,server,shared}` are discovered with the type name taken from the file name and optional `meta`, `schema` and `hazards` read from a sibling JSON file. Block file names must be PascalCase, operator file names must start with an underscore, and a type name that a plugin package or another file plugin already defines is a build error naming both sources instead of a silent override. This release registers the type names; emitting the imports that load them follows in the next release.
