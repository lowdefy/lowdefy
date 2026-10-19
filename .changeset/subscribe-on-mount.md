---
'@lowdefy/build': minor
'@lowdefy/engine': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat: Page subscriptions that wait for the Subscribe action

- **`client.subscribeOnMount`.** A page subscription with `client.subscribeOnMount: false` is declared on the page but does not open when the page mounts. The `Subscribe` action opens it, evaluating its `payload` at that moment, and `Unsubscribe` closes it. A widget on every page can then hold its channel only while it is in use. The default, `true`, keeps subscribing on mount.
- **`Subscribe` with a changed payload replaces the channel.** Running `Subscribe` on an open subscription evaluates its payload again. When the payload changed, the channel is replaced and its `_websocket` state starts empty, and messages from the old channel are dropped. When it did not change, nothing happens, as before.
