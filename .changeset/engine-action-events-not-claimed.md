---
'@lowdefy/engine': patch
---

An event a block fires from inside another event's actions is no longer skipped as part of the DOM event that started them. For example, a button's `onClick` with a `CallMethod` whose method changes a block's value used to lose that block's `onChange`, because the engine treated it as the same click bubbling up. Events fired by actions now always run; the one-handler-per-DOM-event rule still applies to blocks the DOM event actually bubbles through.
