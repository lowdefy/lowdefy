---
'lowdefy': minor
'@lowdefy/node-utils': minor
'@lowdefy/docs': patch
---

feat: `lowdefy journeys pull posthog` brings production analytics into local journey traces; `journeys evidence` and `journeys coverage` report how much real use backs each journey and what no journey covers yet.

- `lowdefy journeys pull posthog [--since 30d | --from --to]` reads the app's PostHog project over the HogQL query API with your own personal API key (`POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST`, `POSTHOG_PERSONAL_API_KEY` with the Query Read scope) and writes one day of interaction traces per file to `.lowdefy/traces/production/`. Final days are fetched once, today and yesterday again on every run, and files older than 400 days are removed. Person and organisation ids are hashed with a salt that never leaves your machine; typed values, URL query values and element chains are never stored. Options: `--environment`, `--include-test-accounts`, `--org-property`, `--roles-property`, `--page-size`, `--max-rows` and `--refetch`.
- `lowdefy journeys evidence [--refresh]` counts, for each journey in `tests/journeys/`, the production sessions that did what it does, with people, organisations, share and failures. `--refresh` writes them into the journey's new `evidence` key and changes nothing else in the file, and a hardening run's `.lowdefy/test/mutation.json` adds `evidence.mutation`. Journeys nothing backs are listed beside their mutation numbers and never removed.
- `lowdefy journeys coverage --source production [--json]` reports interaction, flow, failure, frustration and role coverage, each with what is uncovered ranked by use, and writes them with a production profile to `.lowdefy/test/coverage.json`.
- With a recorded full test run, `journeys coverage` reports the interaction share that run drove beside the static one, and counts a failure as covered only when a journey that passed produced it (`failure.mode: measured`); without one it reports failures as reached. `lowdefy test` and `lowdefy_run_tests` keep which journeys passed in a recorded run in `.lowdefy/test/run.json`.
- `lowdefy agent-setup` installs a `journeys-from-production` skill that runs the loop with you: pull, coverage, then one uncovered failure or flow at a time into a journey proven by three runs, then an evidence refresh. It commits nothing and never deletes a journey.
- Journey files accept a strictly validated `evidence` key, and `lowdefy test` (and the `lowdefy_run_tests` MCP tool) print it after each passing journey: `412 sessions · 9 orgs · 11/12 mutants`.

`@lowdefy/node-utils` exports `isBackedBy`, the one rule for whether a recorded segment did what a journey does, `profileProduction`, `listFailurePaths` and `failurePathKey`. `compileSegments` segments also carry their entry page, pages, failure path and frustrated clicks.
