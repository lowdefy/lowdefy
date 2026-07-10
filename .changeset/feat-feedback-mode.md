---
'@lowdefy/server-dev': minor
'lowdefy': minor
---

feat: Feedback Mode — draw on your app, it lands in Claude Code

Press **Cmd+L** (macOS) / **Ctrl+L** (Windows/Linux) on any page of your running dev app: an overlay appears where you hover-highlight blocks, click to select, draw rectangles/arrows/freehand, comment, batch several annotations, and send. No browser extension — it's injected by the dev server.

**Each annotation reaches your Claude Code session enriched with the blockId and the exact yaml file and line that defines it**, plus drawn geometry (usable as a screenshot crop), viewport/scroll info, and recent console errors.

**How feedback reaches the agent (`@lowdefy/server-dev`)**

- `lowdefy_wait_for_feedback` MCP tool: the agent blocks (up to 55s) until you send — "let me show you" workflows.
- `lowdefy_get_feedback`: instant check.
- **Stop hook**: idle Claude Code sessions wake automatically when you send feedback — alt-tab to the browser, draw, and the terminal picks it up. Installed by `lowdefy agent-setup` (fail-open: never blocks your session when the dev server is down).
- `lowdefy_screenshot_page` gains `clip` + `scrollX`/`scrollY` params to capture exactly the annotated region.
- New reserved dev route prefix: `/lowdefy-feedback`.

**CLI (`lowdefy`)**

- `lowdefy agent-setup` now also installs the Stop hook (`.claude/hooks/lowdefy-feedback-stop.mjs` + merge-safe `.claude/settings.json` wiring) and documents Feedback Mode in the generated AGENTS.md and skill.
