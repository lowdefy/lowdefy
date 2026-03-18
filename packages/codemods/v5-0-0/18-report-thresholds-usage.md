# 02 — Report `thresholds` Usage

**Complexity:** Moderate

Find `thresholds` parameter usage inside `_moment.humanizeDuration` or `_dayjs.humanizeDuration` blocks and advise on removal.

## Background

In Lowdefy v5, the `thresholds` parameter on `humanizeDuration` is accepted but **ignored**. Dayjs supports only global thresholds (identical to moment's defaults). Per-call custom thresholds have no effect.

## Instructions

1. Find all `.yaml` and `.yml` files in the project (excluding `node_modules/` and hidden directories).

2. In each file, search for `_moment.humanizeDuration` or `_dayjs.humanizeDuration` blocks that contain a `thresholds:` key. The `thresholds:` key appears as an indented child of the `humanizeDuration` operator block.

3. For each match found:

   - Record the file path, line number of the `humanizeDuration` call, and line number of the `thresholds` key.
   - Read the surrounding context (the humanizeDuration block plus a few lines of the thresholds config).

4. If matches are found, present a **REVIEW NEEDED** report:

   > The following configs use `thresholds` with `humanizeDuration`. In Lowdefy v5 (dayjs), `thresholds` is accepted but ignored. Dayjs uses default thresholds (same as moment defaults).

   For each match, show the file, line number, and the relevant YAML context. Then advise:

   - If the app does not depend on custom threshold behavior (changing when durations switch units, e.g., "show weeks after 7 days"), no action is needed — the defaults match.
   - If the app does depend on custom thresholds, the `thresholds` property can be removed since it has no effect. The output will use dayjs defaults.
   - Removing the `thresholds` key is recommended for clarity, since it is now a no-op.

5. If no matches are found, report: "No `thresholds` usage found. No review needed."

## Scope

- This prompt is **report-only**. Do not automatically remove `thresholds` keys. Present findings and let the user decide.
- Search for `thresholds` only within humanizeDuration operator blocks, not elsewhere in the config.
