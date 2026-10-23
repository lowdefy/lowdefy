---
'@lowdefy/connection-mongodb': minor
---

feat(connection-mongodb): MongoDBEnrichmentEnqueue dry run counts a run before it starts

An app that pays a data provider per enrichment cell had no way to learn how many cells a run would queue without queueing them, so it could not show what a run would cost and ask first. `MongoDBEnrichmentEnqueue` now takes `dryRun: true`: it reads and plans exactly as a run does and returns `{ dryRun: true, queued, missingInputs, skipped, byColumn }`, writing nothing. Over `maxCells` it throws as a run would. A run's response gains the same `byColumn`, each column's queued and missing input counts, so an app can price each column with its own provider cost and compare the estimate with what ran.
