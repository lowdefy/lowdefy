---
'@lowdefy/build': minor
---

Add an app-level `overlay` config to render blocks on every page.

The new top-level `overlay` config prepends a list of blocks to every page, so app-wide UI (a floating support button, a banner, a developer-tools panel) no longer has to be added to each page individually. Set `blocks` for what to inject, `exclude` to skip specific pages, and `devOnly: true` to inject only under `lowdefy dev` (left out of production builds). A page can opt out with `properties.overlay: false`. The overlay is applied in both production builds and the development server.
