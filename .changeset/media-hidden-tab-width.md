---
'@lowdefy/operators-js': patch
---

fix(operators-js): `_media` works in a tab that has no width yet

A page that loads in a hidden or background browser tab reports a window width of 0 until the tab is shown. `_media` treated that as having no window and threw "device window width not available for \_media." for every key, `darkMode` included, so an `_if` on `_media: darkMode` (like the auth page cover in modules-mongodb's layout module) logged two errors and fell back to nothing. `_media` now returns its values at width 0, with size `xs`, and blocks that read the width update when the tab is shown. It still throws where there is no browser window at all.
