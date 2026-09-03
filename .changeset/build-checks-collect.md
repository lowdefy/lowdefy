---
'@lowdefy/build': patch
'@lowdefy/block-utils': patch
---

fix(build): checks collect instead of aborting the page, and a suppressed check can no longer truncate it

A suppressed check (`~ignoreBuildChecks`) previously abandoned the page mid-build: the page id, requests, subscriptions and every block after the suppressed one were never built, and the half-built page was written with no error. Suppression is now decided at the check itself. A page with a bad block property, a misspelt event name and a bad `_event` path reports all three in one build instead of one per build cycle. Block `events:` that is not a map says so; array properties that contain an operator have their literal elements validated individually; the page `state:` contract covers `input-container` blocks; `dynamicEvents` blocks still get a typo error on a near miss of a declared event; `_js` lint no longer fails builds on typed arrays, `AbortSignal`, `queueMicrotask`, `performance`, `Function`, the error subclasses or server `atob`/`btoa`, and no longer warns about an unused `catch` binding; `_js` module references accept `.mjs` and a missing file names both the containing-file and config-root interpretations; block meta `styles` is a known key.
