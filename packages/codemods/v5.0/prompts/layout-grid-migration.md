# Layout Grid Migration Codemod

Migrate a Lowdefy app from antd-style layout config to the new Tailwind-compatible grid.

## What Changes

| Change                  | Before                            | After                              | Automated?       |
| ----------------------- | --------------------------------- | ---------------------------------- | ---------------- |
| Area gap property       | `gutter: 16`                      | `gap: 16`                          | Yes (script 14)  |
| Content gap inheritance | `contentGutter: 16`               | `gap: 16`                          | Yes (14 + 15)    |
| Content alignment       | `contentAlign: middle`            | `align: middle`                    | Yes (script 15)  |
| Content justify         | `contentJustify: center`          | `justify: center`                  | Yes (script 15)  |
| Content direction       | `contentDirection: column`        | `direction: column`                | Yes (script 15)  |
| Content wrap            | `contentWrap: nowrap`             | `wrap: nowrap`                     | Yes (script 15)  |
| Content overflow        | `contentOverflow: auto`           | `overflow: auto`                   | Yes (script 15)  |
| Self-alignment          | `layout: { align: top }`          | `layout: { selfAlign: top }`       | Semi (script 16) |
| Layout breakpoint key   | `layout: { xxl: { span: 4 } }`    | `layout: { 2xl: { span: 4 } }`     | Yes (script 13)  |
| Gap responsive key      | `gap: { xxl: 30 }`                | `gap: { 2xl: 30 }`                 | Yes (script 13)  |
| `_media` comparison     | `_eq: [_media: size, "xxl"]`      | `_eq: [_media: size, "2xl"]`       | Yes (script 13)  |
| `_switch` case key      | `xxl: { padding: 100 }`           | `2xl: { padding: 100 }`            | Yes (script 13)  |
| Breakpoint pixel values | sm=576, lg=992, xl=1200, 2xl=1600 | sm=640, lg=1024, xl=1280, 2xl=1536 | N/A (behavioral) |
| `span: 0` behavior      | Full width (bug)                  | Hidden (fixed)                     | N/A (behavioral) |

## Usage

Run this in the root of your Lowdefy app directory.

## Workflow

### Step 1: Pre-flight Check

Verify the app is a Lowdefy project:

```bash
ls lowdefy.yaml 2>/dev/null || ls lowdefy.yml 2>/dev/null
```

If not found: "This doesn't appear to be a Lowdefy app directory. Run from the root of your Lowdefy project."

Check for uncommitted changes:

```bash
git status --porcelain
```

If changes exist, warn: "You have uncommitted changes. Commit or stash before running migration so you can review the diff cleanly."

### Step 2: Rename `gutter` → `gap` (Automated)

Run in dry-run mode first:

```bash
node v5.0/scripts/14-rename-gutter-to-gap.mjs .
```

Present output. If matches found, apply:

```bash
node v5.0/scripts/14-rename-gutter-to-gap.mjs --apply .
```

Report: "`gutter` → `gap` and `contentGutter` → `contentGap` applied to N file(s)."

### Step 3: Drop `content*` Prefix (Automated)

Run in dry-run mode first:

```bash
node v5.0/scripts/15-rename-content-prefix.mjs .
```

Present output. If matches found, apply:

```bash
node v5.0/scripts/15-rename-content-prefix.mjs --apply .
```

Report: "`contentGutter` → `gap`, `contentAlign` → `align`, `contentJustify` → `justify`, `contentDirection` → `direction`, `contentWrap` → `wrap`, `contentOverflow` → `overflow`, `contentGap` → `gap` applied to N file(s)."

### Step 4: Rename `layout.align` → `layout.selfAlign` (Semi-Automated)

Run in dry-run mode first:

```bash
node v5.0/scripts/16-rename-align-to-selfAlign.mjs .
```

Present the output to the user. This script finds `align:` keys under `layout:` blocks that are NOT preceded by `contentAlign` (those are handled by script 15). After script 15 runs, any remaining `align:` under `layout:` is a self-alignment candidate.

**Important:** The script cannot distinguish with 100% certainty between:

- Old `layout.align` (self-alignment in parent row) — should become `selfAlign`
- Direct area config `align` (content area alignment) — should stay as `align`

Review each match with the user. Typical heuristic: if `align` is directly under `layout:` on a block (not in `slots:` config), it's self-alignment → rename to `selfAlign`.

Ask the user to confirm, then apply:

```bash
node v5.0/scripts/16-rename-align-to-selfAlign.mjs --apply .
```

### Step 5: Rename `xxl` → `2xl` (Semi-Automated)

Run in dry-run mode first:

```bash
node v5.0/scripts/13-rename-xxl-to-2xl.mjs .
```

Present the output to the user. If matches found, review each file listed:

- **YAML keys `xxl:`** — Almost certainly breakpoint overrides in `layout:` or `gap:` config. Safe to rename.
- **String values `"xxl"`** — Likely `_media` size comparisons. Verify they're comparing against the `_media` operator, not storing the literal string "xxl" as data.

Ask the user to confirm, then apply:

```bash
node v5.0/scripts/13-rename-xxl-to-2xl.mjs --apply .
```

### Step 6: Behavioral Changes Advisory

After the automated renames, inform the user about behavioral changes that don't have a codemod:

**Breakpoint pixel value shifts:**

> The responsive breakpoints now use Tailwind v4 defaults instead of antd values. Most layouts won't be visibly affected — `md` (768px) is unchanged and is the most commonly used breakpoint. The differences at other breakpoints are small:
>
> - `sm`: 576px → 640px (+64px)
> - `lg`: 992px → 1024px (+32px)
> - `xl`: 1200px → 1280px (+80px)
> - `2xl`: 1600px → 1536px (-64px)
>
> If your app has layouts that depend on exact breakpoint thresholds, test on devices near these widths.

**`span: 0` bug fix:**

> Previously, `span: 0` was treated as `span: 24` (full width) due to a JavaScript truthiness bug. It now correctly hides the block (`display: none`). If you intentionally used `span: 0` to mean full width, change it to `span: 24`.

Search for `span: 0` usage:

```bash
grep -rn 'span:\s*0\b' . --include='*.yaml' --include='*.yml'
```

If matches found, check each file and ask the user whether `span: 0` was intentional (should be `span: 24`) or a hide intent (correct as-is).

### Step 7: Migration Report

After all steps, summarize:

- Files modified by each script (gutter→gap, content\*→unprefixed, align→selfAlign, xxl→2xl)
- Any `span: 0` instances found and their resolution
- Reminder about behavioral breakpoint shifts

"Migration complete. Review changes with `git diff` and test your app."
