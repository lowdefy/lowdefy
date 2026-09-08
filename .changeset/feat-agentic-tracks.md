---
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
'lowdefy': minor
'@lowdefy/docs-content': patch
---

feat: Agent feedback loop, scaffolding, screenshots, and llms.txt

Building on the dev server docs/MCP endpoint, agents now get a full edit-verify loop and one-command project setup.

**Feedback loop (`@lowdefy/server-dev`, `@lowdefy/build`)**

- The dev build now persists its result to `build/buildStatus.json`, and `GET /lowdefy-docs/build-status` (or the `lowdefy_build_status` MCP tool) returns the current build errors and warnings — with source file and line — plus recent browser runtime errors. Edit config, ask what broke, fix it.
- `GET /lowdefy-docs/page-config/{pageId}` / `lowdefy_get_page_config`: the fully built page config, or its structured build errors.
- `GET /lowdefy-docs/find/{id}` / `lowdefy_find_config`: which yaml file (and line) defines a page, block, or request id.

**Visual verification (`@lowdefy/server-dev`)**

- `GET /lowdefy-docs/screenshot/{pageId}` / `lowdefy_screenshot_page`: PNG of the rendered page via headless Chromium (playwright-core), so agents can see what they built.

**Scaffolding (`@lowdefy/server-dev`, `lowdefy` CLI)**

- `lowdefy_scaffold_page` MCP tool creates a canonical new page file.
- New `lowdefy agent-setup` CLI command writes `.mcp.json`, a Claude Code skill, and an `AGENTS.md` section into your project (merge-safe).

**Docs reach**

- docs.lowdefy.com now serves every docs page as raw markdown at `/md/{section}/{slug}.md`, plus `llms.txt` and `llms-full.txt` for AI crawlers.
