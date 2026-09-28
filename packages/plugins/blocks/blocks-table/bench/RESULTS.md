# Table bench results

Measured 2026-09-28 on an Apple M5 (10 cores, 16 GB), macOS (Darwin 25.4.0), Node 26.5.0, Playwright 1.59.1 with headless Chromium 147, 1440x900 at DPR 1, one worker. Production React build (the profiling variant, so `<Profiler>` reports commit times). Data: seeded synthetic rows generated in the page (`bench/app/generateData.js`), 100k x 50 unless stated, CRM-like mixed column types. Reproduce with `pnpm bench` (writes `results/report.md`).

This is a fast developer machine, not the fixed CI runner D10 asks for; expect the CI numbers to be higher. The cells are the local stand-in renderers (plain text, tier 0): the "mixed tier-0 and tier-1 cells" scroll scenario can only run once the shared cell catalogue lands (`src/core/getCellRenderer.js`).

## Summary against the D10 budgets

| Scenario                                                        | Budget                                                         | Measured                                                                                                                                   | Status    |
| --------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Scroll 100k x 50, wheel-slow (translated)                       | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.4 / p99 17.6 ms (idle p95 17.4), 0 long tasks, 0.99 ms main thread/frame, 64 commits (max 1.7 ms), 1209 nodes            | met       |
| Scroll 100k x 50, wheel-fast (translated)                       | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.5 / p99 17.7 ms (idle p95 17.4), 0 long tasks, 1.59 ms main thread/frame, 63 commits (max 3.2 ms), 1209 nodes            | met       |
| Scroll 100k x 50, wheel-horizontal (translated)                 | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.4 / p99 17.6 ms (idle p95 17.4), 0 long tasks, 0.75 ms main thread/frame, 20 commits (max 2 ms), 660 nodes               | met       |
| Scroll 100k x 50, programmatic-3000 (translated)                | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.2 / p99 17.6 ms (idle p95 17.4), 0 long tasks, 1.69 ms main thread/frame, 360 commits (max 1.8 ms), 1235 nodes, blank 0% | met       |
| Scroll 100k x 50 at 4x CPU throttle (translated)                | >= 30 fps sustained                                            | 59.84 fps, p99 17.7 ms, max 33.3 ms, 2.34 ms main thread/frame                                                                             | met       |
| Scroll 100k x 50, wheel-slow (positioned)                       | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.4 / p99 17.6 ms (idle p95 17.4), 0 long tasks, 1.14 ms main thread/frame, 134 commits (max 1.1 ms), 1806 nodes           | met       |
| Scroll 100k x 50, wheel-fast (positioned)                       | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.5 / p99 17.7 ms (idle p95 17.4), 0 long tasks, 1.49 ms main thread/frame, 136 commits (max 2.8 ms), 1806 nodes           | met       |
| Scroll 100k x 50, wheel-horizontal (positioned)                 | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.5 / p99 17.7 ms (idle p95 17.4), 0 long tasks, 0.84 ms main thread/frame, 22 commits (max 2.8 ms), 1091 nodes            | met       |
| Scroll 100k x 50, programmatic-3000 (positioned)                | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.1 / p99 17.5 ms (idle p95 17.4), 0 long tasks, 2.44 ms main thread/frame, 718 commits (max 1 ms), 1832 nodes, blank 0%   | met       |
| Scroll 100k x 50 at 4x CPU throttle (positioned)                | >= 30 fps sustained                                            | 60 fps, p99 17.6 ms, max 17.7 ms, 2.88 ms main thread/frame                                                                                | met       |
| Sort 100k (number)                                              | <= 50 ms main-thread blocking; INP <= 100 ms                   | longest task < 50 ms, sort render 23.2 ms, INP 16 ms, click to sorted paint 82 ms (toggle: 82.2 ms), keys 6.7 ms                           | met       |
| Sort 100k (text)                                                | <= 150 ms main-thread blocking; INP <= 100 ms                  | longest task < 50 ms, sort render 19.3 ms, INP 56 ms, click to sorted paint 198.8 ms (toggle: 82.2 ms), keys 120.7 ms                      | met       |
| First render 1000 x 10                                          | reference                                                      | 19.9 ms render+commit, 22.48 ms main-thread task time, 605 nodes, heap 5.59 MB (data included)                                             | reference |
| First render 10000 x 20                                         | < 300 ms scripting, <= 3,000 nodes                             | 25.6 ms render+commit, 31.02 ms main-thread task time, 1155 nodes, heap 16.2 MB (data included)                                            | met       |
| First render 100000 x 50                                        | < 800 ms scripting, <= 3,000 nodes                             | 62.4 ms render+commit, 65.41 ms main-thread task time, 715 nodes, heap 286.59 MB (data included)                                           | met       |
| Column resize drag (120 moves)                                  | 60 fps, 0 body commits per frame                               | 60 fps, p95 17.1 ms, body renders during drag 0, row renders 0, setValue 0; after pointerup setValue 1                                     | met       |
| Update 1 row of 100k                                            | <= 5 ms, exactly 1 row re-rendered                             | 1.8 ms render+commit (React 1.5 ms), 1 row re-rendered                                                                                     | met       |
| 60 s scroll, forced GC                                          | heap growth < 5%                                               | 284.08 MB -> 284.25 MB (0.06%)                                                                                                             | met       |
| Block chunk (Table.lazy + TanStack, antd/React/@lowdefy shared) | <= 80 kB gzip                                                  | 44.8 kB gzip JS (181 kB min), 1.7 kB gzip CSS                                                                                              | met       |

