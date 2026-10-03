---
'lowdefy': minor
'@lowdefy/node-utils': minor
'@lowdefy/helpers': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat: `lowdefy journeys compile` turns recorded interaction traces into candidate journeys under `tests/journeys/_candidates/`.

A recorded trace is a JSONL file of interactions (a click, a change, a key press, on which block) joined to what the app did in response, in one record format (version 1) shared by every recorder. `lowdefy journeys compile <traceFiles...>` cuts each browser tab's recording into segments, groups segments that do the same thing step by step, ranks them by how often they happened and how often they failed, and writes one candidate journey per group to `tests/journeys/_candidates/<source>/<pageId>-<hash>.yaml`. `lowdefy test` does not run that directory; move a candidate into `tests/journeys/` to promote it. Compiling again refreshes only the origin comment of a candidate that already exists, so names and filled values survive. Options: `--source`, `--since`, `--from`/`--to` (production), `--build <id|current>`, `--page` and `--out`.

Values typed in production never reach a candidate: production records cannot carry them, and production button or row labels are kept only when at least 5 different people clicked them.

`@lowdefy/node-utils` exports the compiler (`compileTrace`, `parseTraceLines`), the record validator (`validateTraceRecord`) and the journey identity functions (`journeySequence`, `stepIdentity`). `@lowdefy/helpers` exports `pairTraceEvents`, the rule that decides which DOM interaction caused which engine event, and `isMountEventName`. The dev server's `GET /lowdefy-docs/build-status` reports a top-level `buildId`, the build it serves now.
