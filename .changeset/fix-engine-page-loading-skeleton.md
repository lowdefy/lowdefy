---
'@lowdefy/engine': patch
---

fix(engine): A page's own `loading` and `skeleton` reach the page.

`loading` and `skeleton` set on the page block were dropped before the page rendered, the same way a page's `class` was, so a page never showed its loading state or skeleton. They now reach the page block like on any other block.
