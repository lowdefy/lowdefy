---
name: lowdefy-config
description: Use when writing or editing Lowdefy YAML config — pages, blocks, operators, actions, connections, or requests. Looks up exact type names, schemas, and examples from the running dev server instead of guessing.
---

# Writing Lowdefy config

The `lowdefy` MCP server (`lowdefy mcp`, set up with `npx lowdefy agent-setup`) gives you docs for
everything installed in this project as tools, read from the app's dev server. It starts that dev
server when needed: never run `lowdefy dev` yourself or choose a port. Pass `directory` on each
`lowdefy_` call when you work in another git worktree or project than the session's. Without the MCP
server, the same docs are HTTP routes under `/lowdefy-docs` on whichever port the dev server runs.

Never guess type names or properties. Before writing config:

1. Call `lowdefy_list_types` (or `GET /lowdefy-docs/blocks`, `/lowdefy-docs/operators`,
   `/lowdefy-docs/actions`, `/lowdefy-docs/connections`, `/lowdefy-docs/requests`) to find the exact
   type name — this includes this project's local plugins.
2. Call `lowdefy_get_schema` (or `GET /lowdefy-docs/schema/{kind}/{type}`) for the
   exact properties and events of that type.
3. Call `lowdefy_get_examples` (or `GET /lowdefy-docs/examples/{type}`) to see real
   usage YAML for blocks.
4. For concepts (state, operators, events, requests), call `lowdefy_get_doc`
   or `lowdefy_search_docs`.
