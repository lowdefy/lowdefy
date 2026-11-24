---
'@lowdefy/journey-headless': patch
---

fix(journey-headless): Headless steps that text checks used to keep in the browser

Once `expect: { text }` ran headless, some journeys reached steps a headless run got wrong. Each now runs headless as a browser does, or goes browser-only at that step, naming why.

- A `fill` on a `NumberInput` reads the typed text as a number, as antd's InputNumber does: `'120000'` sets `120000`, not `null`. It strips grouping characters, reads `decimalSeparator`, and changes nothing for text that is no number, a number outside `min` and `max`, or the number the input holds. `press: Enter`, or a step that moves the focus off the input, goes browser-only when a browser would clamp the number into range or round it to `precision` there. A `parser`, or an app with `i18n` and no `decimalSeparator`, sends text other than digits and signs to the browser.
- A `fill` or `select` on a `Selector`, `MultipleSelector`, `TreeSelector` or `TreeMultipleSelector` with `onOpenChange` actions goes browser-only, since a headless run fires no `onOpenChange`. An `onOpenChange` declared with no actions doesn't count.
- While the page shows a `Selector`, `MultipleSelector` or `DateSelector` with `autoOpen` and `onOpenChange` actions, the next `click`, `open`, `fill`, `select` or `press` goes browser-only: in a browser it closes those options or acts in them.
- A `fill` on a block that is not an input, such as a `Table` with a search box, goes browser-only, where it was refused: a browser types into the first text input the block draws.
- An `expect: { state }` or `wait: { state }` whose path reads a `Table`'s value goes browser-only: the table writes its view and selection there in a browser.
