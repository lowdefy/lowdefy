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
| `formula`    | from other columns                 | in the browser, a template cell | `template` (`{{ column }}` placeholders only, filled in as text)                                     |
| `enrichment` | a provider call per row            | the server worker               | `provider`, `inputs: { param: { column } \| { value } }`, `output` (path into the result), `autoRun` |
| `ai`         | an AI prompt per row               | the server worker               | `prompt` (`{{ input }}` placeholders only), `provider?` (default `ai`), `output`, `autoRun`          |
| `extract`    | a path into another column's `raw` | in the browser                  | `source` (column key), `path`                                                                        |

An ai column's `output` is `{ type, options? }`, a Table column type the answer can be: `text`, `number`, `boolean`, `tag` or `tags` (`options`, the answers allowed, only for `tag` and `tags`). The picker, the Table, the claim and the AI endpoint all use this list.

**Templates are placeholders, never a template engine.** Formula templates and AI prompts are user content shared between users: a nunjucks template runs code (`{{ range.constructor("...")() }}`), in every viewer's browser for a formula and on the server for a prompt. Both only take `{{ column }}` placeholders (a key or a dot path into its value, one pattern on the client and the server) and are filled in by plain substitution, in one pass, so a row value that looks like a template stays text. A template with tags (`{% %}`), comments (`{# #}`) or expressions (`{{ a | upper }}`) is refused when the column is saved (the picker and the app's column check) and when it is read (the Table's column core). Declared `html` cells keep nunjucks: their templates are config, not user content.

**User-defined columns fail on their own.** A column with `userDefined: true` is runtime data; if its config is invalid (an unknown provider or output type, an input or source column that is gone, a formula cycle) it renders as an error column: its cells show "Invalid column: <reason>", its header is marked, and its header menu offers Edit column and Delete column. A declared column's config error still throws. A user-defined column only takes text-safe config: a type from the Table's `userColumnTypes` (no `html`, `image`, `avatar`, `people`, `link`, `relation` or actions, which would render markup or load URLs from other users' data in every viewer's browser), and no `cell`, `rules`, `validate` or template tooltip. The picker offers the same types and the app's column check refuses others for every kind.

**Inputs read stored values only.** An enrichment or ai input (`{ column }`, or a prompt placeholder) reads an input or data column (a field of the `fields` allowlist) or an enrichment or ai column (`_enrich.<key>.value`, once ok). Formula and extract columns compute in the browser and are never stored, so the server can not resolve them: the picker does not offer them as provider inputs or prompt chips (`isEnrichmentInputColumn`, blocks-antd's table core), the Table's column core refuses them (a declared column throws, a user-defined one becomes an error column), `resolveInputSources` refuses them in the three requests, and the reference app's `check_column` refuses them when a column is saved. A formula template can still read any column.

A waterfall is an enrichment column whose provider tries several sources in order. The provider's own endpoint runs the waterfall, so the table stays simple.

### E3. Providers are a catalogue the app declares, not URLs users type

The `providers` property is a list: `[{ id, title, description, icon, inputs: [{ key, title, type, required }], outputs: [{ path, title, type }], cost? }]`.

- Each provider maps, on the server, to an API endpoint `enrich_<id>` that takes `{ inputs, prompt?, output? }` and returns `{ status, value?, raw?, error?, retry? }`.
- In the add-column picker, users choose a provider and map its inputs to columns.
- A column can therefore only call what the app exposes. That prevents SSRF, keeps keys out of the browser and makes cost controllable.
- The AI kind is a provider too: the built-in `ai` entry maps to the app's `enrich_ai` endpoint, which calls an AI connection with the prompt, its placeholders filled in with the cell's inputs. An ai column may name another provider (`provider`); a catalogue entry with id `ai` replaces the built-in one in the picker.

### E4. The run queue: three MongoDB requests and one worker endpoint

All three requests (`connection-mongodb`) share `MongoDBTableQuery`'s safety rules: a `fields` allowlist, the base `filter`, tenant scoping and limits. Endpoints read `columnDefs` and build `fields` on the server (declared columns and fields, plus the stored user columns; user input columns keep their values under `values.<key>`, the Table's `inputFieldPrefix`), never from the browser's payload.

- **`MongoDBEnrichmentEnqueue`** marks cells queued in one `updateMany`.
  - It takes `{ columns: [key], selection (row keys, or the table's `{ all, except, filter, search }`), mode: all | empty | errors | stale }`, plus `columnDefs` for the inputs.
  - It never re-queues a cell that is queued or running with a live lease.
  - For `stale` it compares `inputHash`, computed on the server from each row's current inputs.
  - Rows whose inputs are missing get `status: empty` with `error: 'Missing input: <column>'` instead of queueing.
  - Columns are planned upstream first. A cell whose required enrichment input is queued by the same call, or is queued or running already, is queued with `waitingFor: [<column>]` and out of claims (a far `queuedAt`) until that input finishes, never "Missing input".
- **`MongoDBEnrichmentClaim`** atomically claims up to `limit` queued cells, oldest first. Each claim sets `running`, a lease (`leaseUntil`) and increments `attempts`. Cells whose lease has expired while `running` are claimed again. It returns `[{ rowKey, columnKey, kind, title, provider, prompt, output, row, inputs, attempt, claimToken }]`, with the inputs resolved from `columnDefs` and the column config a worker needs, so the worker never rebuilds a map of the columns. A cell whose input is queued or running again waits for it (`waitingFor`), as in an enqueue. A cell the claim finishes itself (a lease out of attempts, a missing input) releases the cells waiting for it, as Complete does.
- **`MongoDBEnrichmentComplete`** writes the results `[{ rowKey, columnKey, runId, status, value, raw, error }]`.
  - It only applies a result if the cell's `claimToken` still matches, so a stale worker can't overwrite a newer run. The token carries the hash of the inputs the worker was given, and that is the `inputHash` stored with the result.
  - An error below `maxAttempts` goes back to `queued` with a backoff (`queuedAt` moved into the future).
  - After writing, it releases the row's cells waiting for a cell that finished for good, and queues the downstream `autoRun` columns an ok cell feeds (the waterfall between columns). Queued with the result rather than by the worker afterwards, a crash between the two can not lose them. `downstream` in the response names them.
  - `error: null` and `retry: null` (what `_step` gives for a missing key) are the same as leaving them out.
  - A result's `cost` (integer micro-USD) is stored as the cell's `cost`, and an error result's `retryAfterMs` (a provider's Retry-After) replaces the exponential backoff, at most a day.
