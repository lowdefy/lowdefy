---
'@lowdefy/engine': minor
'@lowdefy/helpers': minor
'@lowdefy/e2e-utils': minor
'@lowdefy/node-utils': minor
'lowdefy': patch
---

feat(journeys): The recorder writes `rowKey` and `control` targets

A recorded click on a marked control (a modal's OK button, a dropdown or menu item, a grid cell button) is now a `{ blockId, control }` click step, with `rowKey` for a cell control, so it runs headless. A click in a grid row with its own key is a `{ blockId, rowKey }` step in place of `row`; a row with only a generated key (`__row_<n>`) keeps `row`. `describeElement` and `targetFromElementsChain` add `row_key` and `control` to the targets they describe, the trace record and the session log carry them, and `resolveTargetInDocument` resolves them as the browser runner does. PostHog event properties and the production pull read the chain with `targetFromElementsChain(chain, { rowKey: false })`: a marked control describes as its block's control, with its displayed `row` in a grid and no row key.
