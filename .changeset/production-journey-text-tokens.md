---
'lowdefy': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
'@lowdefy/build': patch
---

feat(cli): Production journeys never store clicked text. `lowdefy journeys pull posthog` now writes each clicked element's text as a salted token (`target.text_token`), never the text, so `.lowdefy/traces/production/` holds no production text. `journeys compile`, `journeys coverage` and `journeys evidence` turn a token back into text only when it is text from the app's config: the built pages, menus, i18n messages, block plugins' default messages and antd's locale strings, collected with one full build by the installed dev server and cached until the config changes. The 5-person text threshold is removed: a click whose text is not config text (a customer's name in a grid cell, a label built from values) compiles to its block, row and column without text, with a comment naming its token and a `tokenised-text` flag, and candidates and `coverage.json` list per block the clicks, distinct tokens and most-clicked tokens.

Evidence and coverage read a journey's click text only when it is config text, so a journey clicking a grid cell by a data value is backed exactly as one with no text. Pull, compile and coverage refuse a mining window longer than 30 days; `journeys evidence` is not capped. Only the pull creates the trace salt; compile, coverage and evidence treat a day pulled under another salt as missing and name the pull that fetches it again. The `journeys-from-production` skill now has the coding agent pick the window, read each recorded routine with the app's config and code, and decide which routines deserve a journey, and it never reads production text, credentials or snapshots or queries PostHog directly.

Upgrading: the first pull or production read deletes day files pulled under the old rule, `tests/journeys/_candidates/production/` and `.lowdefy/test/coverage.json`; the next pull, compile and coverage write them again. Committed journeys are not changed, so check any journeys you promoted from production for text that came from your data rather than your config.
