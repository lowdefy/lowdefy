---
'@lowdefy/node-utils': minor
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat: recorded journeys compile into candidate tests

`lowdefy journeys compile <trace.jsonl>` turns recorded production journey events into candidate journeys under `tests/journeys/_candidates/`: clicks, input changes, key presses and navigations become steps, the state each event wrote becomes expectations, and sessions that drove the same sequence become one candidate carrying how often it happened and how often it broke. `lowdefy test` ignores that directory; promotion is moving the file and running `lowdefy test --update`. A rerun rewrites only a known candidate's origin block, so edits survive. `lowdefy journeys coverage <trace.jsonl>` reports the share of the (page, block, event) triples users actually drove that a committed journey exercises, and lists the uncovered ones most-used first. The dev MCP tool `lowdefy_prod_repro` returns a compiled journey that ends at the failure instead of raw events.
