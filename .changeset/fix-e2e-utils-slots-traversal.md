---
'@lowdefy/e2e-utils': patch
---

fix: `extractBlockMap` now traverses `slots.<name>.blocks`.

Compiled page artifacts under `.lowdefy/server/build/pages/<pageId>.json` use the `slots` shape:

```json
{
  "blockId": "home", "type": "Box",
  "slots": { "content": { "blocks": { "~arr": [{ "blockId": "welcome_card", "type": "Card" }] } } }
}
```

`extractBlockMap` previously only walked `obj.areas[*].blocks` and `obj.blocks`, so `generateManifest` ended up with a `blockMap` containing only the page root. `ldf.block('<any-nested-id>')` then threw `Block "<id>" not found on page. Available blocks: <pageId>` for every non-root block, reducing the e2e framework to root-block assertions and raw `ldf.page.locator(...)` fallbacks. `slots` is now traversed alongside `areas` and `blocks`, so nested blocks are picked up regardless of which container shape the build produced.