- **The worker is a Lowdefy API endpoint** (`enrichment_worker`), written in YAML:

  1. Claim a batch.
  2. Call the provider endpoint for each cell with `:parallel_for`, grouped by provider, each group with its own `:concurrency`.
  3. Complete each cell (which queues its downstream columns).
  4. Loop until nothing is claimed or a time budget is spent.

  Expected errors a `:catch` handles (`RequestError`, `ServiceError`, `UserError`: a provider's 404 in a waterfall) are logged at debug, not as errors. A caught `ConfigError`, `OperatorError` or `LowdefyInternalError` still goes through `handleError`.

  The errors it stores are shown to every user of the table, so the worker's `:catch` and the provider endpoints store user-safe messages mapped from the thrown error's status (`Provider error (500)`, `Rate limited by the provider (429)`, `The provider did not respond`), never the connection's message (which names the connection and carries the service's response); the full error stays in the server log. The cell's tooltip shows "Failed after <attempts> attempts" and the message shortened (`formatRunError`), the details panel the whole message.

  A cron entry runs it every minute. An enqueue also calls it as a detached endpoint, so results start at once. A run survives a crash through leases.

### E5. Live updates

A websocket channel (`enrichment`) uses a `MongoDBChangeStream` source on the rows collection, filtered to `_enrich` changes and scoped by tenant. The page subscribes, and `onMessage` calls the table's `applyTransaction({ update })` with each change's `fullDocument` (projected to the table's fields, `_enrich` whole). The default shallow merge replaces each top-level field, so cell keys the server unset (`value`, `raw`, `inputHash` after an empty rerun) go from the row too; `merge: 'deep'` is for partial patches only and never removes a key. The stream matches updates whose updated or removed fields touch `_enrich`. Only the changed rows re-render, and there is no polling.

### E6. Table features (a new `enrichment` feature module in blocks-table)

The module is an optional feature: it loads in its own chunk only for tables with enrichment, ai, extract, `status` or user-defined columns, `providers`, `addColumn`, `addRow` or `importCsv` (formula columns alone do not need it: the shared column core reads them), and its column picker, details panel and CSV import dialog load on first use, preloaded on hover or focus.

- **Cell run state.** A column with `kind: enrichment | ai` (or `status: { field }`) renders its cell's state:

  - `queued`: a clock icon, muted.
  - `running`: a spinner.
  - `ok`: the value, through the column's type.
  - `error`: a red marker, with "Failed after <n> attempts" and the message (shortened) in a tooltip below the cell.
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

- **Add rows.** `addRow: true` on `Table` shows a "+ New row" row at the bottom and fires `onRowAdd { values }`. `importCsv: true` adds a toolbar Import button: the CSV is parsed in the browser (`readCsvFile`: at most 50 MB and 100,000 rows, parsed in slices with a pause between them, fields cut with slices) and headers are mapped to columns in a dialog. It fires `onImport { rows, newColumns }` in batches of 500, and the app inserts them with `MongoDBInsertMany`. Every value in `onRowAdd` and `onImport` is at its column's field path; new input columns (from the picker or a CSV header) carry their `field`, under the Table's `inputFieldPrefix` (for example `values.<key>`).

### E7. Security and cost

- **Provider inputs** only accept column refs or literal values. They are validated on the server against the provider's declared inputs.
- **AI prompts** are user content. They are never rendered with a template engine: the app's endpoint fills their `{{ input }}` placeholders with the cell's inputs by plain substitution and sends the prompt to the app's AI connection. Prompts with template tags, comments or expressions are refused when the column is saved. The app sets the model, max tokens and rate.
- **Formula templates** are user content too, rendered in every viewer's browser, so they follow the same rule: placeholders only, no template engine.
- **Limits.** `MongoDBEnrichmentEnqueue` caps cells per enqueue (`maxCells`, default 10,000). The worker caps concurrency and time. A `cost` per provider can be summed and shown in the confirm dialog before a large run ("Run 2,400 cells · ~2,400 credits?").
- **Scope.** All three requests take the base `filter` and tenant scoping. The `fields` allowlist covers `_enrich.*` writes: only `status` / `value` / `raw` / `error` for the claimed column.

### E8. treg as a provider backend

`@lowdefy/connection-treg` (`code-docs/plugins/connections/treg.md`) calls treg's catalog and routed endpoints. A treg-backed provider endpoint maps its inputs to a `TregCall` and returns `{ status, value, raw, cost }`, with `cost` from `cost.micro` (`X-Treg-Cost-Micro`); a routed miss is `empty`, a 402 is a final error, and a 429 or 503 `ServiceError` is rethrown so the worker completes the cell with `retry` and `retryAfterMs` (`_error: retryAfter` × 1000). The worker sends `idempotencyKey: runId:columnKey:rowKey:inputHash`, the same on every attempt at a cell within a run (the claim token changes per attempt), so a retry replays an answer treg already charged for at no cost. The reference app's `find_work_email_treg` provider does this against a treg mock (`tests/treg.e2e.spec.js`).

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
