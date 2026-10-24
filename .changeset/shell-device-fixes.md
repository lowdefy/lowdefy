---
'@lowdefy/shell': patch
'@lowdefy/client-native': patch
---

fix(shell): Fixes found running the shell on an iOS simulator.

- Each tab shows its own first page. A tab read its page from the focused route, so every tab rendered the home page at start, and the hidden copy took the page's block updaters: a SetState changed state but not the screen.
- A dev page's types are read from the deserialized page, so a page the dev server sends no longer fails with "undefined is not a function".
- A page starts below the translucent iOS header and tab bar instead of under them.
