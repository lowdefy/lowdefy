---
'@lowdefy/blocks-basic': minor
'@lowdefy/block-utils': minor
'@lowdefy/docs': minor
---

feat(blocks-basic): add the `ClickableHtml` block. It renders sanitised HTML like `Html`, and additionally fires `onClick` when an element carrying a `data-action` attribute inside the markup is clicked. The event object holds that element's `data-*` attributes with snake_case keys (`data-event-id` → `event_id`), so a single block of markup can carry many clickable targets without a block per button. `HtmlComponent` in `@lowdefy/block-utils` now accepts an `onClick` prop.
