---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix(servers): Update `tailwindcss` and `@tailwindcss/postcss` to 4.3.3.

`@tailwindcss/postcss` 4.3.1 pinned `postcss` 8.5.15, which has a published advisory for reading source map files named in CSS comments. 4.3.3 allows a patched `postcss`. The 4.3.2 and 4.3.3 releases also fix a number of small class generation issues, and Preflight now names explicit platform fonts so CJK text renders correctly on Windows.
