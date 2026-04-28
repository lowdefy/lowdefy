# Migration: Convert AgGrid cellRenderers to built-in `cell.type`

## Context

`@lowdefy/blocks-aggrid@5.1` introduces first-class column cell renderers that cover the patterns apps hand-build today with `_function` + `__nunjucks` + HTML strings:

| `cell.type` | Replaces                                                          |
| ----------- | ----------------------------------------------------------------- |
| `tag`       | Coloured pill HTML via `color-mix`, antd Tag-style badges         |
| `avatar`    | Circle image/initials + name in a flex row                        |
| `link`      | Hand-built `<a href="/pageId?…">` anchors                         |
| `date`      | `__dayjs.format` / `__moment.format` inside `cellRenderer`        |
| `boolean`   | Conditional coloured "Yes/No" / "Verified/Unverified" text        |
| `progress`  | Conditional-colour percent pill (5-tier scale)                    |
| `number`    | `valueFormatter` + `__string.concat` for currency/percent/compact |

Plus two column-level helpers:

- `ellipsis: N` — replaces `.ellipsis-N` class + manual `wrapText` / `autoHeight`.
- `cell.align: left | center | right` — replaces manual `cellStyle.justifyContent` + `headerClass`.

## Critical: this is a **report-only** codemod

**Do not auto-rewrite any column.** Every match below is a _candidate_ for conversion. Each candidate must be:

1. **Reviewed against its data shape.** The replacement reads from a specific field (or row-data path); the original cellRenderer may have computed, fallen-back, or reshaped data inline. If the aggregation/request doesn't already deliver the exact shape the built-in renderer expects, the column either needs a projection change in the request/aggregation, or the original `_function` cellRenderer should stay.
2. **Reviewed against its enum / colour lookup.** Many tag cells read colour from `__get: { key: __args: 0.data.x, from: __global: enums.y }` — this can migrate to `cell.colorFrom: x.color` **only if** the aggregation already hydrates `data.x.color`. If the colour lookup happens inside the cellRenderer template, the request has to start returning the resolved colour, or the tag's `colorMap` has to be baked into the column config.
3. **Confirmed with the column author.** Post each proposed change to the author of the table (or the nearest code owner) and get explicit sign-off before applying. Do not batch multiple columns into a single review.

The codemod runner should produce a **report with one entry per column matched**, including:

- File path + line number of the column defintion.
- The full existing cellRenderer snippet (for context).
- The proposed `cell.type` replacement.
- The **data contract** the replacement requires (fields read, shape expected).
- A checkbox / flag for the reviewer to approve or reject the individual column.

## Files to Search

Glob: `**/*.{yaml,yml,yaml.njk}`

Narrow to files containing AgGrid blocks first:

Grep: `type:\s*AgGrid(Alpine|Balham|Material|InputAlpine|InputBalham|InputMaterial)`

Then inside each matched file, look for `columnDefs:` entries.

## Detection Patterns

Each pattern below lists:

- A recognisable HTML / operator signature.
- The proposed `cell.type` replacement.
- The **questions the reviewer must answer** before approving.

### 1. Tag / badge pill

**Signature — the 12% / 30% `color-mix` convention:**

```
px-1.5 py-0.5 rounded text-\[10px\] font-semibold.*color-mix\(in srgb,\{\{\s*color\s*\}\}\s+12%
```

Also matches variants:

- `color-mix(in srgb, {{ status.color }} 12%, transparent)`
- Inline `<span style="background:...;border:1px solid ...;color:...;">`
- Literal hex colours inside the style attribute.

**Proposed replacement:**

```yaml
cell:
  type: tag
  colorFrom: <row.data path to colour> # when colour is on the row
  # OR
  colorMap: # when colour is per-enum-value
    <value_1>: <colour>
    <value_2>: <colour>
```

**Reviewer must answer:**

- Where does the colour come from in the original — a global enum lookup, or a field on the row?
- Is the coloured value the cell's raw value, or a nested `title` / `label` field?
- Are there multiple fallback colours (e.g. `default` when enum lookup fails)? Map each to `colorMap.default` or the renderer's own default.
- Does the rendered text come straight from the cell value, or is it `value.title` / `data.xxx.label`? If not direct, the `field` on the column must point at the displayed text.

### 2. Avatar + name

**Signature:**

```
display:\s*inline-flex.*border-radius:\s*50%.*<img.*width="3[02]"
```

Also matches:

- Gray circle fallback with unicode 👤 or similar.
- `flex-shrink: 0`, `margin-right: 8px`.
- An `<a>` wrapping the image or name.

**Proposed replacement:**

```yaml
cell:
  type: avatar
  nameField: <path> # row-data path for the visible name
  srcField: <path> # row-data path for picture src (optional)
  idField: <path> # seeds initials colour
  link: # only if the original wrapped a link
    pageId: <target>
    urlQuery:
      <key>: <row-data-path>
```

**Reviewer must answer:**

