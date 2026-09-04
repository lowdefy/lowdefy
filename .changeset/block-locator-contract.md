---
'@lowdefy/e2e-utils': patch
'@lowdefy/server-dev': patch
'@lowdefy/blocks-algolia': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-basic': patch
'@lowdefy/blocks-color-selectors': patch
'@lowdefy/blocks-diff': patch
'@lowdefy/blocks-echarts': patch
'@lowdefy/blocks-google-maps': patch
'@lowdefy/blocks-loaders': patch
'@lowdefy/docs': patch
---

E2E tests and journeys now address a block by the element the block itself renders. `getBlock` resolves `[data-testid="<blockId>"]`, the block root every block carries, and falls back to the `#bl-<blockId>` layout wrapper only for the blocks that render no root of their own (`Icon`, `Throw`, `GoogleMapsScript`) or that render it into a portal. `expect: { dom: { blockId, hasClass } }` and the attribute form in a journey therefore read the block's own classes and attributes, including the `class:` and `style:` set on it in config, instead of the layout wrapper's. Every block e2e helper follows the same resolution. Golden snapshots need one `lowdefy snapshot --update` after upgrading: `dom.html` gains `id` and `data-testid` on each block root.
