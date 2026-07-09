---
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs-content': minor
'@lowdefy/blocks-aggrid': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-antd-x': patch
'@lowdefy/blocks-basic': patch
'@lowdefy/blocks-diff': patch
'@lowdefy/blocks-echarts': patch
'@lowdefy/blocks-files': patch
'@lowdefy/blocks-google-maps': patch
'@lowdefy/blocks-qr': patch
'@lowdefy/blocks-loaders': patch
'@lowdefy/blocks-markdown': patch
'@lowdefy/blocks-tiptap': patch
---

feat: Dev server docs and MCP endpoint for AI coding agents

The dev server now always serves documentation for everything installed in your project — every block, operator, action, connection and request type, from core plugins and your own local plugins — plus the full Lowdefy docs as markdown.

**Docs API and MCP endpoint (`@lowdefy/server-dev`)**

- Plain GET routes under `/docs`: list all available types per kind, JSON schemas per type, block usage examples, docs pages as markdown, and search.
- An MCP endpoint (streamable HTTP) at `/docs/mcp` exposing the same as tools (`lowdefy_list_types`, `lowdefy_get_schema`, `lowdefy_get_examples`, `lowdefy_get_doc`, ...) so agents like Claude Code can look up exact type contracts instead of guessing.
- The `/docs` page path prefix is now reserved in dev.

**Discovery build artifacts (`@lowdefy/build`)**

- Dev builds now write `plugins/availableTypes.json` (every installed type, used or not) and `plugins/connectionSchemas.json` + `plugins/requestSchemas.json` (collected from connection definitions).
- Fixed custom/local plugin schemas being silently missing from all schema maps — plugin modules now also resolve from the server directory.

**Docs content package (`@lowdefy/docs-content`)**

- New package shipping the Lowdefy docs extracted as markdown with a manifest, generated from the docs app build (`pnpm docs:content`).

**Block plugins**

- Block packages now publish their `gallery.yaml`/`examples.yaml`/`tests.yaml` files in `dist/`, so the docs API can serve real examples.
