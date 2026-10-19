---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

A linked workspace plugin pinned to another Lowdefy release no longer brings its own copies of the Lowdefy libraries into the client. The dev server could load the plugin's older `@lowdefy/helpers` or `@lowdefy/block-utils` for the whole client and fail with "does not provide an export named ...", and a production build bundled both copies, so the plugin's blocks missed the HTML enhancements the client registers. Every `@lowdefy` package the server depends on now resolves from the server.
