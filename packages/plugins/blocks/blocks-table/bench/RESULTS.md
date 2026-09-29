# Table bench results

Measured 2026-09-29 on an Apple M5 (10 cores, 16 GB), macOS (Darwin 25.4.0), Node 26.5.0, Playwright 1.59.1 with headless Chromium 147, 1440x900 at DPR 1, one worker. Production React build (the profiling variant, so `<Profiler>` reports commit times). Data: seeded synthetic rows generated in the page (`bench/app/generateData.js`), 100k x 50 unless stated. Reproduce with `pnpm bench` (writes `results/report.md`).

Cells are the real shared renderers (`@lowdefy/blocks-antd/table`, the same TableLight uses), and the 50 columns cycle CRM-like types: text, currency, tag and status (with options), date, avatar, number, link, html (a nunjucks template), boolean, email, and a tier-1 `buttons` column (two antd Buttons, `showOn: hover`), the first of which (`actions_12`) is pinned to the end so every rendered row has one. The bench's `Link` is an anchor stand-in (the client's Link adds router navigation on click, not render cost) and icons render nothing.

**Machine load.** Other worktrees ran e2e suites on the same machine throughout (1-minute load average 10 to 50 on 10 cores), so absolute numbers move between runs by up to 2x, most at 4x CPU throttle and in first render. The summary is the quietest full run (load 12-16); the before/after tables put runs next to each other and give the load. D10 asks for a fixed CI runner; these are indicative, not a baseline.

## Summary against the D10 budgets

