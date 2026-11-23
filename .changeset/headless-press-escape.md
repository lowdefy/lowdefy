---
'@lowdefy/journey-headless': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': patch
---

feat(journey-headless): Headless Escape closes the overlay that opened last

- `press: Escape` runs headless. It closes what a browser's Escape closes: an open dropdown, a selector's search or a `ClickableHtml` confirm when no `Modal` or `Drawer` is open or it sits in the newest one, else the newest `Modal` (`onCancel`, then the close) or `Drawer` (`onClose`, then the close). `keyboard: false` leaves a Modal or Drawer open, as does an `onCancel` or `onClose` that fails.
- A `DropdownButton` or `DropdownMenu` fires `onOpenChange` with `{ open: false }`. A `Selector`, `TreeSelector` or `TreeMultipleSelector` clears its search with `onSearch` `{ value: '' }`; a `MultipleSelector` keeps its search. A confirm drops its event.
- Escape goes to the browser at run time, naming why, when nothing is open, two dropdowns are open, a dropdown is open beside a popup, a block binds `Escape` as an event or item shortcut, the pointer rests on a block that can show a tooltip or popover over what Escape would close, a Modal or Drawer has `forceRender`, the newest overlay is a `ConfirmModal`, or the focus is in an input that handles Escape itself (a `TextInput` or `NumberInput` with `onEscape`, a date picker, an inline edit).
- `classifyJourney` no longer lists `press: Escape` as needing a browser.
- The browser journey runner waits for overlays to finish opening or closing before it presses Escape, so an Escape straight after a close no longer reaches the closing overlay a second time.
