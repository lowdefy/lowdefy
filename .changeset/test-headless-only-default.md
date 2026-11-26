---
'lowdefy': major
'@lowdefy/test-utils': minor
'@lowdefy/server-dev': patch
'@lowdefy/docs-content': patch
---

feat(cli): `lowdefy test` runs journeys headless by default; browser journeys only when asked

**Breaking (v8):** a plain `lowdefy test`, and `lowdefy_run_tests` with no mode, now run only the journeys that need no browser. A journey that needs a browser is listed `BROWSER-ONLY` and not run. CI that relied on a bare `lowdefy test` running browser journeys must pass `--thorough`. So it can't go green without them by accident, a run in CI (the `CI` variable set, as GitHub Actions and GitLab set it) given none of `--headless`, `--thorough` and `--browser` exits 1 when it skips a browser journey, naming the count and both ways out.

- `--thorough` runs each journey headless when it can and in the browser when it can't, and runs a journey found to need a browser partway through in the browser too, from step 1. The mixed run without `--thorough` is gone.
- `--browser` is unchanged. `--headless` is the default spelled out and still accepted. Two of `--browser`, `--thorough` and `--headless` are refused. `--build` no longer needs `--headless`; `--build` with `--thorough` or `--browser` is refused.
- After the summary, a run that left journeys browser-only names each with its file and the step that needs a browser, and prints `lowdefy test --thorough <files>`, with `--config-directory` when the app is not the working directory (on `lowdefy_run_tests`, the call with `thorough: true` and `paths`). The exit code stays 0, except in CI as below.
- A journey `.lowdefy/test/headless-run.json` records as browser-only, for the same journey and build, is listed without being run up to its browser step again (`found by an earlier run, not run again`). `--thorough` sends it straight to the browser. On the dev server the record keys on the server's build and the app's config files, so an edit to any config file runs it again; on `--build` it keys on the build's `buildId`, so each new `lowdefy build` runs it again.
- In CI, a run given no mode flag that left a journey browser-only exits 1: pass `--thorough` to run the browser journeys, or `--headless` to say on purpose that they don't run there. `--build` with no mode flag counts as a plain run, so CI on the production build runs `lowdefy test --headless --build`, which is unchanged. `CI` set to `false` or `0` counts as unset. A journey with a hold, release or call as system step, which no run takes to the browser, doesn't count. Outside CI nothing changes, and `lowdefy_run_tests` never applies it.
- A typed `--concurrency` (or `concurrency` on `lowdefy_run_tests`) is refused on a headless run: pass `--thorough` or `--browser` with it.
- A plain `lowdefy test` runs nothing in a browser, so it records no `journey` traces; `--thorough` records the journeys it ran there and `--browser` the whole suite.
- On a `--thorough` run each result line ends with where the journey ran, `[headless]` or `[browser]`, and the run prints one summary. The browser part takes the journey run slots and `--concurrency`; headless journeys go one at a time.
- A headless run on the dev server takes its worktree's journey run slot, so two runs in one app folder no longer share a server the first one stops. It takes no machine-wide slot, so it never waits behind browser runs in other worktrees.
- `lowdefy_run_tests` follows the same default and takes `browser` and `thorough` beside `headless`.
- `headless-run.json` entries carry `hash` and `configHashes`, the journey and build they were taken on. A run of some journeys keeps the records of the others.
- `openTestApp` returns the build's `buildId`.
- The agent rules, journey skills, `lowdefy_run_tests` and `lowdefy_run_journey` tool text say to run journeys headless and to use `--thorough` or `--browser` only when a person asks, or when the change is something only a browser shows.
