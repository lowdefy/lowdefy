---
'lowdefy': major
'@lowdefy/test-utils': minor
'@lowdefy/server-dev': patch
'@lowdefy/docs-content': patch
---

feat(cli): `lowdefy test` runs journeys headless by default; browser journeys only when asked

**Breaking (v8):** a plain `lowdefy test`, and `lowdefy_run_tests` with no mode, now run only the journeys that need no browser. A journey that needs a browser is listed `BROWSER-ONLY` and not run. CI that relied on a bare `lowdefy test` running browser journeys must pass `--thorough`.

- `--thorough` runs each journey headless when it can and in the browser when it can't, and runs a journey found to need a browser partway through in the browser too, from step 1. The mixed run without `--thorough` is gone.
- `--browser` is unchanged. `--headless` is the default spelled out and still accepted. `--build` no longer needs `--headless`; `--build` with `--thorough` or `--browser` is refused.
- After the summary, a run that left journeys browser-only names each with its file and the step that needs a browser, and prints `lowdefy test --thorough <files>` (on `lowdefy_run_tests`, the call with `thorough: true` and `paths`). The exit code stays 0.
- A journey `.lowdefy/test/headless-run.json` records as browser-only, for the same journey and build, is listed without being run up to its browser step again (`found by an earlier run, not run again`). `--thorough` sends it straight to the browser. On `--build` the record keys on the build's `buildId`, so each new `lowdefy build` runs it again.
- A typed `--concurrency` (or `concurrency` on `lowdefy_run_tests`) is refused on a headless run: pass `--thorough` or `--browser` with it.
- A plain `lowdefy test` runs nothing in a browser, so it records no `journey` traces; `--thorough` records the journeys it ran there and `--browser` the whole suite.
- On a `--thorough` run each result line ends with where the journey ran, `[headless]` or `[browser]`, and the run prints one summary. The browser part takes the journey run slots and `--concurrency`; headless journeys go one at a time.
- `lowdefy_run_tests` follows the same default and takes `browser` and `thorough` beside `headless`.
- `headless-run.json` entries carry `hash` and `configHashes`, the journey and build they were taken on. A run of some journeys keeps the records of the others.
- `openTestApp` returns the build's `buildId`.
- The agent rules, journey skills, `lowdefy_run_tests` and `lowdefy_run_journey` tool text say to run journeys headless and to use `--thorough` or `--browser` only when a person asks, or when the change is something only a browser shows.