- Where does the name string live? (`profile.name`, `assignee.full_name`, …)
- Where does the picture URL live, and is it nullable? (The built-in renders initials on null.)
- If wrapped in a link — what `pageId` and what `urlQuery` keys?
- Is there a distinct `id` for initials-colour seeding, or should it fall back to the name?
- If the initials fallback colour scheme in the original is brand-specific, it **doesn't** match the built-in scheme — skip conversion unless OK to change.

### 3. Link-styled cell

**Signature:**

```
cellRenderer:\s*\n\s*_function:\s*\n\s*__nunjucks:\s*\n.*<a href
```

Also matches:

- `__string.concat: ['<a href="/', __args: 0.data._id, ...]`
- Links using `_module.pageId` inside the template.

**Proposed replacement:**

```yaml
cell:
  type: link
  pageId: <target>
  urlQuery:
    <key>: <row-data-path>
```

And at the table level:

```yaml
events:
  onCellLink:
    - id: go
      type: Link
      params:
        _event: link
```

**Reviewer must answer:**

- Does the link target a `pageId` or a full `href` (external URL)?
- What are the `urlQuery` keys and their row-data paths?
- Does the original open in a new tab (`target="_blank"`)? Use `newTab: true`.
- Is the link only shown conditionally (inside a `{% if %}`)? The built-in always renders; the conditional needs to move to the data layer (null value → null placeholder).

### 4. Date / timestamp

**Signature:**

```
cellRenderer:\s*\n\s*_function:\s*\n\s*__dayjs\.format:
```

Or its moment equivalent `__moment.format`. Also matches `__string.concat` pipes that include `| date(...)` Nunjucks filter.

**Proposed replacement:**

```yaml
cell:
  type: date
  format: <format string> # defaults to 'YYYY-MM-DD HH:mm' — omit if using default
  # relative: true            # if the original used fromNow()
```

**Reviewer must answer:**

- Is the value an ISO string, a `Date`, or a millisecond number? The built-in calls `dayjs(value)` — anything dayjs can parse is fine.
- Is the format the default `YYYY-MM-DD HH:mm`? If so, drop the explicit `format` key.
- Is the original using `fromNow()` / `humanize()` / a custom relative output? Use `relative: true`.
- Timezone handling — the built-in uses local time; if the original forced UTC, preserve it or convert before passing.

### 5. Boolean / Yes-No

**Signature:**

```
cellRenderer:\s*\n\s*_function:\s*\n\s*__nunjucks:.*\{%\s*if\s+\w+\s*%\}.*<span.*color:\s*#(52c41a|[0-9a-f]+).*Yes.*<span.*No
```

Also matches patterns using `app_config.colors.success` / `var(--ant-color-success)`.

**Proposed replacement:**

```yaml
cell:
  type: boolean
  # trueLabel / falseLabel / trueColor / falseColor — override only if the original deviates
```

**Reviewer must answer:**

- Are the labels literally "Yes" / "No", or something domain-specific (`Verified`/`Unverified`, `Active`/`Inactive`)?
- What are the colours? The built-in defaults to `--ant-color-success` / `--ant-color-text-quaternary`. If the original uses brand-specific tokens, set `trueColor` / `falseColor`.
- Does the original render `—` or something else for null? The built-in renders em-dash `—` — confirm that matches.
- Does the rendered text include an icon? (✓ ✗ 👍 etc.) — **skip conversion** unless the column owner approves text-only.

### 6. Progress / percentage

**Signature — 5-tier coloured pill:**

```
\{%\s*if\s+\w+\s*<\s*20.*#dc2f02.*%\}.*\{%\s*elseif.*<\s*40.*#e85d04.*%\}
```

Also matches apps using `app_config.colors.progress_low` etc.

**Proposed replacement:**

```yaml
cell:
  type: progress
  # thresholds: [20, 40, 60, 80]        # defaults
  # colors: [<five colour tokens>]       # defaults to antd error → success scale
```

**Reviewer must answer:**

- Are the thresholds exactly `[20, 40, 60, 80]`? If not, set `thresholds`.
- Are the colours the same antd error → warning → gold → info → success? If the original used brand colours, set `colors` array (length = thresholds.length + 1).
- Is the value already a 0–100 number, or a 0–1 fraction? If fraction, either multiply in the aggregation or use `cell.type: number` with `format: percent` instead.
- Is there a null / unstarted label other than "None"? Use `nullLabel`.

### 7. Number formatting

**Signature:**

```
valueFormatter:\s*\n\s*_function:\s*\n.*__string\.concat:
```

Or manual `Intl.NumberFormat` / `toLocaleString` usage, or hand-built percent with `%` suffix.

**Proposed replacement — pick by shape:**

```yaml
# Currency
cell:
  type: number
  format: currency
  currency: USD
  decimals: 0

# Accounting (negatives in parens, green/red)
cell:
  type: number
  format: currency
  currency: USD
  decimals: 2
  negative: parentheses
  signColor: true

# Percent
cell:
  type: number
  format: percent
  decimals: 1

# Compact (K/M/B)
cell:
  type: number
  format: compact
```

**Reviewer must answer:**

