---
'lowdefy': patch
'@lowdefy/server-dev': patch
---

`lowdefy journeys harden` no longer reports a mutant as unapplied when the dev server rebuilt its page after the mutants were listed. A rebuilt page gets new keys, so a mutant listed before the rebuild could not be found by its key, and every journey that ran it was reported unapplied. This showed on large apps, where a mutant on a layout shared by many pages was unapplied on all of them. The listing now also gives each mutant's position in its page and a hash of its content. When the key is not found, the dev server finds the mutant by that position, and only applies it when the content is the one listed.
