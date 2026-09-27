# Migration: List `ClickableHtml` data events in `dataEvents`

## Context

From Lowdefy v7, a `ClickableHtml` block only fires the events its `dataEvents` property lists. A
`data-event` in the block's HTML whose name is not listed does nothing, and a click on it logs a
console warning. A block with no `dataEvents` fires no events from its HTML.

Before v7, any `data-event` in the HTML fired the block event it named. HTML is often built from
request or user data, and sanitising keeps `data-*` attributes, so markup inside that data could
fire any event the block declares. Listing the events makes the author say which ones the HTML may
fire, and lets an event require a confirmation whatever the markup says.

```yaml
# v6
- id: rows
  type: ClickableHtml
  properties:
    html: '<button data-event="onEdit" data-id="1">Edit</button>'
  events:
    onEdit: [...]

# v7
- id: rows
  type: ClickableHtml
  properties:
    dataEvents:
      - onEdit
    html: '<button data-event="onEdit" data-id="1">Edit</button>'
  events:
    onEdit: [...]
```

An entry is an event name, or `{ name, confirm }`. `confirm: true` asks before every click with the
element's `data-confirm` message or "Are you sure?"; a string is the message.

## What to Do

### Step 1: Find every ClickableHtml block

```bash
grep -rn 'type:\s*ClickableHtml' --include='*.yaml' --include='*.yml' --include='*.njk' --include='*.json' .
```

Also check local plugin code and `_js` code that builds block config at runtime.

### Step 2: Add `dataEvents` to each block

For each block, skip it when it already sets `properties.dataEvents`. Otherwise work out the
event names its HTML fires:

- **HTML written in config** (a literal string, a `_ref` template, or a `_nunjucks` template in
  config): the names in every `data-event="..."` attribute, including inside
  `data-popover-content`.
- **HTML built at runtime** (from `_request`, `_state`, `_payload`, an API response or `_js`): the
  names cannot all be read from config, so take the keys of the block's `events`, except
  `onTextSelection`, `onMount` and `onMountAsync`, which the block fires itself. Mark these in the
  report.

Add the names to `properties.dataEvents`. When there are none, add nothing.

For an event whose actions delete or change data (`CallAPI`, `Request`, `CallMethod` or
`SetState` that removes records), and whose HTML elements carry `data-confirm`, write the entry as
`{ name: onDelete, confirm: true }`, so every click on it asks even where the markup leaves out
`data-confirm`.

### Step 3: Check HTML built from data

For each block whose `html` is built from `_request`, `_state`, `_payload`, `_user` or an API
response, check that values from that data are escaped: `_nunjucks` escapes `{{ values }}` unless
they are marked `safe`, while `_string.concat` and `_js` do not escape. Report every value that is
inserted unescaped; do not change the templates.

### Step 4: Report

Produce a report with one entry per block:

- File path and line number, and the block `id`.
- The `dataEvents` added, and whether they came from `data-event` attributes in config or from
  `events` keys (HTML built at runtime).
- Events given `confirm: true`.
- Unescaped data found in Step 3.

Share the report with the app author, who should remove any listed event the HTML is not meant to
fire.

## Scope

`app`: all YAML and Nunjucks config, including shared components, modules and templates reached
through `_ref`.

## Files to Check

Glob: `**/*.{yaml,yml,njk,json}`
Grep: `type:\s*ClickableHtml`
