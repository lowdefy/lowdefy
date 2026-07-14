---
'@lowdefy/server-dev': minor
---

feat: Cmd/Ctrl+click any element to open its yaml in VS Code

Hold Cmd (macOS) or Ctrl (Windows/Linux) and click any element in the running dev app to open the yaml file that defines its block in VS Code, at the exact line. While the modifier is held, the hovered block shows a blue highlight with its blockId and the cursor becomes a pointer, so you see exactly what a click will open. Blocks generated at runtime (list items, dynamic content) resolve to their nearest configured ancestor, and blocks defined in modules open the module file that defines them. Plain clicks, and Cmd/Ctrl+clicks outside any block, keep their normal behaviour. Dev server only.
