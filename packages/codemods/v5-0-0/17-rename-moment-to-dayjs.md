# 01 — Rename `_moment` to `_dayjs`

**Complexity:** Simple

Rename all `_moment` operator keys to `_dayjs` across the Lowdefy app's YAML config files.

## What to Change

The `_moment` operator is replaced by `_dayjs` in Lowdefy v5. Every YAML key that starts with `_moment` followed by `:` or `.` must be renamed to `_dayjs`.

Patterns:

| Before                      | After                      |
| --------------------------- | -------------------------- |
| `_moment:`                  | `_dayjs:`                  |
| `_moment.format:`           | `_dayjs.format:`           |
| `_moment.humanizeDuration:` | `_dayjs.humanizeDuration:` |
| `- _moment:`                | `- _dayjs:`                |
| `- _moment.diff:`           | `- _dayjs.diff:`           |

The rename applies to all `_moment` + method combinations. The method name itself does not change.

## Instructions

1. Find all `.yaml` and `.yml` files in the project (excluding `node_modules/` and hidden directories).

2. In each file, search for `_moment` used as a YAML key — that is, `_moment` followed by either `:` (standalone operator) or `.` (operator with method). It may appear after whitespace, a list dash, or at the start of a line.

3. Replace each `_moment` with `_dayjs`, preserving the rest of the line exactly.

4. Report:

   - Each file modified and the number of replacements in it.
   - Total files modified and total replacements.

5. If no matches are found, report: "No `_moment` usage found. Nothing to rename."

## Scope

- Only rename YAML keys, not arbitrary string values. The pattern `_moment` inside a quoted string value (e.g., `description: "Uses _moment for dates"`) should **not** be changed.
- Do not modify files in `node_modules/`, `.git/`, or other hidden directories.
