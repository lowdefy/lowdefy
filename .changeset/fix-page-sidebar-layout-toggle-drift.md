---
'@lowdefy/blocks-antd': patch
---

Fix `PageSidebarLayout` toggle that could flip the sider in the wrong direction
when the parent's `openSiderState` drifted out of phase with `Sider`'s internal
`openState`. The layout now drives the sider via the explicit `_setSiderOpen`
setter rather than the stateless `_toggleSiderOpen`, so the intended target
state — and the matching `onOpen` / `onClose` event — always fires.
