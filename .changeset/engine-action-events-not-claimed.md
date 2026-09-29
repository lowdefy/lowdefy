---
'@lowdefy/engine': patch
---

Block events that are not copies of a DOM event bubbling through the page are no longer skipped when another block handled that DOM event:

- An event a block fires from inside another event's actions always runs. For example, a button's `onClick` with a `CallMethod` whose method changes a block's value used to lose that block's `onChange`, because the engine treated it as the same click bubbling up.
- Events blocks fire from effects that React runs in its scheduler's `message` events (for example two blocks fetching data on mount) never claim or skip each other.
- Events a block registers for its own machinery (such as a file upload's policy request or a table's row fetch) are never skipped.

The one-handler-per-DOM-event rule still applies to blocks the DOM event actually bubbles through.
