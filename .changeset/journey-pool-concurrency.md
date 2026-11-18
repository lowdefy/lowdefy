---
'lowdefy': minor
'@lowdefy/server-dev': minor
---

feat(cli): `lowdefy test --concurrency` runs browser journeys side by side

`lowdefy test --concurrency <n>` and the `lowdefy_run_tests` agent tool's `concurrency` keep up to `n` browser journeys in flight (1 to 3). `LOWDEFY_JOURNEY_CONCURRENCY` sets it for both. The default stays 1.

- Journeys on a data set run side by side. Journeys with no data set, or marked `serial: true`, run alone after them.
- Results and result files keep selection order. The output prints the journeys that ran side by side first, then the ones that ran alone. This order applies at the default of 1 too, so a suite that mixes data-set journeys and journeys with no data set now prints the data-set ones first.
- The run goes one at a time under `--repeat` above 1 and while the operating system reports memory pressure. Headless runs always go one at a time, and `--concurrency` with `--headless` or `--access` is refused.
- At 2 or more, a screenshot or state inspection from another session can wait several journeys for a browser slot, since every browser operation on the machine shares three.
- A journey whose run throws now fails that journey, and the run goes on.

The development server's journey route reports `durationMs`, counted from when the journey got a browser, and `waitedMs`, its wait for one. `lowdefy test` shows the journey's own time, and its POST time against an older server.
