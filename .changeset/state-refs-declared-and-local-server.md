---
'@lowdefy/build': patch
'lowdefy': patch
---

The `state-refs` build check now accepts a key declared in the page's `state:` schema, so state a custom action writes at runtime can be declared by contract instead of suppressed. The CLI no longer crashes merging file-plugin dependencies when no server is installed, which is the case for `lowdefy: local` apps.
