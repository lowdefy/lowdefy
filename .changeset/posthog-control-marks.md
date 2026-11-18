---
'@lowdefy/plugin-posthog': minor
'@lowdefy/engine': minor
'@lowdefy/helpers': minor
'lowdefy': minor
---

feat(plugin-posthog): Production clicks keep a control's block and key

Click masking now keeps two more element attributes: `data-lf-block` and `data-lf-control`, which Lowdefy puts on a block's own controls (a modal's OK button, a menu item, a grid cell button). They hold the block id and the control's key, such as `deleteModal` and `ok`. A menu item's key is its link `id`, so build link ids from config, not from data. `data-lf-row-key` is still removed, because a row key can be a record's id. An autocaptured click on such a control also sends `lowdefy_control`, the control's key, and no `lowdefy_text`. `lowdefy journeys pull posthog` reads it, so a production click on a control compiles to the same `{ blockId, control }` step a dev recording does, and a journey that clicks it covers that production use. A cell control keeps its displayed `row`. `targetFromElementsChain`'s `marks` option is replaced by `rowKey: false`, which reads control marks and leaves out `row_key`.
