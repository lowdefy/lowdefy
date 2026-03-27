# Migration: Rename `areas` → `slots`

## Context

The `areas` key on container blocks is renamed to `slots` in Lowdefy v5. Both names work during the deprecation period, but `slots` is the canonical name going forward. The build emits a `ConfigWarning` for every `areas:` usage that will become an error in production builds.

## What to Do

In **all** config files (YAML, YML, and Nunjucks templates), rename `areas:` keys on blocks to `slots:`. This is a direct key rename — the structure underneath stays identical.

### Step 1: Find all occurrences

```bash
grep -rn '^\s*areas:' --include='*.yaml' --include='*.yml' --include='*.njk' .
```

### Step 2: Rename `areas:` → `slots:`

For each match, rename the key. The indentation and everything underneath stays identical:

```
areas:        →  slots:
```

**Important:** Only rename `areas:` that is a YAML key at block level (sibling of `type:`, `properties:`, `events:`, `blocks:`, etc.). Do NOT rename:

- `areas` inside string values (e.g., `title: 'Configure areas'`)
- `areas` inside operator expressions (e.g., `_get: block.areas`)
- `areas` in `_ref` paths or markdown content
- `areas` that appear as a property value (e.g., `name: areas`)

### Step 3: Verify

```bash
grep -rn '^\s*areas:' --include='*.yaml' --include='*.yml' --include='*.njk' .
```

All matches should be zero (or only inside string content / code blocks, not as YAML keys).

## Scope

`app` — all YAML config files including Nunjucks templates (`.yaml.njk`), shared components, and module files. Also check any directories referenced by `_ref` paths outside the main app directory (e.g., `modules/`, `shared/`).

## Files to Check

Glob: `**/*.{yaml,yml,njk}`
Grep: `^\s*areas:`

**Do not forget `.yaml.njk` files** — Nunjucks templates are YAML with template logic and contain the same block structures. They are often in `shared/`, `templates/`, or `modules/` directories.

## Examples

### Before

```yaml
- id: my_card
  type: Card
  areas:
    content:
      blocks:
        - id: title
          type: Title
```

### After

```yaml
- id: my_card
  type: Card
  slots:
    content:
      blocks:
        - id: title
          type: Title
```

### Before — Nunjucks template

```yaml
# shared/layout.yaml.njk
- id: {{ pageId }}_page
  type: PageSiderMenu
  areas:
    header:
      blocks:
        _ref: templates/header.yaml
    content:
      blocks:
        _var: content
```

### After

```yaml
# shared/layout.yaml.njk
- id: {{ pageId }}_page
  type: PageSiderMenu
  slots:
    header:
      blocks:
        _ref: templates/header.yaml
    content:
      blocks:
        _var: content
```

## Edge Cases

- **Nunjucks templates (`.yaml.njk`)**: These are YAML files with Nunjucks template logic (`{% if %}`, `{{ var }}`). They contain the same `areas:` keys as regular YAML and must be renamed
- **Shared/module directories**: If your app uses `_ref` to include files from `shared/`, `modules/`, or other directories outside `app/pages/`, those files also need updating
- **Multiple `areas:` in one file**: A file may contain multiple blocks with `areas:` — rename all of them
- Only rename `areas:` that are direct children of a block (at the same indent level as `type:`, `properties:`, `events:`, etc.)
- Do not rename `areas` inside string values, operator expressions, `_ref` paths, or markdown/code blocks

## Verification

```bash
grep -rn '^\s*areas:' --include='*.yaml' --include='*.yml' --include='*.njk' .
```

All matches should be zero (or only inside string content that is not a YAML key).
