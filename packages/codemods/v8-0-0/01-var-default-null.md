# Migration: An unsupplied string-form `_var` is now a build error

## Context

From Lowdefy v8.0.0, the string form of the `_var` operator requires the var to be supplied by the `_ref` that loads the file.

- `{ _var: title }` — **required**. If the loading `_ref` did not supply `title`, the build fails with:

  ```
  _var "title" is not supplied. It is read in "templates/card.yaml", which is loaded by the _ref at "pages/home.yaml:12" resolving to "templates/card.yaml". Add "title" to that _ref's vars, or write { _var: { key: title, default: null } } to make it optional. Supplied vars: titel, body.
  ```

- `{ _var: { key: title, default: null } }` — **optional**. Resolves to `null` when the var is not supplied. This is now the only way to write an optional var read.

Before v8.0.0 an unsupplied string-form `_var` silently resolved to `null`, so a typo in a var name (`titel` for `title`) rendered a template with a missing value and no error. The object form without a `default` key is also an error now: the key must be present, so `{ _var: { key: title } }` is required and `{ _var: { key: title, default: null } }` is optional.

A var supplied as `null` counts as supplied — only a var the `_ref` never wrote at all is missing.

`_module.var` is unchanged: module vars have their own typed declarations and their own resolution.

## What to Do

### Step 1: Build the app and collect every missing-var error

```bash
npx lowdefy@8 build 2>&1 | tee build-output.txt
grep -n 'is not supplied' build-output.txt
```

The build collects all of these errors in one run, so a single build lists every site. Each error names:

- the var key that was read,
- the file the read is in,
- the `_ref` (file + line number) that loaded that file, and the path it resolves to,
- `Supplied vars:` — the var names that `_ref` did supply.

### Step 2: For each error, choose one of two rewrites

**(a) The name is a typo, or the var was simply forgotten → add it to the naming `_ref`'s `vars`.**

Compare the missing key against the `Supplied vars:` list in the error. A near-match (`titel` vs `title`) is a typo: fix whichever side is wrong. If the var is genuinely absent from the `_ref`, add it there with the value the template needs.

**(b) The read is legitimately optional → rewrite it to the object form with `default: null`.**

This is correct when the surrounding config already handles `null` — the value sits under an `_if_none`, is the argument of a `visible:`, is an optional block property, or is a var forwarded to a nested `_ref` that also treats it as optional. Rewriting to `default: null` preserves the pre-v8 behaviour exactly.

```bash
# Locate the read site named by the error
grep -rn '_var: <key>' --include='*.yaml' --include='*.yml' --include='*.njk' .
```

Do **not** blanket-apply (b). Every site that is really a typo must be fixed as (a) — the whole point of the change is that (a) used to be silent.

### Step 3: Re-run the build

```bash
npx lowdefy@8 build 2>&1 | grep 'is not supplied'
```

Repeat until no errors remain. Fixing one site can reveal another in a file that previously failed earlier in the walk.

### Step 4: Report

Produce a report with one entry per site:

- File path + line number of the `_var` read.
- The var key.
- The `_ref` named in the error (file + line).
- The rewrite chosen — **add to `_ref` vars** or **`default: null`** — and **why** (the `Supplied vars:` near-match that identified the typo, or the `_if_none` / `visible:` / optional property that makes `null` safe).

Any site where neither rewrite is clearly right — the template's intent is ambiguous, or the `_ref` is shared by callers that disagree about whether the var applies — goes to the app author unresolved, listed with what was found. Do not guess.

## Scope

`app` — all YAML config files including Nunjucks templates (`.yaml.njk`), shared components, module files, and API endpoint definitions. Also check directories referenced by `_ref` paths outside the main app directory (e.g., `modules/`, `shared/`, `templates/`).

## Files to Check

Glob: `**/*.{yaml,yml,njk}`
Grep: `_var`

**Do not forget `.yaml.njk` files** — Nunjucks templates are where most `_ref` templates with vars live. A `{% if %}` guard in a template hides a `_var` read from the build only when the guard is false for every caller, so a read inside a guard can still fail.

## Examples

### Before — typo, fixed by (a)

```yaml
# pages/home.yaml
- _ref:
    path: templates/card.yaml
    vars:
      titel: Welcome
```

```yaml
# templates/card.yaml
properties:
  title:
    _var: title
```

### After — (a)

```yaml
# pages/home.yaml
- _ref:
    path: templates/card.yaml
    vars:
      title: Welcome
```

### Before — optional read, fixed by (b)

```yaml
# templates/card.yaml
- id: warning
  type: Alert
  visible:
    _not:
      _not:
        _var: warning
  properties:
    message:
      _var: warning
```

### After — (b)

```yaml
# templates/card.yaml
- id: warning
  type: Alert
  visible:
    _not:
      _not:
        _var:
          key: warning
          default: null
  properties:
    message:
      _var:
        key: warning
        default: null
```

## Edge Cases

- **`{ _var: { key: x } }` with no `default` key** errors identically. Add `default: null` if the read is optional. `{ key: x, default: null }` keeps returning `null` — only the missing `default` key is new.
- **A var supplied as `null`** (`vars: { title: null }`) is supplied and does not error. Leave those `_ref`s alone.
- **A shared template loaded by several `_ref`s** where only some supply the var: rewrite the read to `default: null` rather than adding a dummy value to the `_ref`s that do not have one — unless every caller should supply it, in which case fix all callers and leave the read required.
- **Computed var names** (`{ _var: { _build.string.concat: [...] } }`) resolve to a key at build time and error the same way when that key is unsupplied. The fix is on the resolved name.
- **`_module.var` reads are unaffected** — do not rewrite them.

## Verification

```bash
npx lowdefy@8 build 2>&1 | grep -c 'is not supplied'
```

Must print `0`. Then check the app renders: every site rewritten to `default: null` now renders `null` where it previously rendered `null` silently, so behaviour is unchanged; every site fixed as (a) now renders the value it always should have.
