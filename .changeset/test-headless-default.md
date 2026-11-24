---
'lowdefy': major
'@lowdefy/docs-content': patch
---

feat(cli): `lowdefy test` runs each journey once, headless when it can

**Breaking (v8):** a plain `lowdefy test` no longer runs every journey in a browser. Each journey runs once: in the browser when its steps need one, else headless. Pass `--browser` for the old behaviour.

- A journey the headless run finds needs a browser partway through stops there and is reported `BROWSER-ONLY` with the step and why; it neither passes nor fails the run. `.lowdefy/test/headless-run.json` remembers it, so the next `lowdefy test` runs it straight in the browser while the journey and the dev server's build are unchanged. A run of some journeys keeps the records of the others.
- `lowdefy test --thorough` also runs those journeys in the browser, from step 1, in the same run. A fresh CI checkout has no `headless-run.json`, so use `--thorough` in CI.
- `--browser` runs every journey in the browser. `--headless` is unchanged. Two of `--browser`, `--thorough` and `--headless` are refused. `--build` still needs `--headless`.
- Each result line ends with where the journey ran, `[headless]` or `[browser]`, and the run prints one summary.
- The browser part takes the journey run slots and `--concurrency`; headless journeys go one at a time. `--concurrency` is refused only with `--headless`.
- `lowdefy_run_tests` follows the same default and takes `browser` and `thorough` beside `headless`.
- `headless-run.json` entries carry `hash` and `configHashes`, the journey and build they were taken on.
