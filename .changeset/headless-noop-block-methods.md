---
'@lowdefy/journey-headless': minor
'@lowdefy/block-utils': minor
'@lowdefy/build': minor
---

feat(journey-headless): A block's meta can declare a method a headless no-op

A plugin block's `headlessMethods` now takes `null` beside an event name: `headlessMethods: { merge: null }` declares a method that changes only what the block draws, sets no state and calls nothing. A headless `CallMethod` on it resolves with `undefined` at once and the journey goes on, where before it made the journey browser-only. As with an event name, it runs only once the browser would render the block. An `expect: { text }` on that block still needs the browser.

The build now checks `headlessMethods` as it writes `plugins/blockMetas.json`: a value that is neither an event name nor `null` fails the build, naming the block type and the method. `@lowdefy/block-utils` exports the check as `checkHeadlessMethods`, which the headless runner uses too.
