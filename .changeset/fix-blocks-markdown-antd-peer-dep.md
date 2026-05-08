---
'@lowdefy/blocks-markdown': patch
---

fix(blocks-markdown): Declare `antd` as a peer dependency.

`MarkdownWithCode` imports `antd` for theme-aware syntax highlighting but the package did not declare `antd` in its `peerDependencies`, causing module resolution failures (e.g., when bundling apps that include `@lowdefy/blocks-markdown` without already pulling in `antd`). Added `antd` (`>=6`) as a peer dependency to match the version range used by `@lowdefy/blocks-antd`.
