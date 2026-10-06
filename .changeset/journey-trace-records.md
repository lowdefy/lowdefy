---
'@lowdefy/node-utils': minor
'@lowdefy/helpers': minor
'@lowdefy/server-dev': minor
---

feat: One recorded trace format, and the functions that read it

A recorded trace is a JSONL file of interactions (a click, a change, a key press, on which block) joined to what the app did in response, in one record format (version 1) shared by every recorder.

`@lowdefy/node-utils` exports the record reader (`parseTraceLines`), the record validator (`validateTraceRecord`), `compileSegments`, which cuts records into the segments and sequences that journey evidence and coverage read, and the journey identity functions (`journeySequence`, `stepIdentity`). `@lowdefy/helpers` exports `pairTraceEvents`, the rule that decides which DOM interaction caused which engine event, and `isMountEventName`. The dev server's `GET /lowdefy-docs/build-status` reports a top-level `buildId`, the build it serves now.
