# Migration: Preserve `MongoDBUpdateOne` no-match behavior with `disableNoMatchError`

## Context

From Lowdefy v5.5.0, the `MongoDBUpdateOne` and `MongoDBVersionedUpdateOne` requests throw `No matching record to update.` when the filter matches no document (and `upsert` is not set). Before v5.5.0, `MongoDBUpdateOne` silently returned `matchedCount: 0`. The new default fails loudly because a no-match update usually indicates a bug — a wrong filter or a missing document.

Requests can opt out of the error with the request property `disableNoMatchError: true`.

Apps already using `@lowdefy/community-plugin-mongodb` have always had this throwing behavior and need **no changes** — for those apps this codemod is a no-op.

## What to Do

### Step 1: Check whether the app uses the community plugin

```bash
grep -rn 'community-plugin-mongodb' lowdefy.yaml lowdefy.yml package.json 2>/dev/null
grep -rn 'community-plugin-mongodb' --include='*.yaml' --include='*.yml' . | grep -i 'plugin'
```

If the app lists `@lowdefy/community-plugin-mongodb` as a plugin, **stop — no changes needed**. The app already has the throwing behavior and the same `disableNoMatchError` flag.

### Step 2: Find all MongoDBUpdateOne requests

```bash
grep -rn 'type:\s*MongoDBUpdateOne' --include='*.yaml' --include='*.yml' --include='*.njk' .
```

### Step 3: Add `disableNoMatchError: true` to each request

For every request found, add `disableNoMatchError: true` to the request `properties`, so the app behaves exactly as before the upgrade. Skip requests that:

- already set `disableNoMatchError` (either value), or
- set `upsert: true` in `options` (upserts never throw the no-match error).

### Step 4: Report

Produce a report with one entry per modified request:

- File path + line number of the request definition.
- The request `id`.
- Whether the flag was added, or why it was skipped (`upsert`, already set).

Share the report with the app author. For each request, the author should decide whether to **remove** the flag and adopt the new fail-loudly default — for most update requests the throw is the better behavior, since a silent no-op update hides bugs. The flag should only stay on requests where "update if exists" is the intended logic.

### Step 5: Verify

```bash
grep -rn -A 10 'type:\s*MongoDBUpdateOne' --include='*.yaml' --include='*.yml' --include='*.njk' . | grep -c 'disableNoMatchError\|upsert'
```

Every `MongoDBUpdateOne` request should now either set `disableNoMatchError`, set `upsert: true`, or have been deliberately left to throw by the author.

## Scope

`app` — all YAML config files including Nunjucks templates (`.yaml.njk`), shared components, module files, and API endpoint definitions. Also check directories referenced by `_ref` paths outside the main app directory (e.g., `modules/`, `shared/`). Requests can be defined on pages and in `api:` endpoints — both count.

## Files to Check

Glob: `**/*.{yaml,yml,njk}`
Grep: `type:\s*MongoDBUpdateOne`

**Do not forget `.yaml.njk` files** — Nunjucks templates contain the same request structures.

## Examples

### Before

```yaml
requests:
  - id: update_status
    type: MongoDBUpdateOne
    connectionId: orders
    properties:
      filter:
        _id:
          _state: order_id
      update:
        $set:
          status: shipped
```

### After

```yaml
requests:
  - id: update_status
    type: MongoDBUpdateOne
    connectionId: orders
    properties:
      disableNoMatchError: true
      filter:
        _id:
          _state: order_id
      update:
        $set:
          status: shipped
```

### Skipped — upsert request (never throws)

```yaml
requests:
  - id: upsert_setting
    type: MongoDBUpdateOne
    connectionId: settings
    properties:
      filter:
        key: theme
      update:
        $set:
          value: dark
      options:
        upsert: true
```

## Edge Cases

- Requests whose `properties` are built with operators (e.g., a `_ref` to a shared request file): follow the `_ref` and add the flag in the referenced file. If the referenced file is shared by multiple requests, adding the flag there changes all of them — list this in the report for author review instead of editing blindly.
- Requests with `options` set via an operator (e.g., `options: { _if: ... }`) where `upsert` cannot be determined statically: add the flag and note it in the report.
- `MongoDBVersionedUpdateOne` is new in v5.5.0, so no existing configs reference it — only `MongoDBUpdateOne` needs migration.

## Verification

```bash
grep -rn 'type:\s*MongoDBUpdateOne' --include='*.yaml' --include='*.yml' --include='*.njk' .
```

Cross-check the report against this list — every request is either modified, skipped for `upsert`, or explicitly signed off by the author to adopt the throwing default.
