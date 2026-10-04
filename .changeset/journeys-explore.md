---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/node-utils': minor
'@lowdefy/ai-utils': minor
---

`lowdefy journeys explore --pr <n>` (or `--against <ref>`) finds the pages a pull request changed by comparing full config builds of its base and head. It walks each changed page as each role on a journey data set, with an AI Gateway model or a seeded policy choosing each step from generated options. Fixed checks report browser errors, server errors, failed requests, dead clicks and refused roles, each confirmed by a replay. The walks become candidate journeys under `tests/journeys/_candidates/explorer/`. Runs are capped by `--budget` and `--max-cost`. `@lowdefy/ai-utils` exports `decide()` for typed decisions outside a request. `lowdefy agent-setup` installs a `journeys-from-pr` skill.
