When you run `lowdefy dev`, the development server also serves a documentation API and an [MCP](https://modelcontextprotocol.io) endpoint built for AI coding agents. It describes everything installed in _your_ project — every block, operator, action, connection and request type from core Lowdefy plugins _and_ your own local plugins — plus the full Lowdefy documentation as markdown. This means an agent like Claude Code never has to guess type names or property shapes: it can look up the exact schema, real examples, and the relevant docs page while it writes your config.

Everything is served under the `/lowdefy-docs` path of your dev server (default `http://localhost:3000`). No setup or configuration is needed — it is always on in dev, and never part of your production server.

> The `/lowdefy-docs` route prefix is reserved by the dev server. A page with `id: lowdefy-docs` will not be reachable in dev.

## The MCP endpoint

The dev server exposes an MCP server (streamable HTTP) at:

```
http://localhost:3000/lowdefy-docs/mcp
```

It provides these tools:

| Tool                     | Purpose                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `lowdefy_overview`       | Start here — what is installed, counts per kind, and how to use the rest |
| `lowdefy_list_types`     | List ALL available types of a kind (blocks, operators, actions, connections, requests) |
| `lowdefy_list_plugins`   | Installed plugin packages, including local plugins, and the types each provides |
| `lowdefy_get_schema`     | JSON Schema for a specific type — all properties and events              |
| `lowdefy_get_examples`   | Real YAML usage examples for a block type                                |
| `lowdefy_get_doc`        | A Lowdefy docs page as markdown, by slug or by type name                 |
| `lowdefy_search_docs`    | Keyword search over the Lowdefy docs                                     |
| `lowdefy_get_plugin_doc` | Markdown (READMEs, guides) shipped inside an installed plugin package    |
| `lowdefy_build_status`   | Current build errors and warnings (with source file locations) plus recent browser runtime errors — call after every edit |
| `lowdefy_get_page_config`| The fully built config for a page, or its structured build errors        |
| `lowdefy_screenshot_page`| PNG screenshot of a rendered page (headless Chromium) for visual verification |
| `lowdefy_find_config`    | Which yaml file (and line) defines a given page, block, or request id    |
| `lowdefy_scaffold_page`  | Create a new page yaml file with a canonical minimal structure           |

## The feedback loop

The dev server rebuilds automatically when config changes, so an agent works in a tight loop:

1. Discover types and schemas, write or edit YAML.
2. Call `lowdefy_build_status` — did the build succeed? Errors come back with the exact source file and location.
3. Call `lowdefy_get_page_config` to confirm the page builds, and `lowdefy_screenshot_page` to see it rendered.
4. Runtime errors from the browser (operator errors, block render errors) also appear in `lowdefy_build_status`, so problems that only show at runtime still reach the agent.

## Setting up a project — one command

```bash
npx lowdefy agent-setup
```

This writes three files into your project (merging safely if they exist): `.mcp.json` registering the `lowdefy-docs` MCP server, `.claude/skills/lowdefy-config/SKILL.md` teaching Claude Code the workflow, and an `AGENTS.md` section for other coding agents. Use `--port` if your dev server doesn't run on 3000.

## Using it with Claude Code manually

Add the MCP server to your project so Claude Code can use it. In your project directory run:

```bash
claude mcp add --transport http lowdefy-docs http://localhost:3000/lowdefy-docs/mcp
```

Or commit a `.mcp.json` file at your project root so the whole team gets it:

```json
{
  "mcpServers": {
    "lowdefy-docs": {
      "type": "http",
      "url": "http://localhost:3000/lowdefy-docs/mcp"
    }
  }
}
```

If your dev server runs on a different port, adjust the URL. The MCP server includes instructions that teach the agent the workflow (list types first, then fetch schemas and examples), so it works well without any extra prompting.

## Referencing it in a skill

For the best results, add a skill to your project that tells the agent to use the docs server whenever it writes Lowdefy config. Create `.claude/skills/lowdefy-config/SKILL.md`:

```markdown
---
name: lowdefy-config
description: Use when writing or editing Lowdefy YAML config — pages, blocks, operators, actions, connections, or requests. Looks up exact type names, schemas, and examples from the running dev server instead of guessing.
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
```

## Plain HTTP routes

Everything the MCP tools serve is also available as plain GET routes — useful for `curl`, scripts, or agents without MCP support:

| Route                       | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `GET /lowdefy-docs`                 | Overview and route index                                        |
| `GET /lowdefy-docs/{kind}`          | List all available types of a kind, e.g. `/lowdefy-docs/blocks`         |
| `GET /lowdefy-docs/plugins`         | Installed plugin packages and the types each provides           |
| `GET /lowdefy-docs/schema/{kind}/{type}` | JSON schema for a type, e.g. `/lowdefy-docs/schema/blocks/Button` |
| `GET /lowdefy-docs/examples/{type}` | Example YAML for a block type                                   |
| `GET /lowdefy-docs/content/{slug}`  | A docs page as markdown, e.g. `/lowdefy-docs/content/operators/_get`    |
| `GET /lowdefy-docs/search?q={query}`| Search the docs                                                 |
| `GET /lowdefy-docs/plugin-doc/{package}` | Markdown shipped inside a plugin package                   |
| `GET /lowdefy-docs/build-status`    | Current build errors/warnings + recent browser runtime errors   |
| `GET /lowdefy-docs/page-config/{pageId}` | Fully built page config, or its build errors               |
| `GET /lowdefy-docs/screenshot/{pageId}` | PNG screenshot of the rendered page                         |
| `GET /lowdefy-docs/find/{id}?pageId=` | Locate where a page/block/request id is defined               |

## Local plugins

Your project's own plugins (declared under `plugins:` in `lowdefy.yaml`) are included automatically:

- Types appear in `lowdefy_list_types` and `/lowdefy-docs/{kind}` listings.
- Block schemas are derived from each block's `meta`, and connection/request schemas from the `schema` property on your connection and request definitions.
- Ship a `gallery.yaml` or `examples.yaml` next to a block in your plugin's `dist/blocks/{BlockName}/` and it is served by `lowdefy_get_examples`.
- A `README.md` or `docs/*.md` files in your plugin package are served by `lowdefy_get_plugin_doc`.

## Docs for crawling agents

The docs site itself serves agent-friendly formats: every page as raw markdown at `https://docs.lowdefy.com/md/{section}/{slug}.md`, an [llms.txt](https://llmstxt.org) index at `https://docs.lowdefy.com/llms.txt`, and the full documentation as one file at `https://docs.lowdefy.com/llms-full.txt`. Generic browser tools like Playwright MCP and Chrome DevTools MCP also work well against a running Lowdefy app — blocks render stable DOM ids matching their `blockId`.
