---
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/server': minor
'lowdefy': minor
'@lowdefy/docs': patch
---

feat(cli): `lowdefy check --against <ref>` reports id collisions and migration ordering conflicts before a merge

It resolves the ref with git, checks the ref and the merge base of HEAD and the ref out into temporary worktrees, and compares the ids each side declares: a page, request, endpoint, connection, component, collection or migration id introduced independently on both sides since they diverged is reported as an error, and a migration this branch adds that sorts before a migration the target branch adds is reported too, because migration ids sort lexically and lexical order is execution order. Collisions appear under a "Merge against <ref>" heading in the human output, under an `against` key in `--json`, carry the `branch-merge` check slug, and set the exit code to 1. The worktrees are always removed, including when the check fails.
