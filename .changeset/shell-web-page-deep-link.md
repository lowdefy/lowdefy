---
'@lowdefy/shell': patch
'@lowdefy/blocks-native': patch
---

fix(shell): A deep link to a web-only page no longer spins forever

A link to a page the app has no phone version of opens it in the browser with its query, then goes back. On a cold start, where the shell has nothing to go back to and stayed on its loading screen, it now says the page opened in the browser and offers a button home. A browser that cannot open it shows the not-found screen. Tag links and the update screen's store link no longer raise an unhandled rejection when no app opens them.
