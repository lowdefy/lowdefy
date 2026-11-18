---
'@lowdefy/blocks-antd': patch
---

chore(deps): Replace classnames with clsx in blocks-antd

`Label` and `ControlledList` compose their class names with `clsx`, the library `@lowdefy/block-utils` already uses, and `classnames` is no longer a dependency. `clsx` is now a direct dependency of `@lowdefy/blocks-antd`. The class names the blocks render are unchanged.
