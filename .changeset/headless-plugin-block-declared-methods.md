---
'@lowdefy/journey-headless': minor
'@lowdefy/block-utils': minor
'@lowdefy/build': minor
---

feat(journey-headless): A plugin block's meta can declare which of its methods run headless

A block from an app's own plugin can now say in its meta which of its methods only fire one of its own events: `headlessMethods: { run: 'onRun' }`. The build carries it into `plugins/blockMetas.json` (from a `types.js` `blockMetas` entry, `extractBlockTypes` or the `metas` module), and a headless journey runs a `CallMethod` with that method as the browser does: it fires the event, with the method's first argument as `_event`, and waits for its actions. A page that calls such a method from `onMount` now runs headless instead of being browser-only on open. A method the meta does not declare is still browser-only.
