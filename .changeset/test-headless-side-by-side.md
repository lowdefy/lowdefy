---
'lowdefy': minor
---

perf(cli): Headless journeys run side by side

`lowdefy test` and `lowdefy test --build` now keep several headless journeys in flight: by default as many as the machine has cores less one. `--concurrency <n>` sets another limit, any whole number from 1, on a headless run too; it was refused before. `lowdefy_run_tests` takes the same `concurrency`.

- With `--build`, the run's own thread runs one journey and worker threads run the rest. Each worker opens the production build once and runs one journey at a time, on a data session of its own on the run's one data store.
- On the development server, the server runs the journeys it is sent side by side in its one process, each on a data session of its own.
- Results, `results.json` and `headless-run.json` keep the order the journeys were selected in, and `headless-run.json` is written once per run.
- As in browser runs, a journey with no data set, or marked `serial: true`, runs alone after the others, and a journey that fails beside another is run again alone before it is reported.
- A run goes one at a time under `--repeat` above 1, while the operating system reports memory pressure, and on a machine with one or two cores.
- `--concurrency` in a `--thorough` or `--browser` run still sets the browser journeys at once (1 to 3), and a `--thorough` run's headless part runs at the headless default. `LOWDEFY_JOURNEY_CONCURRENCY` and `lowdefy.yaml`'s `cli.concurrency` still set only browser journeys.

A journey on a data set that depends on something outside its data session (the clock, a file, an outside service that is not stubbed) now runs beside others by default. Mark it `serial: true`, or pass `--concurrency 1`.
