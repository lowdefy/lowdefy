---
'lowdefy': minor
---

perf(cli): `lowdefy test --build` runs headless journeys side by side

`lowdefy test --build` now runs several headless journeys at once, each in a thread of its own: by default as many as the machine has cores (less one above 4 cores), and no more than one per GiB of memory, so a 2-core CI runner runs 2 at once. `--concurrency <n>` sets another limit, any whole number from 1, on a headless run too; it was refused before. `lowdefy_run_tests` takes the same `concurrency`.

- The run's own thread runs one journey and worker threads run the rest. Each worker opens the production build once and runs one journey at a time, on a data session of its own on the run's one data store, so no journey sees another's writes or page state.
- The output is in run order whatever order the journeys finish in, and `headless-run.json` keeps the order the journeys were selected in. It is written once per run.
- As in browser runs, a journey with no data set, or marked `serial: true`, runs alone after the others, and a journey that fails beside another is run again alone before it is reported.
- A run goes one at a time under `--repeat` above 1, while the operating system reports memory pressure, and on a machine with one core or less than 2 GiB of memory. If a worker thread cannot open the build, or opens one rebuilt since the run started, the run says so and goes on one at a time.
- On the development server, headless journeys still run one at a time by default, since the server runs them in its one process; `--concurrency <n>` runs `n` at once there.
- In a `--thorough` run, `--concurrency` sets both the headless part and the browser part (1 to 3). `LOWDEFY_JOURNEY_CONCURRENCY` and `lowdefy.yaml`'s `cli.concurrency` still set only browser journeys.

**This changes CI runs.** A `--build` run that went one journey at a time now runs several at once. A journey on a data set whose outcome depends on timing or on state outside its data session (a step that waits a fixed time for background work, a file the app writes, state a plugin keeps in memory) needs `serial: true`. Outside services need no `serial`: under a data set they are stubbed or sunk. A journey that forgot it and fails beside another is run again alone; if it passes, it is reported as a `PASS` with a line naming its first failure and pointing at `serial: true`. Pass `--concurrency 1` to keep a run one at a time.
