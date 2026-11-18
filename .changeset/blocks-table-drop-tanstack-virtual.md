---
'@lowdefy/blocks-table': patch
---

chore(deps): Make @tanstack/react-virtual a devDependency of blocks-table

The Table block never used TanStack Virtual in an app: only the benchmark's comparison row window did, behind a prop the Lowdefy client never passes. That row window now lives in the benchmark, so installing `@lowdefy/blocks-table` no longer installs `@tanstack/react-virtual`. Nothing changes in the browser.
