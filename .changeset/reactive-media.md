---
'@lowdefy/client': minor
'@lowdefy/engine': minor
'@lowdefy/operators': minor
'@lowdefy/operators-js': minor
---

feat: `_media` updates when the browser window is resized

Blocks that use `_media` now re-evaluate when the window is resized, so `_media` can drive responsive `visible` conditions and properties the way CSS breakpoints do. The page keeps one resize listener, shared with the `onResize` event, and waits until the resize settles (150ms) before doing any work. Only blocks that read a `media` value that changed are re-evaluated: a block that reads `_media: size` updates when the window crosses a breakpoint, not on every pixel of a resize, and blocks that do not use `_media` are never touched. Blocks reading `_media` are also no longer re-evaluated on every unrelated page update.

The `onResize` page event is now debounced by 150ms (was 200ms), and runs after `_media` blocks have been updated for the new size.

Fixes #799.
