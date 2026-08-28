---
'@lowdefy/blocks-tiptap': patch
---

fix(blocks-tiptap): Mentions with object options serialise a real identifier in `data-id` instead of `[object Object]`. `TiptapMentionInput` now renders `data-id` from the option's scalar identity (`value`, `value._id`/`value.id`, or the option's own `_id`/`id`) — or omits it when there is none — and always writes the display label to `data-label`, so saved html round-trips with a readable mention.