- Is the raw value the final number, or a string (e.g. `'12,345.67'`)? `cell.type: number` expects a number — coerce in the aggregation if needed.
- For percent: is the field a fraction (0.184) or a 0-100 integer (18.4)? `Intl.NumberFormat` with `style: 'percent'` **multiplies by 100** — adjust the field or use `format: number` + `suffix: '%'`.
- For currency: which currency, locale, and decimal precision? Make sure the currency code is ISO 4217.
- Does the original right-align? The built-in auto-right-aligns numbers — confirm this matches the column's visual intent. Override via `align: left` if needed.
- Does the original colour negatives red / positives green? Set `signColor: true`.

### 8. Ellipsis / truncated text

**Signature:**

```
cellRenderer:\s*\n\s*_function:\s*\n\s*__string\.concat:\s*\n.*ellipsis-\d
```

Also matches bare `class="ellipsis-4"` / `class="ellipsis-2"` patterns inside any cellRenderer.

**Proposed replacement:**

```yaml
ellipsis: <N> # column-level; omit cellRenderer entirely
```

(Automatically sets `wrapText: true` + `autoHeight: true` + applies the line-clamp.)

**Reviewer must answer:**

- Is the content plain text, or HTML? The built-in ellipsis renderer treats the value as text — if the original included formatting, this path doesn't fit. Keep the custom renderer.
- Does the original wrap a **tag** or **link** inside the clamp? `ellipsis: N` only wraps plain values — for rich-cell clamping, skip this conversion.
- Line count: 1, 2, 3, 4, 5, or 6? Only those counts are supported.

### 9. Header & cell alignment

**Signature:**

```
headerClass:\s*ag-right-aligned-header
cellStyle:\s*\n.*justifyContent:\s*flex-end
```

**Proposed replacement:**

```yaml
cell:
  type: <existing type or number>
  align: right
```

Remove the explicit `headerClass` and `cellStyle.justifyContent`.

**Reviewer must answer:**

- Did the original set both cell and header alignment consistently? If only one side was aligned, the unified `align:` key changes visible behaviour — confirm.

## Column-level guardrails the codemod MUST emit alongside every proposal

For every column flagged as a conversion candidate, the report entry must include:

1. **"Field contract" block** — list every row-data path the built-in renderer will read, with a note whether the current aggregation/request delivers that shape. If unknown, mark as "needs aggregation inspection".
2. **"Visual parity" warning** — remind the reviewer to compare a few rows before/after to confirm padding, colours, row height, and null handling are acceptable.
3. **"Dark-mode check"** — new renderers use antd tokens; if the old hand-built HTML used hard-coded hex, dark mode may look different (usually better, occasionally surprising).
4. **"Sort / filter / CSV export"** — `cellRenderer` does not affect `valueGetter` / `valueFormatter` used by sort / filter / export. The built-in renderers _display_ only. If the original used a `cellRenderer` that also transformed the value, check that sort/filter/export still behave correctly.
5. **"Events"** — if the column participated in `onCellClick` with behaviour branching on column, migrating to `cell.type: link` + `onCellLink` is usually cleaner but changes the event shape. Audit event handlers.

## Apply workflow (per column)

1. Run the codemod in report mode. Output goes to a reviewable file (Markdown or JSON), one section per matched column.
2. For each section, the reviewer answers the questions above and either:
   - **Approves** → manually apply the proposed `cell:` block in the column def.
   - **Defers** → leave the column's custom cellRenderer untouched.
   - **Requires data change** → log a ticket to adjust the aggregation / request to hydrate the field shape the built-in needs, then revisit.
3. After conversion, remove the now-unused `_function` / `__nunjucks` / `__dayjs.format` blocks and any `valueFormatter` that only formatted for display.
4. Test the page in the browser — confirm visual parity and that click/sort/filter/export behave identically.
5. Commit per-column (small, reviewable diffs) so a regression can be isolated quickly.

## What to NOT convert

- **Cells with conditional visual branching** (showing a completely different shape when `status == 'error'` vs default). The built-ins are single-shape.
- **Cells that compose multiple widgets** (avatar + status dot + text + link + icon). Split into separate columns, or keep the custom renderer.
- **Cells driven by a request that isn't yet aggregated** (e.g. the colour / icon is computed in Nunjucks from a `_global` that's not on the row). Either pre-compute in the aggregation or keep.
- **Cells where the `cellRenderer` also mutates `params` for ag-grid's internal sort/filter**. The built-ins only render — they don't touch value semantics.
- **Cells inside an `AgGridInput*`** where the cell is editable. The built-ins render display-only output; for editable cells, keep your custom `cellRenderer` / `cellEditor`.

## Verification

For each converted column:

```
pnpm --filter=@lowdefy/blocks-aggrid build
pnpm ldf:b
pnpm ldf:d
```

Navigate to the page, verify the column visually matches the prior output, click-test, sort-test, filter-test, export-test. Capture a before/after screenshot for the PR.

## Non-goals of this codemod

- No auto-apply. Ever. Even the "safe" conversions (date, ellipsis) require author confirmation because the data contract may differ.
- No bulk commit. One PR = one column, one reviewer sign-off.
- No cross-file refactors. If multiple tables share a module that currently returns HTML, migrate the module call-sites first, then the module itself in a follow-up.
