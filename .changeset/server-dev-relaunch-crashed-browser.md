---
'@lowdefy/server-dev': patch
---

fix(server-dev): Relaunch the headless browser after `Target crashed`

A headless browser that stays connected but answers `Target crashed` on every new context or page is now retired: the call that hit it fails with an error saying the browser crashed and is relaunched, and the next screenshot or journey gets a new browser instead of the same error until the dev server restarts. Calls still running on the crashed browser end as before, and it closes once they do.
