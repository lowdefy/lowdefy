---
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix(server-dev): Default blocks no longer restart the dev server the first time a page uses them

The first page in a new dev server that used a default package the server did not ship, such as the Google Maps block, made the server install that package and restart. A journey running at that moment failed with "Lowdefy dev server connection dropped.", and passed when run again because the package was then installed. The dev server now installs every default package that holds a block, an action or a client operator, so these pages no longer restart it.
