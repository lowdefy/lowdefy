---
'@lowdefy/blocks-aggrid': patch
---

fix(blocks-aggrid): Safari loading overlay stuck.

`AgGrid` and `AgGridInput` no longer use ag-grid's internal `showLoadingOverlay` / `hideOverlay` API to reflect the block's `loading` prop. On Safari / WebKit, a microtask race between our `hideOverlay()` call and ag-grid's own late `showOverlay` tick left the "Loading…" box stuck on screen even after data had rendered (ag-grid issues #4421, #1665, #8358). Chromium happened to win the race the other way, which hid the symptom.

Both blocks now wrap `AgGridReact` in a `position: relative` div, set `suppressLoadingOverlay` on the grid, and render a small themed overlay component (`LoadingOverlay.js`) when the Lowdefy `loading` prop is `true`. The overlay is styled via antd CSS custom properties, so it follows the active theme.
