---
'@lowdefy/build': patch
'@lowdefy/server': patch
'@lowdefy/operators-js': patch
---

fix(build,server,operators-js): an open tab reloads once after a deploy instead of failing with "\_js function not found"

Every build now stamps a random `buildId` on the app metadata (readable as
`_app: buildId`). The production server sends it with each page config fetched
during in-app navigation, and the client bundle carries the id of the build it
was made from. When they differ, the tab has a bundle from an earlier deploy
whose `_js` map and plugin set no longer match the config the server is
serving, so the client does one full reload of the requested page to pick up
the current bundle. A tab reloads at most once per server build, so a rolling
deploy answering from mixed versions cannot loop. The `_js function not found`
error also now says that the page may be running an older bundle and should be
reloaded.
