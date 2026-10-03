---
'lowdefy': patch
'@lowdefy/node-utils': patch
---

`lowdefy journeys compile` no longer stacks origin blocks on a candidate you have edited. A rerun over a known candidate replaces its origin block by text and leaves the rest of the file as you wrote it, so a comment straight above `name:` or a removed blank line after the block no longer adds a second `# origin:` block on every run.
