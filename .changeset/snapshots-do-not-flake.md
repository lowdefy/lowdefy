---
'lowdefy': patch
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
---

fix(snapshot): golden snapshots no longer flake

`lowdefy snapshot --check` fails only on DOM or state drift; screenshot drift is reported as `ADVISORY` with its `diff.png` still written, and `--fail-on-pixel` restores the old behaviour for teams whose renderer is pinned to a container. State values that are ISO-8601 timestamps or UUIDs are normalised to `[TS]` and `[UUID]` the way the DOM already was, so a `created_at` field no longer drifts every run; ignored paths are dropped when the golden is written as well as when it is compared, fixing an array-wildcard path such as `rows.$.score` that used to drift on every check. `tests/snapshots.yaml` entries accept an `ignore` list, so a snapshot target can drop a path without editing the page; the page-level `~snapshotIgnore` is deprecated in favour of it. The capture waits for web fonts and two paints instead of a fixed delay and disables CSS animations and transitions, so two `--update` runs produce byte-identical files.
