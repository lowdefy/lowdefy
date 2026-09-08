---
'@lowdefy/build': patch
---

fix(build): Rebuild dev app-level artifacts when root-referenced files change.

Files referenced directly from `lowdefy.yaml` that resolve to plain values — like `app.html.appendHead: {_ref: head.html}` — were missing from the dev server's rebuild trigger list, so editing them served stale HTML until a manual restart. They now correctly trigger a skeleton rebuild.
