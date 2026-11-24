---
'@lowdefy/journey-headless': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': patch
'lowdefy': patch
---

feat(journey-headless): Headless text and containing targets inside ClickableHtml

- A `click`, `expect.visible` or `expect.hidden` by `text` or `containing` (with `nth`) runs headless when what it names is in a `ClickableHtml` block's html, its open popover or its open confirm. `text` matches an interactive control whose whole text is the text, as Playwright's exact match does; `containing` matches the innermost element whose text holds it, ignoring case, as the browser runner does.
- One match, or the `nth`, fires its `data-event` with its `data-*` event object, opens its confirm, or opens or closes its popover. Several matches with no `nth` fail, naming them.
- The step goes to the browser at run time, naming why, when no `ClickableHtml` shows the text, another block may show it too (any block with no text model counts), a block around the `ClickableHtml` may answer the click too, the match sits behind an open popup's mask, or the answer depends on layout, on text an html enhancer writes, on a link, or on the confirm's labels in an app with i18n locales.
- `classifyJourney` no longer lists these steps as needing a browser; `fill`, `select` and `open` by text, `row`, and `nth` on its own still do.
- Lint L8 keeps recommending the `control` (or `blockId`) target for such a step, which holds when the text changes. A headless run on the dev server records the control a text click landed on, which L8 reads.
- While a `ClickableHtml` popover or confirm is open, a headless click on anything but it, or the element that opened it, now goes to the browser, for `control` targets too: antd draws the overlay beside its target, where it may cover what the click aims at. Before, a headless run closed the confirm as a click outside would.
- A headless run reads the content of a closed `<details>` in a `ClickableHtml` as hidden.
