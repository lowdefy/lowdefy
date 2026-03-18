# Prompt 01: Rename `xxl` to `2xl`

Complexity: **Moderate** (false positive risk — `xxl` may appear as block IDs or custom data)

## Goal

Rename all `xxl` breakpoint references to `2xl` in Lowdefy YAML configs. This covers YAML keys, quoted string values, and bare values.

## Scope

Search all `.yaml` and `.yml` files in the project (excluding `.` directories and `node_modules`).

## What to Find

1. **YAML keys** -- `xxl:` at the start of a line (after optional whitespace). Examples: `  xxl:`, `xxl: { span: 4 }`
2. **Quoted strings** -- `"xxl"` or `'xxl'` as values (typically `_media` comparisons like `_eq: [_media: size, "xxl"]`)
3. **Bare values** -- `xxl` as an unquoted value after `- ` or `: ` at end of line

## How to Apply

For each file with matches:

1. Show the user every matching line with its line number and file path.
2. Ask the user to confirm no matches are false positives (block IDs, custom properties named `xxl`, or string data unrelated to breakpoints).
3. After confirmation, apply these replacements in each file:
   - `xxl:` key at start of line (preserving indent) becomes `2xl:`
   - `"xxl"` becomes `"2xl"`
   - `'xxl'` becomes `'2xl'`
   - Bare `xxl` after `- ` or `: ` at end of line becomes `2xl`

## False Positive Checklist

- A YAML key `xxl:` that is a block ID or custom property name (not a breakpoint override)
- A string value `"xxl"` stored as data (not a `_media` comparison)
- Any `xxl` inside comments (leave comments alone -- they are documentation)

## Completion

Report the number of files modified and replacements made.