## Reading the numbers

- **Frame p95 vs 16.7 ms.** Headless Chromium's rAF deltas jitter around vsync: with no input at all the p95 is 17.4 ms and the p99 17.6 ms. Measured literally, no scenario (idle included) can meet "p95 <= 16.7 ms", so the suite checks p95 against the idle floor plus 1 ms, and reports what actually separates implementations: main-thread task time per frame (CDP `TaskDuration`), React commits and their cost, long tasks, and frames over 25 ms. Every scroll scenario runs at 60 fps with 0 long tasks and at most 2.9 ms of main-thread work per frame, 4x CPU throttle included (one frame of 33 ms in the translated 4x run, none in the positioned one).
- **First render** is the table's own render and commit (and the main-thread task time around it), with the data already in memory. It does not include the Lowdefy engine evaluating a 100k-row `data` property, which the harness bypasses.
- **Sort 100k.** "Longest task < 50 ms" means the long-task observer saw no task at or above its 50 ms threshold. The sort render (index sort plus the body render, as React measures it) is 23 ms for numbers and 19 ms for text. Click to sorted paint includes Playwright's click, the transition and two frames. Toggling direction reuses the cached keys (82 ms click to paint, the same as a number sort).
- **Row update** is a new `data` array with one new row object (the P1 path; `applyTransaction` is P3). One row re-renders; the render and commit take 1.8 ms.

## Row window: TanStack Virtual per-row positioning vs one translated window

Both strategies are in the code; the block uses the translated window. `positioned` is a bench-only prop (`rowWindowStrategy`) the Lowdefy client never passes. Same data, same column virtualisation, same cells:

| Scenario                                                           | Translated window (default) | TanStack Virtual, per-row transforms |
| ------------------------------------------------------------------ | --------------------------- | ------------------------------------ |
| Wheel slow: main thread / frame, commits                           | 0.99 ms, 64                 | 1.14 ms, 134                         |
| Wheel fast: main thread / frame, commits (max)                     | 1.59 ms, 63 (3.2 ms)        | 1.49 ms, 136 (2.8 ms)                |
| 3,000 px/s: main thread / frame, commits                           | 1.69 ms, 360                | 2.44 ms, 718                         |
| 4x CPU wheel fast: main thread / frame, max commit, frames > 25 ms | 2.34 ms, 7.2 ms, 1 (33 ms)  | 2.88 ms, 10.8 ms, 0                  |
| DOM nodes while scrolling                                          | 1,209                       | 1,806                                |
| Blank frames at 3,000 px/s                                         | 0%                          | 0%                                   |

The translated window renders only when the rendered range changes (the virtualizer also renders on its `isScrolling` flag), leans its pixel overscan in the scroll direction (one body height ahead, a quarter behind, versus a symmetric count-based overscan) and moves one container per range change instead of setting a transform per row. It uses a third fewer DOM nodes, half the commits and less main-thread time in three of four scenarios; the fast-wheel difference (0.1 ms per frame) is within run-to-run noise. Kept: translated window.

## Fixes made to meet the budgets

- **Row update: 35 ms -> 1.8 ms.** A CPU profile showed the 100k-row TanStack core row model rebuild (100k `Row` objects and a 100k-key id index) and the key diff dominating. The core row model slot is replaced (`src/core/createStableCoreRowModel.js`): rows keep their `Row` instance when their object and index are unchanged, and a same-shape update patches only the replaced rows. The key diff (`src/core/stabilizeData.js`) matches rows positionally before it falls back to the key index.
- **Text sort: 171 ms longest task -> no long task.** Ranking ~98k distinct strings with `Intl.Collator` took 120-130 ms in one task. The header click now builds a large text column's keys first, with a merge sort that yields to the browser every 12 ms (`src/features/sorting/sortInSlices.js`), then applies the sort in a transition. Numbers (6.7 ms) and low-cardinality columns still build synchronously.

## Known gaps

- Mixed tier-0/tier-1 cells, filter-100k, group-100k, server mode and the lazy-mount interaction bench from performance.md §8 are not in this suite yet: their features arrive with later modules.
- A sort that arrives through the value or `defaultView` builds text keys synchronously (the 120 ms step runs in that render).
- A data change on a sorted table re-sorts all rows (incremental re-sort is part of P3 transactions).
- Numbers are from one run of each scenario (medians of 5 for sort, initial render and row update); CI should run the suite on a fixed runner and store a baseline.
