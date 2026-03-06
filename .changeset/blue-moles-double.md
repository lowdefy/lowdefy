---
"@lowdefy/build": patch
---

fix(build): Eliminate false positive warnings for _state references set by SetState actions

The validateStateReferences validator now recognizes state keys initialized by SetState actions in page or block events, eliminating false positive warnings when _state references legitimate state that's set programmatically rather than from input blocks.
