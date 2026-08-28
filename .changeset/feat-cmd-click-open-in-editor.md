---
'@lowdefy/server-dev': minor
---

feat: Option/Alt+click any element to open its yaml in VS Code

Hold Option (macOS) or Alt (Windows/Linux) and click any element in the running dev app to open the yaml file that defines its block in VS Code, at the exact line. While the modifier is held, the hovered block shows a blue highlight with its blockId and the cursor becomes a pointer, so you see exactly what a click will open. Blocks generated at runtime (list items, dynamic content) resolve to their nearest configured ancestor, and blocks defined in modules open the module file that defines them. Plain clicks, Option/Alt+clicks outside any block, and Cmd/Ctrl+clicks (the browser's open-in-new-tab) keep their normal behaviour. Dev server only.
