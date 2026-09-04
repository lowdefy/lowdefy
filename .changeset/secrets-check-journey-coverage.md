---
'@lowdefy/build': minor
'lowdefy': minor
'@lowdefy/node-utils': minor
'@lowdefy/errors': patch
'@lowdefy/docs': patch
---

feat: `lowdefy check` reports missing secrets; `lowdefy test --coverage` reports journey coverage

Every literal `_secret` name in the config is looked up in the environment (including the app's `.env`), and each missing name is warned with the `LOWDEFY_SECRET_*` variable to set and the config location; previously a missing production secret was silent, resolving to `null` on the server with no error. It is a check-only rule under the `secrets` slug; a `_secret` that declares a `default` is not reported, and a computed name is counted at `debug`.

The build writes `journeyCoverage.json`, listing every `(pageId, blockId, eventName)` the config declares plus each page's request ids, and `lowdefy test --coverage` prints the share the committed journeys exercise together with the uncovered triples ranked by page. The metric is static (coverage of declared config, not of real user interaction) and the command also writes `.lowdefy/test/journeyIndex.json`, a page-to-journeys map a pre-commit hook or CI step can use to run only the journeys touching the pages a change edited.
