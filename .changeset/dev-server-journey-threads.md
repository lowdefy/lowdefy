---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/test-utils': minor
'@lowdefy/node-utils': minor
---

perf(server-dev): The development server runs headless journeys in worker threads

A plain `lowdefy test`, and the `lowdefy_run_tests` agent tool, now run headless journeys side by side on the development server too, with the default `lowdefy test --build` uses: as many at once as the machine has cores (less one above 4 cores), and no more than one per GiB of memory. They ran one at a time there before, since the server ran every journey in its one process.

- The server runs each posted headless journey in a worker thread of its own: the client engine and every request and endpoint call run there, on a data session of its own on the server's one data store. The server's own thread builds the pages, so a page edit or config rebuild during a run is seen by the journeys that start after it.
- The server runs at most that many threads, however many runs post to it, and a thread with no journey for five minutes stops. A thread that stops mid-journey fails only that journey.
- Mutant journeys (`lowdefy journeys harden`) still report the nodes their mutant applied to and missed.
- `--concurrency 1` runs one at a time. Browser journeys, and `lowdefy_run_journey`, still run in the server's own thread.
