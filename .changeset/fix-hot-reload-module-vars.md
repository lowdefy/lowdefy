---
'@lowdefy/build': patch
---

fix(build): Hot reload module vars consumed only in pages.

Edits to per-app module vars files (e.g. `apps/<app>/modules/<id>/vars.yaml`) did not propagate in the dev server when the values were consumed exclusively inside pages via `_module.var`. The skeleton-source-file collector now walks each module entry's `consumerVars`, so changes to those files trigger a skeleton rebuild and pages render with the updated values.
