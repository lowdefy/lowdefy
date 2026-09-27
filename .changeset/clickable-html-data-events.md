---
'@lowdefy/blocks-basic': major
'@lowdefy/block-utils': major
'@lowdefy/codemods': minor
'@lowdefy/docs': minor
'lowdefy': patch
'@lowdefy/docs-content': patch
'@lowdefy/server-dev': patch
---

feat(blocks-basic)!: `ClickableHtml` fires only the events its `dataEvents` property lists.

**Breaking:** a `data-event` in a `ClickableHtml` block's HTML now fires its event only when the
block's new `dataEvents` property lists that event. A block without `dataEvents` fires no events
from its HTML, and a click on an unlisted `data-event` does nothing and logs a console warning.
Until now any `data-event` in the HTML fired the block event it named. HTML is often built from
request or user data, and sanitising keeps `data-*` attributes, so the block now has the author
say which events its HTML may fire.

```yaml
- id: rows
  type: ClickableHtml
  properties:
    dataEvents:
      - onEdit
      - name: onDelete
        confirm: Delete this row?
    html: ...
```

An entry is an event name, or `{ name, confirm }`. With `confirm`, every click on the event asks
first whatever the markup says: `confirm: true` uses the element's `data-confirm` message or "Are
you sure?", and a string is the message. Any `confirm` other than `false` asks, so an empty or
missing message still asks, with the default message. Unlisted targets are no longer made keyboard
focusable.

To migrate, run `lowdefy upgrade`: the `clickable-html-data-events` codemod adds `dataEvents` to
each `ClickableHtml` block and reports HTML built from data that inserts values without escaping
them. `ClickableHtml` blocks that `Dynamic` content builds at page load, from config stored outside
the app's files, need `dataEvents` added where that config lives. The docs now state that HTML
built from user or request data must escape that data.

`HtmlComponent` in `@lowdefy/block-utils` takes the list as its `dataEvents` prop, next to
`onDataEvent`, and applies it inside popover content too.
