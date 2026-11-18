---
'@lowdefy/node-utils': patch
---

fix(deps): Update fs-extra to 11.4.1

fs-extra 11.4.1 reports read errors (such as missing permissions) when emptying a directory, fixes copying and moving into a destination with a symlinked parent folder, and fixes a file descriptor leak when preserving timestamps fails.
