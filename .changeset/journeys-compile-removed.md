---
'lowdefy': minor
'@lowdefy/node-utils': minor
---

feat(cli): `lowdefy journeys compile` and `lowdefy journeys recordings` are removed

Journeys are written by the coding agent from readable session logs and proven with `lowdefy test --repeat`, so no command compiles recorded traces into candidate journey files any more. Read a dev session with `lowdefy journeys session <id>` (or the `lowdefy_journey_session` tool) instead of compiling it, and list sessions with `lowdefy journeys session` instead of `journeys recordings`. `journeys evidence --refresh` no longer counts dev recordings into `evidence.dev`. Coverage, evidence and usage read production exactly as before.

In `@lowdefy/node-utils`, `compileSegments` gives the segments and sequences evidence and coverage read, and candidate origin merging is gone.
