---
'lowdefy': minor
---

perf(cli): `lowdefy test --build` runs headless journeys side by side

`lowdefy test --build` now runs several headless journeys at once, each in a thread of its own: by default as many as the machine has cores less one, and no more than one per 4 GiB of memory. `--concurrency <n>` sets another limit, any whole number from 1, on a headless run too; it was refused before. `lowdefy_run_tests` takes the same `concurrency`.

- The run's own thread runs one journey and worker threads run the rest. Each worker opens the production build once and runs one journey at a time, on a data session of its own on the run's one data store, so no journey sees another's writes or page state.
- The output is in run order whatever order the journeys finish in, and `results.json` and `headless-run.json` are in the order the journeys were selected. `headless-run.json` is written once per run.
- As in browser runs, a journey with no data set, or marked `serial: true`, runs alone after the others, and a journey that fails beside another is run again alone before it is reported.
- A run goes one at a time under `--repeat` above 1, while the operating system reports memory pressure, and on a machine with one or two cores. If a worker thread cannot open the build (it was rebuilt during the run), the run says so and goes on one at a time.
- In a `--thorough` run, `--concurrency` sets both the headless part and the browser part (1 to 3). `LOWDEFY_JOURNEY_CONCURRENCY` and `lowdefy.yaml`'s `cli.concurrency` still set only browser journeys.

A journey on a data set that depends on something outside its data session (the clock, a file, an outside service that is not stubbed) now runs beside others in a `--build` run. Mark it `serial: true`, or pass `--concurrency 1`.
