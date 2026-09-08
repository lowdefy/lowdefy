# Agentic Coding Roadmap

How Lowdefy becomes exceptional to use with AI coding agents (Claude Code, Cursor, etc.). Based on codebase exploration and a 2025–2026 industry survey (Next.js devtools MCP, Vercel MCP, Laravel Boost, Svelte MCP, shadcn MCP, Expo MCP, Angular CLI MCP, llms.txt adoption, AGENTS.md/skills conventions).

## Why this matters

- Harness/tooling quality swings agent success rates 10–20 points on identical models (Artificial Analysis Coding Agent Index, 2026).
- Vercel's retro on Next.js agent tooling: the core failure mode was "agents can't see the build or the browser" — the fix that mattered was exposing live errors/state as MCP tools, not chat UIs.
- Laravel Boost's differentiator: docs scoped to the *installed* package versions. Lowdefy's `/lowdefy-docs` already does this structurally (it serves what's installed in *this* project, local plugins included).

## Shipped

- **Discovery + docs (PR #2250)**: `/lowdefy-docs` REST routes + `/lowdefy-docs/mcp` MCP endpoint on every `lowdefy dev` run — all installed types per kind, JSON schemas, block examples, markdown docs (`@lowdefy/docs-content`), plugin discovery incl. local plugins. Build artifacts: `plugins/availableTypes.json`, `plugins/connectionSchemas.json`, `plugins/requestSchemas.json`.

## Track 1 — Close the feedback loop (highest value)

Agent edits YAML → asks "what's broken" → gets structured errors with file locations → fixes → verifies.

- `build/buildStatus.json` written by the dev manager after every build attempt (`{ status, timestamp, errors[], warnings[] }` — locations already resolved by the build's error handling). Bridges the manager-process/Hono-process gap via the filesystem, like every other artifact.
- `lowdefy_build_status` MCP tool + `GET /lowdefy-docs/build-status`: current build errors/warnings + recent browser runtime errors (client errors were previously logged to terminal and dropped; now kept in a ring buffer in the Hono process).
- `lowdefy_get_page_config` + `GET /lowdefy-docs/page-config/:pageId`: fully built page config, or the structured JIT build errors for that page.
- `lowdefy_find_config` + `GET /lowdefy-docs/find/:id`: "where is X defined" — pages via `pageRegistry.json` `refPath`; blocks/requests/etc. via `keyMap.json` scan + `resolveConfigLocation` (`@lowdefy/errors`). Dev caveat: page content keys exist only after the page is JIT-built — pass `pageId` to trigger it.
- MCP `instructions` + overview teach the loop: *discover → write → build_status → fix → get_page_config*.

## Track 2 — Scaffolding + agent-ready projects

- `lowdefy agent-setup` CLI command: writes `.mcp.json` (→ `/lowdefy-docs/mcp`), `.claude/skills/lowdefy-config/SKILL.md`, and `AGENTS.md` (merge-safe if files exist). One command to make any project agent-ready.
- `lowdefy_scaffold_page` MCP tool: writes a canonical page yaml into the config dir (dev server owns the project; the watcher rebuild gives instant Track-1 feedback). Scaffolding-via-MCP is an open gap industry-wide (Angular has an open issue for it) — a place to lead.
- Later: scaffold connections/requests; auto-generate/refresh `AGENTS.md` from the running dev server (Next.js 16.3 pattern) so it never drifts from installed versions.

## Track 3 — Visual verification

- `lowdefy_screenshot_page` MCP tool + `GET /lowdefy-docs/screenshot/:pageId`: headless chromium (playwright-core) against the dev server's own origin, PNG back to the agent. Closes the "agent can't see the browser" gap for visual iteration.
- Document Chrome DevTools MCP / Playwright MCP as supported workflows — blocks render stable `id={blockId}` DOM, so generic browser MCP servers work out of the box.

## Track 4 — Docs reach

- docs.lowdefy.com serves every docs page as raw markdown at `/md/<section>/<slug>.md`, plus `/llms.txt` (llmstxt.org index) and `/llms-full.txt`. Generated in the docs build (`templates/generateLlmsTxt.js`) from `@lowdefy/docs-content`.
- Installable skill bundle at repo root (`skills/lowdefy-config/`) — version-matched with the framework (vercel-labs/skills convention).
- Later: framework-specific agent evals (measure which tools actually lift agent success), following Vercel's lead.

## Later / ideas

- Snippet-level validation tool (validate a YAML fragment against schema + semantic rules without a full build — Svelte MCP pattern; cheaper than the rebuild round-trip).
- Request dry-run: needs a `dryRun` contract in `@lowdefy/api`/connections; today only `@lowdefy/connection-test` is side-effect-free. Document TestConnection as the safe pipeline-test target in the interim.
- Let apps expose their own MCP tools from config (Nuxt MCP Toolkit pattern) — agent-callable app features, not just dev tooling.
- OAuth/allowlisting if the MCP endpoint is ever exposed beyond localhost (Vercel MCP safety norm). Currently dev-only/localhost.
