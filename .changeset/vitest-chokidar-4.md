---
'@lowdefy/server-dev': patch
'@lowdefy/block-dev': patch
---

chore: Lowdefy's tests run on vitest instead of jest 28, and the dev server watches files with chokidar 4 instead of chokidar 3, so `braces` (GHSA-vfj7-8cjw-p6xm) no longer comes in through either. `watchIgnore` globs still apply. `@lowdefy/block-dev`'s test helpers now register their tests with vitest and create their mocks with `vi.fn`, so a block package that uses them runs its tests on vitest.
