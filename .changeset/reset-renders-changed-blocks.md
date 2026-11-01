---
'@lowdefy/engine': patch
---

perf(engine): SetState re-renders only the blocks whose output changed

Every SetState resets the page's blocks from state, and the reset marked every block for render, so each SetState re-rendered the whole page. The pass that follows a reset already evaluates every block whose value, validation or reads changed, and marks it when its output differs, so the reset no longer marks blocks itself. On a page of about 330 blocks this cut the main-thread time of a toggle by more than half.
