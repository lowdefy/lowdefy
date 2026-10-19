---
'@lowdefy/build': patch
'@lowdefy/block-utils': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-antd-x': patch
'@lowdefy/blocks-files': patch
'@lowdefy/blocks-tiptap': patch
---

fix: A page's own plugin chunk now includes the types the page runs without naming them in its config.

With per-page plugin chunks, two kinds of type were missing when a page was loaded directly (they only worked once another page had loaded them):

- The operators the `_js` accessors call. A `_js` function that read `state('name')` on a page with no `_state` operator of its own failed with `_js function execution error. TypeError: ... _state is not a function`.
- The actions and operators of events a block registers itself. `Download`, `Upload`, `UploadDragger`, `UploadPhoto`, `TiptapInput` and `TiptapMentionInput` run a `Request` action, `AgentChat` runs `Request` and `SetState` with `_event`, and `PageHeaderMenu`, `PageSiderMenu` and `PageSidebarLayout` run `SetLocale` with `_event`. On a page without those actions in its config they failed with `Invalid action type "Request"`.

Blocks now list these types in `meta.actions` and `meta.operators`, and the build adds them, and the `_js` accessor operators, to every page that uses the block or `_js`. Plugin blocks that register their own events should do the same.
