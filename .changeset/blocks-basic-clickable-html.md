---
'@lowdefy/blocks-basic': minor
'@lowdefy/block-utils': minor
'@lowdefy/docs': minor
---

feat(blocks-basic): add the `ClickableHtml` block. It renders sanitised HTML like `Html`, and additionally fires a named event when an element carrying a `data-event` attribute inside the markup is clicked: `data-event="onEditClick"` fires the block's `onEditClick` event, so a single block of markup can carry many clickable targets, each with its own action chain, without a block per button. The event object holds the element's other `data-*` attributes with snake_case keys (`data-record-id` → `record_id`). `HtmlComponent` in `@lowdefy/block-utils` now accepts an `onClick` prop.
