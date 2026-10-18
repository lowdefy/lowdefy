---
'@lowdefy/api': minor
'@lowdefy/build': minor
---

feat: `mobile.events` holds the app events a phone runs

A native shell no longer runs the root `events`. They stay web-only, so an action with no native version, like an analytics init, no longer fails on every launch with "Invalid action type ... at app". App events that run on a phone go in `mobile.events` (`onInit`, `onInitAsync`), with the same rules as the root events. The build fails when an action type in `mobile.events` has no native version, as it does on a mobile page, and their types join every mobile page's type set. Their `_js` reaches the shell as module text and stays out of the web client.
