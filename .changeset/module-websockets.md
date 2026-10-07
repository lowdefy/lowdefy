---
'@lowdefy/build': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat(build): Modules ship websockets

A module manifest takes a `websockets:` section with the same items as the app's top-level `websockets:`, so a module ships the change streams its own pages subscribe to and an app that installs it needs no websocket config of its own. Websocket ids are scoped to the module entry (`support/thread-messages`), a websocket's `connectionId` written with `_module.connectionId` resolves to the app's connection when the entry remaps it, and the app's `auth.websockets` rules match the scoped ids (`support/*`). The new `_module.websocketId` operator resolves a module websocket's scoped id for page `subscriptions` and the `Subscribe`, `Unsubscribe` and `Publish` actions, with a `{ id, module }` form for another module's websocket or for app-level config.
