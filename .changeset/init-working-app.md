---
'lowdefy': minor
'@lowdefy/build': patch
'@lowdefy/docs': patch
---

feat(cli): `lowdefy init` generates a small but complete app

Instead of a single welcome page, `init` writes a `collections` contract, a MongoDB connection reading `MONGODB_URI` through `_secret`, `auth.dev.users`, a `ListPage` archetype page, a plain welcome page, an `Api` endpoint with a `payloadSchema`, a seed fixture, a browser journey, request tests, a README, and a `.env` pointing at a local MongoDB with a generated auth secret, so `lowdefy dev` and `lowdefy test` both have something real to run on a fresh project. `init` finishes by running `agent-setup` (skip it with `--no-agent-setup`), and never overwrites a file the project already has. The generated files ship as templates that are compiled by CI, so a broken starter app is a red build rather than a broken first `lowdefy dev`.
