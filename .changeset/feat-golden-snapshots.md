---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/build': minor
'@lowdefy/docs': patch
---

Add `lowdefy snapshot`, golden snapshots of every page as every dev user. `lowdefy snapshot --update` boots the development server headless and writes `snapshots/<pageId>/<user>/{screenshot.png, dom.html, state.json}` for each page × `auth.dev.users` fixture (or the pages, users, `urlQuery` and pre-snapshot `journey` declared in `tests/snapshots.yaml`; `--pages` and `--users` filter further). `lowdefy snapshot --check` compares against the committed files — pixelmatch over the PNG with a `--pixel-tolerance` (default 0.1%), a line diff over the DOM normalised for Ant Design hash classes, `rc-*` ids, timestamps and UUIDs, and a deep-equal over the state minus the paths a page lists under the new `~snapshotIgnore` key (`$` matches any array index) — prints one line per differing artefact, writes pixel diffs to `.lowdefy/snapshot-diff/`, and exits `1` on any drift or missing golden. Exactly one of `--check` and `--update` is required.

The dev server gains `GET /lowdefy-docs/snapshot/:pageId?user=&urlQuery=&journey=` and the `lowdefy_snapshot` MCP tool, which render a page under deterministic browser settings (fixed viewport, reduced motion, light scheme, `en-US`, `UTC`) and return `{ screenshot, dom, state, snapshotIgnore }`, plus `GET /lowdefy-docs/dev-users` listing the declared fixture names. `openPage` accepts `contextOptions` so every headless tool can share those settings.
