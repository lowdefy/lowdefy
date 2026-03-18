# Prompt 04: Rename `layout.align` to `layout.selfAlign`

Complexity: **Moderate** (ambiguous context -- requires structural analysis)

## Goal

Rename `align:` to `selfAlign:` when it appears as a child of a `layout:` block. This property controlled block self-alignment in the parent row; the new grid system renames it to avoid collision with content `align`.

## Prerequisites

Run **after** prompt 03. Prompt 03 renames `contentAlign` to `align`. After that step, any `align:` that was _already_ present under `layout:` (before the content-prefix rename) is a self-alignment property and should become `selfAlign:`.

## Scope

Search all `.yaml` and `.yml` files in the project (excluding `.` directories and `node_modules`).

## What to Find

`align:` as a YAML key that appears indented under a `layout:` parent block. Use indentation tracking:

1. Scan lines. When you encounter `layout:` as a key, record its indent level.
2. Subsequent lines indented deeper than the `layout:` key are children of that block.
3. When a non-empty, non-comment line appears at the same or lesser indentation, the `layout:` block has ended.
4. Within the `layout:` block, any `align:` key (at child indentation) is a candidate.

Skip blank lines and comment lines when tracking block boundaries.

## How to Apply

For each file with matches:

1. Show the user every matching `align:` line with its line number, file path, and surrounding context (2-3 lines above and below).
2. Explain the ambiguity: after prompt 03, both old self-alignment `align:` and newly-renamed content `align:` (from `contentAlign`) exist. Only the old self-alignment instances should become `selfAlign:`.
3. Ask the user to confirm each match. Typical heuristic: if `align:` is directly under `layout:` on a block definition (not in a `slots:` or area config section), it is self-alignment.
4. After confirmation, replace confirmed `align:` lines with `selfAlign:` (preserving indent).

## False Positive Checklist

- `align:` that was just renamed from `contentAlign:` by prompt 03 (content area alignment -- should stay as `align:`)
- `align:` in area or slot config (not under `layout:` -- should stay as `align:`)

## Completion

Report the number of files modified and replacements made.
