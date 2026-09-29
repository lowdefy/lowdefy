---
'@lowdefy/engine': patch
---

A browser event now only skips the events of blocks it actually passed through. The innermost block on the event's path with actions for it handles it, and blocks further out on that path skip the same browser event unless the handling event sets `bubble: true`. Every other block event fired while the browser event is dispatched runs:

- Events of blocks the browser event did not pass through. For example, a table's `onChange` or `onSelectionChange` after a button next to it ran `CallMethod clearSelection` used to be dropped, because the table fired it from an effect that runs inside the click.
- Events of blocks inside the block that handled it. A table inside a clickable card now fires `onSelectionChange` for a checkbox click after the card's `onClick` ran.
- Events of a block an action called a method on, such as a button in a table's bulk action slot clearing the table's selection.
- Events a block registers for its own machinery, such as a file upload's policy request or a table's row fetch.
