---
'lowdefy': patch
'@lowdefy/server-dev': patch
---

`lowdefy journeys harden` runs a mutant on a `_ref`'d layout, menu or template against every journey that reaches it on any page it is copied onto, and applies it to the copy that journey reaches. Before, only journeys that reached it on the first page by id ran it, so the score for shared layout code was wrong. The dev server's mutant listing now gives each copy's artifact, key and anchor under `copyTargets`.
