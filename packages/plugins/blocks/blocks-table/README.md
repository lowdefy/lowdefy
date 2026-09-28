# Lowdefy Table Blocks

The `Table` and `TableInput` blocks: a virtualised, keyboard-accessible data table for Lowdefy, built on [TanStack Table](https://tanstack.com/table) and [TanStack Virtual](https://tanstack.com/virtual) and styled with the app's antd theme tokens.

`Table` is an input block whose value is its UI state, `{ view, selected, expanded }`: `_state: <id>.selected` is the row selection and `_state: <id>.view` the current view (column order, widths, pinning, visibility, sort and grouping).

`TableInput` is the same table for editing rows in a form: rows come from `data`, and its value is the changes made to them, `{ updated, added, removed, moved?, order? }` (only what changed, never the rows), ready to save with one bulk write.

- `pnpm test` runs the unit tests of the pure table functions (Jest).
- `pnpm e2e` runs the Playwright block tests.
- `pnpm bench` runs the performance suite (see `bench/RESULTS.md`).
- `ARCHITECTURE.md` describes the core and how feature modules plug into it.
