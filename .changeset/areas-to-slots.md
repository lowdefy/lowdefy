---
'@lowdefy/build': major
'@lowdefy/engine': major
'@lowdefy/client': major
'@lowdefy/layout': major
'@lowdefy/block-dev': major
'@lowdefy/e2e-utils': major
---

Rename `areas` to `slots` throughout the framework.

### Breaking Changes

- **`areas` renamed to `slots`**: All block area definitions use `slots` instead of `areas`. The build pipeline auto-migrates `areas` to `slots` with a deprecation warning in dev mode (error in production).
- **Engine internals**: `Areas.js` renamed to `Slots.js`. Block instances expose `.slots` instead of `.areas`.
- **Layout internals**: `layoutParamsToArea` renamed to `layoutParamsToSlot`.
- **Custom blocks**: Blocks that render child areas must use `content.slotName()` — the API is unchanged but the terminology in config and docs is now `slots`.
