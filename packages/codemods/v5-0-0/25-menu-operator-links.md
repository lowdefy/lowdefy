# Migration: \_menu Operator Returns Links Directly

## Context

The `_menu` operator now returns the `links` array directly when selecting a single menu, instead of the full menu object. It also supports dot-path access into the links array.

## What Changed

**Before (v4):** `_menu: menuId` returned the full menu object `{ menuId, links: [...] }`. To access links, you needed `_get`:

```yaml
_get:
  key: links
  from:
    _menu: profile_menu
```

**After (v5):** `_menu: menuId` returns the `links` array directly. Dot-path access is supported:

```yaml
# Get links array
_menu: profile_menu

# Dot-path access into links
_menu: profile_menu.0.pageId
```

## What to Do

### Part 1 — Simplify `_get` + `_menu` patterns (auto-fix)

Find cases where `_get` wraps `_menu` to extract `links` or access properties through `links`:

**Pattern A — extracting links:**

Before:

```yaml
_get:
  key: links
  from:
    _menu: profile_menu
```

After:

```yaml
_menu: profile_menu
```

**Pattern B — accessing through links:**

Before:

```yaml
_get:
  key: links.0.pageId
  from:
    _menu: profile_menu
```

After:

```yaml
_menu: profile_menu.0.pageId
```

### Part 2 — Direct `.links` access on `_menu` result (report-only)

Find cases that access `.links` on the `_menu` result via other operators (e.g., `_get` with a dynamic key). These need manual review since the result shape changed.

**Files to search:**

Glob: `**/*.{yaml,yml,yaml.njk}`
Grep: `_menu:`

## Edge Cases

- `_menu: true` and `_menu: { all: true }` still return the full menus array (unchanged)
- Menu IDs containing dots would conflict with path access — this is unsupported (same convention as `_state`)
- If existing code accessed `menuId` from the result (e.g., `_get: { key: menuId, from: { _menu: x } }`), that no longer works since the result is now the links array

## Verification

After applying changes, verify that menu-dependent features (profile dropdowns, navigation) still work correctly.
