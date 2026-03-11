---
'lowdefy': patch
---

fix(cli): Exit process and stop spinner on build errors.

The CLI error handler logged errors but never called `process.exit(1)`, so the process continued running with a spinning indicator after a build failure. Added `process.exit(1)` to `runCommand` after error handling, and added `{ spin: 'fail' }` to stop the spinner in `runLowdefyBuild`, `runNextBuild`, and `installServer` catch blocks.
