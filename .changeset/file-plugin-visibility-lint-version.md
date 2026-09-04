---
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat: file plugins are visible to the agent, linted at build, and versionable

`lowdefy_list_types` and `lowdefy_get_schema` list a file plugin with a `"file plugin"` source and the path it lives at; `lowdefy_get_examples` serves a `Card.examples.yaml` written beside the plugin, and names the file to create when there is none; `lowdefy_get_plugin_doc` serves a `readme` field from the plugin's sibling JSON, looked up by type name or path. Every plugin file is parsed and name-resolved at build under the `js-lint` check: a syntax error or a name that is not imported, declared, or a global of the environment the plugin runs in (browser for blocks, actions and client operators; server for server and build operators; only what both have for `operators/shared`) is a located build error naming the file and line instead of a browser overlay at render time, and an unused top-level declaration is a warning. A file plugin may declare `pluginApiVersion` in its sibling JSON; declaring nothing means the version the app's Lowdefy implements, and a mismatch is the same build error a plugin package's is.
