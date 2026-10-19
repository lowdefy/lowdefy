---
'lowdefy': minor
'@lowdefy/node-utils': minor
---

`lowdefy test` and the `lowdefy_run_tests` agent tool can run all journeys, a folder or glob of them, or a tagged section.

- A plain `lowdefy test` reads every sub-folder of `tests/journeys/`. Folders whose name starts with `_`, such as `_candidates/`, are skipped.
- Paths may be globs, which the CLI expands itself: `lowdefy test 'tests/journeys/review/**'`. They also work in npm scripts on Windows and in the tool's `paths`. A glob that matches nothing is refused, like a missing path.
- Journeys take an optional `tags` list, such as `tags: [smoke, review]`, and `lowdefy test --tag smoke --tag review` runs the journeys that carry any of the given tags. `--filter` can be repeated in the same way. Paths, tags and filters combine. The tool takes `tags`, and `filter` as a string or a list.
- When nothing matches, the message names the paths, tags and filters that were given.
