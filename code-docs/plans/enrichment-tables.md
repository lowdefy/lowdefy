# Enrichment tables: Clay-style columns that compute from other columns

**Target:** v7, stacked on the Table PR (#2524). **Builds on:** the Table blocks (`code-docs/plugins/blocks/table.md`), archetype C "Enrichment grid" of the table design.

## Problem

Clay's grid is the best-known enrichment table (the table design research). Its columns are steps: a column takes inputs from other columns, calls a provider (an API, an AI prompt, a waterfall of providers), and writes a result per row. Every cell has a visible lifecycle: queued, running, done, error, no result. Users add columns and rows at runtime, re-run a column or a row, open a cell to see the raw result, and promote a nested value to a column of its own.

Lowdefy has every piece except the glue:

- `Table` renders and edits the rows, and patches them live with `applyTransaction`.
- Routines provide `:parallel_for`, `:try`, detached endpoint calls and cron.
- There are AI and HTTP connections, and websockets fed by MongoDB change streams.

This design adds that glue: cell run state, the column and row UX, and a MongoDB-backed run queue. It builds nothing Lowdefy already has.

## Decisions

### E1. Everything lives in the app's own MongoDB collections

- **Rows** are documents in the app's collection, for example `leads`. Enrichment state sits beside the row's data, in one object per column:

  ```js
  _enrich: {
    [columnKey]: {
      status: 'queued' | 'running' | 'ok' | 'error' | 'empty',
      value,          // the extracted result; shown by the column's type
      raw,            // the provider's full response (for the details panel and "add as column")
      error,          // message when status is error
      inputHash,      // hash of the inputs the value was computed from; stale when it differs
      runId, attempts, queuedAt, startedAt, finishedAt, leaseUntil,
    },
  }
  ```

- **User-defined columns** are documents in a columns collection: `{ tableId, key, title, type, kind, config, position, createdBy }`.
- **The column list:** the app merges declared columns and user columns in a request and passes the result to `columns` (columns are data, D3).
- **The display value** is `_enrich.<key>.value`. Every enrichment column reads it through its `field`.

### E2. Column kinds

| `kind`       | Computed                           | Where                           | Config                                                                                               |
| ------------ | ---------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `input`      | typed by users                     | the row field                   | any column `type`, `editable: true`                                                                  |
| `formula`    | from other columns                 | in the browser, a template cell | `template` (nunjucks over the row)                                                                   |
| `enrichment` | a provider call per row            | the server worker               | `provider`, `inputs: { param: { column } \| { value } }`, `output` (path into the result), `autoRun` |
| `ai`         | an AI prompt per row               | the server worker               | `prompt` (template with column refs), `output: { type, options? }`, `autoRun`                        |
| `extract`    | a path into another column's `raw` | in the browser                  | `source` (column key), `path`                                                                        |

A waterfall is an enrichment column whose provider tries several sources in order. The provider's own endpoint runs the waterfall, so the table stays simple.

### E3. Providers are a catalogue the app declares, not URLs users type

The `providers` property is a list: `[{ id, title, description, icon, inputs: [{ key, title, type, required }], outputs: [{ path, title, type }], cost? }]`.

- Each provider maps, on the server, to an API endpoint `enrich_<id>` that takes `{ inputs }` and returns `{ value?, raw }`.
- In the add-column picker, users choose a provider and map its inputs to columns.
- A column can therefore only call what the app exposes. That prevents SSRF, keeps keys out of the browser and makes cost controllable.
- The AI kind is a provider too: the built-in `ai` entry maps to the app's `enrich_ai` endpoint, which calls an AI connection with the rendered prompt.

### E4. The run queue: three MongoDB requests and one worker endpoint

All three requests (`connection-mongodb`) share `MongoDBTableQuery`'s safety rules: a `fields` allowlist, the base `filter`, tenant scoping and limits.

- **`MongoDBEnrichmentEnqueue`** marks cells queued in one `updateMany`.
  - It takes `{ columns: [key], selection (row keys, or the table's `{ all, except, filter, search }`), mode: all | empty | errors | stale }`, plus `columnDefs` for the inputs.
  - It never re-queues a cell that is queued or running with a live lease.
  - For `stale` it compares `inputHash`, computed on the server from each row's current inputs.
  - Rows whose inputs are missing get `status: empty` with `error: 'Missing input: <column>'` instead of queueing.
- **`MongoDBEnrichmentClaim`** atomically claims up to `limit` queued cells, oldest first. Each claim sets `running`, a lease (`leaseUntil`) and increments `attempts`. Cells whose lease has expired while `running` are claimed again. It returns `[{ rowKey, columnKey, row, inputs, attempt }]`, with the inputs resolved from `columnDefs`.
- **`MongoDBEnrichmentComplete`** writes the results `[{ rowKey, columnKey, runId, status, value, raw, error }]`.
  - It only applies a result if the cell's `claimToken` still matches, so a stale worker can't overwrite a newer run. The token carries the hash of the inputs the worker was given, and that is the `inputHash` stored with the result.
  - An error below `maxAttempts` goes back to `queued` with a backoff (`queuedAt` moved into the future).
  - After writing, it returns the downstream `autoRun` columns whose inputs just became ready, so the worker can enqueue them (the waterfall between columns).
- **The worker is a Lowdefy API endpoint** (`enrichment_worker`), written in YAML:

  1. Claim a batch.
  2. Call the provider endpoint for each cell with `:parallel_for` (concurrency per provider).
  3. Complete the batch.
  4. Enqueue the downstream columns.
  5. Loop until nothing is claimed or a time budget is spent.

  A cron entry runs it every minute. An enqueue also calls it as a detached endpoint, so results start at once. A run survives a crash through leases.

### E5. Live updates

A websocket channel (`enrichment`) uses a `MongoDBChangeStream` source on the rows collection, filtered to `_enrich` changes and scoped by tenant. The page subscribes, and `onMessage` calls the table's `applyTransaction({ update })`. Only the changed rows re-render, and there is no polling.

### E6. Table features (a new `enrichment` feature module in blocks-table)

- **Cell run state.** A column with `kind: enrichment | ai` (or `status: { field }`) renders its cell's state:

  - `queued`: a clock icon, muted.
  - `running`: a spinner.
  - `ok`: the value, through the column's type.
  - `error`: a red marker, with the message in a tooltip.
  - `empty`: a muted "No result".
  - Stale (`inputHash` differs): the value, dimmed, with a refresh affordance.

  All states are tier 0: static DOM, with the tooltip mounted on hover.

- **Header progress.** Enrichment column headers show live counts ("12 running · 3 errors") from the loaded rows, or from server aggregates in server mode.
- **Add column.** `addColumn: true | { kinds }` shows a "+" at the end of the header. It opens a picker with these kinds:

  - input types
  - formula
  - each provider from `providers`, with input mapping to existing columns
  - AI, with a prompt editor that has `{{ column }}` chips
  - extract

  Submitting fires `onColumnAdd { column }`. The app stores the column and re-reads its columns.

- **Column management** for user columns (`column.userDefined: true`) is in the header menu: Rename, Edit, Duplicate, Insert left/right, Delete, and Run (all / empty / errors / stale). These fire `onColumnUpdate`, `onColumnDelete` and `onColumnRun { column, mode, selection }`.
- **Row and cell runs.**
  - The row menu has "Run row", which fires `onRowRun { rowKey, columns }`.
  - An enrichment cell's details panel has "Rerun", which fires `onCellRun`.
  - The bulk bar has "Run selected", which fires `onColumnRun` with the selection.
- **Cell details panel.** Clicking an enrichment cell, or pressing Space on it, opens a built-in side panel. It shows:

  - the status, the value, the error and the timings;
  - the inputs the value was computed from;
  - `raw` as a collapsible JSON tree.

  Every leaf and object in the tree has an "Add as column" action, which fires `onColumnAdd` with `kind: extract`.

- **Add rows.** `addRow: true` on `Table` shows a "+ New row" row at the bottom and fires `onRowAdd { values }`. `importCsv: true` adds a toolbar Import button: the CSV is parsed in the browser and headers are mapped to columns in a dialog. It fires `onImport { rows }` in batches of 500, and the app inserts them with `MongoDBInsertMany`.

### E7. Security and cost

- **Provider inputs** only accept column refs or literal values. They are validated on the server against the provider's declared inputs.
- **AI prompts** are user content. They are rendered on the server with row values escaped, and sent to the app's AI connection by the app's endpoint. The app sets the model, max tokens and rate.
- **Limits.** `MongoDBEnrichmentEnqueue` caps cells per enqueue (`maxCells`, default 10,000). The worker caps concurrency and time. A `cost` per provider can be summed and shown in the confirm dialog before a large run ("Run 2,400 cells · ~2,400 credits?").
- **Scope.** All three requests take the base `filter` and tenant scoping. The `fields` allowlist covers `_enrich.*` writes: only `status` / `value` / `raw` / `error` for the claimed column.

## Scope of the PR

1. Table `enrichment` feature (E6) + meta + e2e.
2. The three MongoDB requests (E4) + unit and real-mongod integration tests.
3. A reference app in the blocks-table e2e app: providers (a mock HTTP provider through a local endpoint, and an AI provider mocked in tests), the worker endpoint, cron, the websocket channel and a page. Plus an end-to-end e2e test against a real mongod: add a column, run it, watch the cells go queued → running → ok live, see an error with a retry, rerun, add as column, add a row with auto-run, import a CSV.
4. Docs: an `EnrichmentGuide` with the complete copy-paste config, and request docs.

## Not in scope

- Hosted providers and credits billing.
- Formulas beyond templates.
- Per-cell comments.
- Sharing tables between workspaces.
