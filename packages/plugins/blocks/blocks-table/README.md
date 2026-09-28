# Lowdefy Table Blocks

The `Table` block: a virtualised, keyboard-accessible data table for Lowdefy, built on [TanStack Table](https://tanstack.com/table) and [TanStack Virtual](https://tanstack.com/virtual) and styled with the app's antd theme tokens.

`Table` is an input block whose value is its UI state, `{ view, selected, expanded }`: `_state: <id>.selected` is the row selection and `_state: <id>.view` the current view (column order, widths, pinning, visibility and sort).

- `pnpm e2e` runs the Playwright block tests.
- `pnpm bench` runs the performance suite (see `bench/RESULTS.md`).
- `ARCHITECTURE.md` describes the core and how feature modules plug into it.
