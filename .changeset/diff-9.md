---
'@lowdefy/blocks-diff': patch
---

fix(deps): Update diff (jsdiff) to 9.0.0

`DiffGit` may now order removed and added lines differently for the same `before` and `after`. When two diffs are equally short, jsdiff now shows the removal before the addition, as `git diff` does. For example, a list changed from `[a, b]` to `[b, c, a]` used to render as `+ b`, `+ c`, `a`, `- b` and now renders as `- a`, `b`, `+ c`, `+ a`. In a test on random YAML-like input, about 8% of diffs rendered differently. The lines shown as changed are still correct, and `DiffList`, `DiffSideBySide` and `DiffTimeline` are not affected.
