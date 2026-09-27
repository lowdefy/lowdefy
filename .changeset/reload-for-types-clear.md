---
'@lowdefy/server': patch
---

fix(server): A tab that reloaded once because a page's plugin code failed to load forgets that reload when the page then loads. It used to keep the record for the whole session, so a later failure at the same URL (after another deploy) rendered a page with missing blocks instead of reloading once more.
