---
name: lowdefy-config
description: Use when writing or editing Lowdefy YAML config — pages, blocks, operators, actions, connections, or requests. Looks up exact type names, schemas, and examples from the running dev server instead of guessing.
kind: reference
lowdefyVersion: 5.5.1
---

# Writing Lowdefy config

The dev server serves docs for everything installed in this project at
`http://localhost:3000/lowdefy-docs` (also as MCP tools via the `lowdefy-docs` server).

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
