---
'@lowdefy/block-utils': minor
'@lowdefy/blocks-antd-x': minor
'@lowdefy/blocks-echarts': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
---

Heavy blocks load their code when they first mount.

- `createLazyBlock` in `@lowdefy/block-utils` lets any plugin block load its implementation on first mount. A hidden block, or one in a closed panel, unopened tab or modal, never downloads it. The block's methods (declared in `meta.methods`) can be called from mount: calls made before the code arrives run in order once it loads, or fail with the usual error. Implementation modules are named `*.lazy.js`, and the production server prefetches them at low priority.
- `AgentChat` is lazy. Its drawer launcher paints immediately, and a click before load opens the drawer when the chat arrives. Mermaid diagrams, code highlighting and LaTeX load only when a message uses them. `setInput` is now listed in the block's methods, and `renderLatex` works in the browser build.
- `EChart` loads the charting library inside its own sized box, so pages paint without it and the layout does not move.
- `HtmlComponent` no longer re-sanitizes and re-renders HTML that has not changed.

No config changes.
