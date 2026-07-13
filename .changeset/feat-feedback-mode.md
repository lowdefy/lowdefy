---
'@lowdefy/server-dev': minor
'lowdefy': patch
---

feat: Annotation helper — point, draw, copy, and paste feedback to your agent

Press **Cmd+/** (macOS) / **Ctrl+/** (Windows/Linux) on any page of your running dev app: an overlay appears where you hover-highlight blocks, click to select, draw rectangles/arrows/freehand, comment, and batch several annotations. No browser extension — it's injected by the dev server.

Hitting **Copy** puts an agent-readable feedback block on your clipboard, **each annotation enriched with the blockId and the exact yaml file and line that defines it**, plus drawn geometry and, by default, **an annotated PNG screenshot of the page with your drawings on it** (saved under `.lowdefy/annotations/`, path included in the block — untick "Include annotated screenshot" to skip). Paste it into whichever agent session you want. Press Enter to drive the primary action (save annotation, then copy).

Also:

- `lowdefy_screenshot_page` gains `clip` + `scrollX`/`scrollY` params to capture exactly an annotated region.
- New reserved dev route prefix: `/lowdefy-feedback` (the overlay's enrichment endpoint).
- The generated AGENTS.md and Claude Code skill (`lowdefy agent-setup`) teach agents to recognize pasted feedback blocks.
