---
'@lowdefy/server-dev': minor
'lowdefy': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
'@lowdefy/codemods': patch
---

feat(server-dev): A smaller dev server agent surface, so an agent session starts on about half the tokens.

Removed dev tools: `lowdefy_list_plugins`, `lowdefy_get_plugin_doc`, `lowdefy_overview`, `lowdefy_scaffold_page`, `lowdefy_checkpoint`, `lowdefy_revert_checkpoint`, `lowdefy_snapshot_state`, `lowdefy_load_state`, `lowdefy_list_state_checkpoints` and `lowdefy_checkpoint_to_mocks`. The config and state checkpoint stores, the `?_checkpoint=` URL and the dev mock registry go with them. Use git for config checkpoints, `list_types` for a type's package, and `get_doc` or `search_docs` for plugin docs. `lowdefy_restart` stays, hidden.

Merged: `lowdefy_eval_operator` is now the optional `expression` argument of `lowdefy_inspect_state`. It takes the same `pageId`, `pathParams`, `source`, `user` and `data` arguments, and returns `{ value, errors, source, reads }`, where `reads` names the paths the expression read. A dev server older than this release answers `expression` with plain state and no value.

Removed HTTP routes under `/lowdefy-docs` that only mirrored a tool: `app-map`, `checkpoints*`, `state-checkpoints*`, `eval-operator`, `run-request`, `run-endpoint`, `inspect-state`, `screenshot`, `plugins`, `schema`, `examples`, `search`, `icons`, `plugin-doc`, `content` and `:kind`. `build-status`, `journey`, `mutants`, `page-config`, `find`, `events`, `restart`, `mcp` and `GET /lowdefy-docs` stay.

The MCP instructions shrink from 7,000 to at most 2,500 characters, and the dev server's `tools/list` to at most 25,000. The journey step grammar is served only by `lowdefy_get_schema` with `kind: "journey-step"`. Tool results are compact JSON, and `lowdefy_get_page_config` caps its page at 40,000 characters, with an optional `blockId` for one block's subtree.

fix(cli): `lowdefy mcp` logs each tool call to `tool-calls.jsonl` in the Lowdefy home: the tool, the app, the time, the duration and whether it worked, with no arguments or results. The file stays on your machine and rolls over at 1 MB. `lowdefy agent-setup` no longer repeats the dev server rules between AGENTS.md and the `lowdefy-config` skill. Tests hold the shim's `tools/list` for a current server to 40,000 characters.
