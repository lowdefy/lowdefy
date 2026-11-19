---
'@lowdefy/node-utils': minor
'@lowdefy/helpers': minor
---

feat(journeys): `rowKey` and `control` target keys in the journey grammar

A journey names a grid row by its key, `{ blockId, rowKey }` (optionally with `column` or `control`), and a control a block draws by its key, `{ blockId, control }` (a modal's `ok`, a menu item). Both need `blockId`. `click` takes them, `expect.visible`, `expect.hidden` and `expect.text` take `rowKey`, and `fill`, `select` and `open` refuse them, naming the browser form. `classifyJourney` counts these targets and `open` as headless, and the reasons for `row` and `text` targets name the replacement. `journeyTargetSelectors` gains the control marks and selector, a row-by-key part in each grid rule, the generated row key test and the dropdown trigger selector.