| Scenario                                                        | Budget                                                         | Measured                                                                                                                                                                                                              | Status    |
| --------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Scroll 100k x 50, wheel-slow (translated)                       | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.4 / p99 17.6 ms (idle p95 17.4), 0 long tasks, 2.17 ms main thread/frame, 194 commits (max 8.4 ms), 1812 nodes                                                                                      | met       |
| Scroll 100k x 50, wheel-fast (translated)                       | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.5 / p99 17.7 ms (idle p95 17.4), 0 long tasks, 1.9 ms main thread/frame, 70 commits (max 6.5 ms), 1377 nodes                                                                                        | met       |
| Scroll 100k x 50, wheel-horizontal (translated)                 | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.6 / p99 17.7 ms (idle p95 17.4), 0 long tasks, 0.92 ms main thread/frame, 24 commits (max 10 ms), 950 nodes                                                                                         | met       |
| Scroll 100k x 50, programmatic-3000 (translated)                | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.6 / p99 17.7 ms (idle p95 17.4), 0 long tasks, 2.4 ms main thread/frame, 359 commits (max 4.1 ms), 1407 nodes, blank 0%                                                                             | met       |
| Scroll 100k x 50 at 4x CPU throttle (translated)                | >= 30 fps sustained                                            | 59.01 fps, p99 17.7 ms, max 66.4 ms, 3.96 ms main thread/frame                                                                                                                                                        | met       |
| Scroll 100k x 50, wheel-slow (positioned)                       | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.5 / p99 17.6 ms (idle p95 17.6), 0 long tasks, 1.74 ms main thread/frame, 282 commits (max 6.6 ms), 2731 nodes                                                                                      | met       |
| Scroll 100k x 50, wheel-fast (positioned)                       | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.6 / p99 17.7 ms (idle p95 17.6), 0 long tasks, 1.85 ms main thread/frame, 143 commits (max 9 ms), 2066 nodes                                                                                        | met       |
| Scroll 100k x 50, wheel-horizontal (positioned)                 | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.3 / p99 17.6 ms (idle p95 17.6), 0 long tasks, 1.12 ms main thread/frame, 26 commits (max 7.4 ms), 1597 nodes                                                                                       | met       |
| Scroll 100k x 50, programmatic-3000 (positioned)                | p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks | p50 16.7 / p95 17.4 / p99 17.6 ms (idle p95 17.6), 0 long tasks, 4.16 ms main thread/frame, 720 commits (max 1.9 ms), 2096 nodes, blank 0%                                                                            | met       |
| Scroll 100k x 50 at 4x CPU throttle (positioned)                | >= 30 fps sustained                                            | 42.1 fps, p99 99.1 ms, max 115.7 ms, 13.68 ms main thread/frame                                                                                                                                                       | met       |
| Sort 100k (number)                                              | <= 50 ms main-thread blocking; INP <= 100 ms                   | longest task < 50 ms, sort render 44.8 ms, INP 16 ms, click to sorted paint 96.3 ms (toggle: 95.1 ms), keys 8.4 ms                                                                                                    | met       |
| Sort 100k (text)                                                | <= 150 ms main-thread blocking; INP <= 100 ms                  | longest task < 50 ms, sort render 47.9 ms, INP 24 ms, click to sorted paint 429.5 ms (toggle: 96.5 ms), keys 219.9 ms                                                                                                 | met       |
| Group by one column 100k (tag, 6 groups; sum + avg)             | <= 150 ms main-thread blocking                                 | longest task < 50 ms, group render 31.5 ms, call to grouped paint 64.9 ms; collapse all 1.1 ms, expand all 1.3 ms render                                                                                              | met       |
| Group by one column 100k (text, 8 groups; sum)                  | <= 150 ms main-thread blocking                                 | longest task < 50 ms, group render 25.8 ms, call to grouped paint 64.9 ms; collapse all 1.2 ms, expand all 1.1 ms render                                                                                              | met       |
| Group by one column 100k (text, ~100k groups; stress)           | <= 150 ms main-thread blocking                                 | longest task 78 ms, group render 79 ms, call to grouped paint 109.5 ms; collapse all 8.8 ms, expand all 8.1 ms render                                                                                                 | met       |
| First render 1000 x 10                                          | reference                                                      | 60.5 ms render+commit, 66.53 ms main-thread task time, 917 nodes, heap 6.88 MB (data included)                                                                                                                        | reference |
| First render 10000 x 20                                         | < 300 ms scripting, <= 3,000 nodes                             | 89.2 ms render+commit, 104.1 ms main-thread task time, 1703 nodes, heap 16.79 MB (data included)                                                                                                                      | met       |
| First render 100000 x 50                                        | < 800 ms scripting, <= 3,000 nodes                             | 133.3 ms render+commit, 154.86 ms main-thread task time, 1047 nodes, heap 280.41 MB (data included)                                                                                                                   | met       |
| Column resize drag (120 moves)                                  | 60 fps, 0 body commits per frame                               | 60 fps, p95 17.6 ms, body renders during drag 0, row renders 0, setValue 0; after pointerup setValue 1                                                                                                                | met       |
| Update 1 row of 100k                                            | <= 5 ms, exactly 1 row re-rendered                             | 3.7 ms render+commit (React 2.5 ms), 1 row re-rendered                                                                                                                                                                | met       |
| 60 s scroll, forced GC                                          | heap growth < 5%                                               | 277 MB -> 278.38 MB (0.5%)                                                                                                                                                                                            | met       |
| Block chunk (Table.lazy + TanStack, antd/React/@lowdefy shared) | <= 60 kB gzip main chunk (D10: 80 kB)                          | 56.8 kB gzip JS (230.7 kB min, the entry and the 13 chunks it imports statically; 55.1 kB before the enrichment merge), 5.9 kB gzip CSS; optional features and popovers in 32 on-demand chunks (see Chunk size below) | met       |

The sort rows are from a later run (load 52) after the text sort read its keys in slices (see below); the rest are from the full run at load 12-16. A second full run at load 26-35 met every budget except the positioned (bench-only) programmatic-3000 scroll (3 long tasks, p99 33.4 ms) and, before the sliced key read landed, the text sort's INP (152 ms); translated 4x throttle was 53.6 fps there.

