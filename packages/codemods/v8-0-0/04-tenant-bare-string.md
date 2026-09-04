# Migration: Connection `tenant` takes the bare field name

## Context

From Lowdefy v8.0.0, a connection's `tenant` declaration uses the same grammar as a collection's: the bare name of the top-level field that carries the tenant id.

```yaml
# v7
tenant:
  field: organization_id

# v8
tenant: organization_id
```

`tenant: shared` is unchanged, and `tenant: none` / `tenant: authored` were never connection values — they are declared on the request, step or websocket that needs the exception.

The object form still builds in v8 and emits a `ConfigWarning` (check slug `tenant-grammar`) naming the connection; it is removed in v9. Nothing about the tenant wall's behaviour changes: the build normalises both spellings to the same internal model, so a rewritten connection scopes exactly as it did.

Why: `collections.<name>.tenant` (v8) and `connection.tenant` (v7) name the same concept in the same `lowdefy.yaml` with two different value shapes. One grammar — `shared | <fieldName>` — is one thing to learn and one thing to grep for.

## What to Do

### Step 1: Find every object-form declaration

```bash
npx lowdefy@8 build 2>&1 | grep 'is deprecated at connection'
```

The build lists every site with its `file:line`. Or grep directly:

```bash
grep -rn -A2 'tenant:' --include='*.yaml' --include='*.yml' --include='*.njk' . | grep -B1 'field:'
```

### Step 2: Rewrite each one

Replace the two-line object with the bare field name:

```yaml
# Before
- id: controls_db
  type: MongoDBCollection
  tenant:
    field: organization_id
  properties:
    collection: controls

# After
- id: controls_db
  type: MongoDBCollection
  tenant: organization_id
  properties:
    collection: controls
```

Leave `tenant: shared` exactly as it is.

### Step 3: Re-run the build

```bash
npx lowdefy@8 build 2>&1 | grep -c 'is deprecated at connection'
```

Must print `0`.

### Step 4: Report

One line per connection: the file, the connection id, and the field name that moved. Nothing here needs author judgement — if a site cannot be rewritten mechanically (the `tenant` value is an operator, or the object carries a key other than `field`), list it unresolved rather than guessing: an object with any other key was never valid and is a build error, not a rewrite.

## Scope

`app` — all YAML config files, including Nunjucks templates (`.yaml.njk`) and any `_ref`'d connection files (`connections/`, `shared/`, `modules/`).

## Files to Check

Glob: `**/*.{yaml,yml,njk}`
Grep: `tenant:`

## Examples

### Before

```yaml
connections:
  - id: answers_db
    type: MongoDBCollection
    tenant:
      field: tenant_id
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: answers
  - id: countries_db
    type: MongoDBCollection
    tenant: shared
    properties:
      collection: countries
```

### After

```yaml
connections:
  - id: answers_db
    type: MongoDBCollection
    tenant: tenant_id
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: answers
  - id: countries_db
    type: MongoDBCollection
    tenant: shared
    properties:
      collection: countries
```

## Edge Cases

- **`tenant: shared`** — not a field name, not rewritten.
- **A dotted field name** (`tenant: { field: meta.organization_id }`) was already a build error and still is: the wall stamps and matches the field as one top-level document key.
- **`tenant: true`** was removed before v8 and the build rejects it naming its replacement. Do not turn it into a bare string.
- **`collections.<name>.tenant`** already takes the bare form — leave it.
- **An operator-valued `tenant`** was never legal; the build rejects it.

## Verification

```bash
npx lowdefy@8 build 2>&1 | grep -c 'tenant-grammar\|is deprecated at connection'
```

Must print `0`. The connection artifacts under `.lowdefy/build/connections/` should be byte-identical to the pre-rewrite build apart from key ordering — the internal model is the same either way.
