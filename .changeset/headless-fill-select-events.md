---
'@lowdefy/client-core': minor
'@lowdefy/journey-headless': minor
---

fix(journey-headless): Headless fill and select fire the events a browser does

- A headless `fill` on a `Selector`, `MultipleSelector`, `TreeSelector` or `TreeMultipleSelector` types into its search box, as the browser runner does: the block fires `onSearch` with `{ value }` and keeps its value, so a `select` after it picks from the options its `onSearch` loaded. The step waits for a debounced `onSearch` and its requests. A click, `open`, `select` or `fill` elsewhere then closes the dropdown and clears the search in the order a browser does. With `showSearch: false` the fill fails, as in a browser, and `press: Enter` after such a fill is listed browser-only.
- A headless `fill` fires `onChange` with `{ value }`, so an `onChange` that reads `_event: value` runs.
- A headless `select` picks the option whose label shows the step's text: on the selectors that draw their labels as html, `<span class="dot"></span><span>No space</span>` is picked with `value: No space`. A label whose text `data-avatar`, `data-format` or `data-time` writes is listed browser-only.