- **Group 100k** (measured 2026-09-29 on the same machine before the table moved to the shared cells; not rerun with mixed cells) sets the grouping with the `setGroup` method: the render builds the group tree and its aggregates in one pass over the sorted rows, flattens it and renders the body, inside a transition. Collapse and expand all rerun only the flatten. The 100k-groups case (grouping on a unique text column) is a stress case, not a budget scenario.

## Chunk size: optional features and on-demand popovers

Measured 2026-09-29 on the same machine with `pnpm bench --chunk` (the lazy entry built with React, antd, dayjs and `@lowdefy/*` external; "main" is the entry plus every chunk it imports statically, gzipped together). Scroll numbers are from two `pnpm bench scroll-fps` runs after the change (load average 12-22).

**What doubled it.** The 46.9 kB above was measured before most feature branches merged, and every feature module was a static import of `Table.lazy.js`. The main chunk at each merge on `feat/v7-table` (same measurement, rebuilt from that commit's sources):

| Commit                                                                                                                                           | Main chunk (gzip) | Minified |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | -------- |
| Mixed-cells bench (the 46.9 kB row)                                                                                                              | 47.3 kB           | 195 kB   |
| + grouping                                                                                                                                       | 50.2 kB           | 206 kB   |
| + editing                                                                                                                                        | 62.9 kB           | 257 kB   |
| + server merge (server mode, toolbar, header menu, column filters and builder, column manager, views, tree, expandable, bulk, queue, pagination) | 96.7 kB           | 401 kB   |
| + client fixes, visual polish                                                                                                                    | 99.4 kB           | 400 kB   |

antd was never in it (external here, and split into shared chunks in a Lowdefy build, which the e2e app's build confirms: `popover`, `button`, `checkbox`, `date-picker` chunks are imported, not inlined). TanStack Table is tree-shaken to the features the table uses; TanStack Virtual (38.6 kB rendered, about 10 kB gzip) was only there for the bench-only `positioned` row strategy.

**What moved out.** Optional features load in their own chunk only for tables whose config needs them (`core/useFeatureSet.js`, see ARCHITECTURE.md), and popovers and menus load on first use, preloaded on hover or focus of their trigger:

| Main chunk by module group (kB rendered) | Before   | After    |
| ---------------------------------------- | -------- | -------- |
| @tanstack/table-core                     | 109.3    | 109.3    |
| core                                     | 58.5     | 62.0     |
| features/editing                         | 56.9     | 0.3      |
| features/filtering                       | 48.0     | 18.3     |
| @tanstack/virtual-core                   | 40.7     | 0        |
| features/grouping                        | 26.9     | 2.7      |
| features/toolbar                         | 21.6     | 1.3      |
| features/serverData                      | 20.7     | 1.1      |
| features/headerMenu                      | 12.6     | 10.0     |
| features/columnManager                   | 12.4     | 2.2      |
| features/views                           | 11.1     | 0.7      |
| features/tree, expandable                | 14.8     | 2.5      |
| **Main chunk, gzip**                     | **99.4** | **54.8** |

| On-demand chunk (loads when)                                                                                                     | gzip    |
| -------------------------------------------------------------------------------------------------------------------------------- | ------- |
| editingFeature (an editable column, `rowDrag`, TableInput)                                                                       | 11.2 kB |
| enrichmentFeature (an enrichment, ai, extract, `status` or user-defined column, `providers`, `addColumn`, `addRow`, `importCsv`) | 9.3 kB  |
| ColumnPicker (the add / edit column picker opens)                                                                                | 4.2 kB  |
| CellDetails (an enrichment cell's details panel opens)                                                                           | 2.8 kB  |
| ImportDialog (the CSV import dialog opens)                                                                                       | 2.8 kB  |
| newRowsFeature (with enrichment)                                                                                                 | 0.4 kB  |
| groupRowsFeature (a groupable column)                                                                                            | 6.0 kB  |
| serverDataFeature (`data: { mode: server }`)                                                                                     | 4.7 kB  |
| toolbarFeature (`toolbar`, or a toolbar slot with blocks)                                                                        | 4.5 kB  |
| FilterBuilder (the toolbar's Filter popover opens)                                                                               | 3.7 kB  |
| ColumnFilterPopover (a column filter opens)                                                                                      | 3.4 kB  |
| ColumnManagerPopover (the column manager opens)                                                                                  | 2.8 kB  |
| viewsFeature (`persist`, `views`, or view tabs)                                                                                  | 2.7 kB  |
| CellEditor (the first edit)                                                                                                      | 2.5 kB  |
| pasteFeature (TableInput)                                                                                                        | 2.3 kB  |
| treeFeature (`tree`)                                                                                                             | 2.2 kB  |
| expandableFeature (`expandable`)                                                                                                 | 1.5 kB  |
| HeaderMenuDropdown (a header menu opens)                                                                                         | 1.1 kB  |
| positionedRows (bench only), shared helpers                                                                                      | < 2 kB  |

**Enrichment** (measured after merging the enrichment tables branch): as a static import it put 44.8 kB rendered (66.1 kB gzip main chunk) into every table. As an optional feature the main chunk keeps 3.9 kB of it (the config normalisation and `needsEnrichment`), 56.8 kB gzip in all; the feature is a 9.3 kB gzip chunk, and its picker, details panel and import dialog are chunks of their own, preloaded on hover or focus of what opens them.

A table that needs optional features shows its fallback until their chunks load (one more round trip after the entry on the first such table of a page; later tables reuse them). Scroll frame times are unchanged: every scenario met its budget in the second run (translated wheel-slow p95 17.5 ms, 1.78 ms main thread/frame; 4x throttle 59.5 fps translated, 59.8 fps positioned); the first run, at load 15-22, had one 26 ms commit in positioned wheel-horizontal.

**Not in this measurement: nunjucks.** `@lowdefy/nunjucks` (about 36 kB gzip) is external here but is a static import of the shared column core (`compileColumns`, `compileTooltip`, `getCellText`) and of `normalizeExpandable`, so a Lowdefy page loads it with the first Table or TableLight, in the shared table-core chunk, whether or not a column uses a template. Loading it only for configs with an `html` template, a template tooltip or `expandable` needs the shared core to take the template compiler as an argument; left for a follow-up.

## Wrapped rows: incremental row offsets

Measured 2026-09-29 on the same machine (load average 2-4), `bench/tests/scroll-wrap.bench.js`: 100k rows with two text columns wrapping at 90 px (`name_1`, `name_13`), so every data row is measured and rows differ in height; column virtualisation is off. Two runs each, before and after, translated window.

Before, every measurement batch (each window render reaching unmeasured rows) recomputed all 100k item tops, looking up each item's measured height (about 1.3 ms at 100k in Node). After, a batch shifts the offsets from its first changed item with one running sum (`shiftRowOffsets`, about 0.3 ms including the copy), and batches reported before the next render share one copy.

| Scenario                             | Before: ms per commit, main thread per frame | After: ms per commit, main thread per frame |
| ------------------------------------ | -------------------------------------------- | ------------------------------------------- |
| 10 cols, wheel-fast                  | 1.81 / 1.63 ms, 2.28 / 2.2 ms                | 0.8 / 1.08 ms, 1.74 / 1.98 ms               |
| 10 cols, programmatic 3,000 px/s     | 0.56 / 0.62 ms, 2.99 / 3.13 ms               | 0.27 / 0.29 ms, 2.8 / 3.04 ms               |
| 10 cols, programmatic 3,000 px/s, 4x | 1.43 / 1.25 ms, 7.3 / 6.27 ms                | 0.43 / 0.46 ms, 4.74 / 4.87 ms              |
| 50 cols, wheel-fast                  | 3.28 / 2.02 ms, 4.6 / 3.67 ms                | 2.44 / 2.56 ms, 4.22 / 4.44 ms              |
| 50 cols, programmatic 3,000 px/s     | 1.07 / 0.9 ms, 6.58 / 5.91 ms                | 0.68 / 0.75 ms, 6.02 / 6.69 ms              |
| 50 cols, programmatic 3,000 px/s, 4x | 2.32 / 2.36 ms, 15.59 / 16.48 ms, 58.3 fps   | 1.52 / 1.47 ms, 14.25 / 14.02 ms, 58.9 fps  |

Every case held 60 fps at 1x (p95 18.1-18.6 ms against an idle floor near 18.4 ms on this run) with no long tasks; at 4x the 50-column case has one long task in both (the first render of the wrapped window). The offsets work was a third to a half of the React time per commit with 10 columns; with 50 columns rendering every cell of a wrapped row dominates, and the saving is a smaller share.

## Mixed cells: before and after

"Before" is the engine as merged, with the local stand-in renderers (every cell plain text) and the old column set; "after" is this branch with the shared renderers and the mixed column set above. Translated window, 100k x 50.

| Scenario                                                  | Before: stand-in text cells                                           | Mixed cells, no lazy mounting                 | After: mixed cells, lazy tier-1 + fast-scroll placeholders                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Load average during the run                               | ~7 / ~11                                                              | ~15                                           | ~14 / ~16 / ~28                                                                                     |
| Wheel slow: p95 / p99, main thread per frame, commits     | 18.2 / 18.6 ms (idle 18.4), 0.85 ms, 62 ; 17.5 / 17.7 ms, 0.97 ms, 66 | 17.5 / 17.7 ms, 1.79 ms, 124                  | 17.4 / 17.6 ms, 2.17 ms, 194 ; 17.6 / 17.7 ms, 2.04 ms, 152 ; 17.5 / 17.6 ms, 2.03 ms, 197          |
| Wheel fast: p95 / p99, main thread per frame, max commit  | 18.4 / 18.6 ms, 1.5 ms, 3.3 ms ; 17.5 / 17.6 ms, 1.13 ms, 4.1 ms      | **33.3 / 33.8 ms (missed)**, 3.18 ms, 10.5 ms | 17.5 / 17.7 ms, 1.9 ms, 6.5 ms ; 17.6 / 32.4 ms, 2.33 ms, 12.9 ms ; 17.5 / 17.7 ms, 2.09 ms, 6.5 ms |
| 3,000 px/s: p95, main thread per frame, blank frames      | 17.9 ms, 1.65 ms, 0% ; 17.4 ms, 2.59 ms, 0%                           | 17.2 ms, 3.4 ms, 0%                           | 17.6 ms, 2.4 ms, 0% ; 17.5 ms, 3.13 ms, 0% ; 18.5 ms (idle 17.5), 3.55 ms, 0%                       |
| 4x CPU wheel fast: fps, p99, main thread per frame        | 59.86 fps, 18.7 ms, 2.27 ms ; 56.11 fps, 34.1 ms, 4.29 ms             | 47.74 fps, 50.4 ms, 7.67 ms                   | 59.01 fps, 17.7 ms, 3.96 ms ; 57.73 fps, 34.3 ms, 5.69 ms ; 55.25 fps, 49.8 ms, 6.59 ms             |
| DOM nodes while scrolling (wheel fast)                    | 1,209                                                                 | 2,022                                         | 1,377 (1,812 at rest)                                                                               |
| First render 1000 x 10 / 10k x 20 / 100k x 50 (task time) | 34 / 48 / 96 ms ; 46 / 55 / 109 ms                                    | 47 / 69 / 98 ms                               | 67 / 104 / 155 ms ; 86 / 126 / 214 ms ; 56 / 71 / 116 ms                                            |

- Mixed cells without lazy mounting missed the normal-speed wheel-fast budget: every row mounts two antd Buttons (and antd Button commits twice on mount), which doubled the commits and pushed p95 to 33 ms.
- With the fixes, scrolling costs about 1 ms more main thread per frame than plain text cells and stays at 60 fps with no long tasks at normal speed; at 4x throttle it runs at 55-59 fps against the 30 fps budget.
- First render with rich cells costs roughly 20-60 ms more than plain text across the matrix, still well under the 300 / 800 ms budgets; the spread between runs is mostly machine load.
- Wheel-slow commits rose (62 to ~190): the pointer rests over the table while it scrolls, so a new row is hovered every few frames and mounts its hover buttons. Each is a small commit (max 8-9 ms at 1x); the main thread per frame stays near 2 ms.

## Fixes made for mixed cells

- **Hover buttons mount on demand (tier 1, D4).** `buttons` cells with `showOn: hover` mount their antd Buttons only on the hovered row or the row holding focus (`src/core/LazyCell.js`), fed by the grid's one delegated `pointerover`/`focus` listener through a small per-table store (`src/core/createCellActivity.js`), so a hover change re-renders only the two cells whose answer changes.
- **Placeholders while scrolling fast (D10.4).** Rich cells (tags, status, avatars, people, html, links, progress, rating, images, relations, buttons) that come into view while the scroll speed is above 1.5 px/ms render their text in the cell's layout and upgrade 150 ms after the scroll settles (`src/features/lazyCells/useFastScroll.js`); hover buttons do not mount during a fast scroll at all. This took 4x throttle from ~47 to ~57 fps and the fast-wheel DOM from 2,022 to 1,377 nodes.
- **Number formatters are reused.** `formatNumber` (`@lowdefy/block-utils`, shared with ag-grid) built a new `Intl.NumberFormat` per call; formatters are now cached by locale and options.
- **Text sort keys read in slices.** Keys now come from the shared key getter (so the order equals `createComparator`'s, see `src/features/sorting/buildSortKeys.test.js`); reading 100k values and their keys ran up to 70 ms in one task, so a header click on a large text column now paints first and reads the keys in 12 ms slices before the sliced collator sort. Plain strings are their own sort key (no label lookup).

## Earlier fixes (engine)

- **Row update: 35 ms -> 1.8 ms.** A CPU profile showed the 100k-row TanStack core row model rebuild (100k `Row` objects and a 100k-key id index) and the key diff dominating. The core row model slot is replaced (`src/core/createStableCoreRowModel.js`): rows keep their `Row` instance when their object and index are unchanged, and a same-shape update patches only the replaced rows. The key diff (`src/core/stabilizeData.js`) matches rows positionally before it falls back to the key index.
- **Text sort: 171 ms longest task -> no long task.** Ranking ~98k distinct strings with `Intl.Collator` took 120-130 ms in one task. The header click now builds a large text column's keys first, with a merge sort that yields to the browser every 12 ms (`src/features/sorting/sortInSlices.js`), then applies the sort in a transition. Numbers (6.7 ms) and low-cardinality columns still build synchronously.

## Row window: TanStack Virtual per-row positioning vs one translated window

Measured 2026-09-28 with the stand-in text cells; the summary above has both strategies with the mixed cells.

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

## Known gaps

- Filter-100k, server mode and the lazy-mount interaction bench from performance.md §8 are not in this suite yet: their features arrive with later modules.
- Measured row heights (`wrap`, `ellipsis > 1`) are not benchmarked; they turn column virtualisation off, so a 50-column table that wraps renders every column of the window.
- Always-visible `buttons` still mount antd Buttons per rendered row once a scroll settles (D4's static token-styled form is not built); only the fast-scroll placeholder hides their cost.
- A sort that arrives through the value or `defaultView` builds text keys synchronously (that step runs in the render).
- A data change on a sorted table re-sorts all rows (incremental re-sort is part of P3 transactions).
- Numbers are single runs per scenario (medians of 5 for sort, initial render and row update) on a shared, loaded machine; CI should run the suite on a fixed runner and store a baseline.
