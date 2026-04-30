---
'@lowdefy/client': patch
---

fix(client): Forward `style` prop to all Link variants.

`createLinkComponent` previously destructured every prop except `style`, so any `<Link style={...}>` passed by a block was silently dropped. Inline style overrides only worked via `className` + CSS. All four link variants (`backLink`, `newOriginLink`, `sameOriginLink` — both newTab and same-origin branches — and `noLink`) now thread `style` through to the rendered `<a>` (or `<span>` for `noLink`).

Surfaces fixes in three places that were already passing `style` and silently broken: `headerActions.js` notifications/profile/dark-mode rows had `color: 'inherit'` that didn't reach the `<a>` (label rendered as antd link blue); `Anchor.js` disabled state set `color: '#BEBEBE'` that never applied; `buildMenuItems.js` per-link `style:` config was discarded.
