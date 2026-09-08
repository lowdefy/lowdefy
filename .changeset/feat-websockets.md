---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/engine': minor
'@lowdefy/client': minor
'@lowdefy/operators': minor
'@lowdefy/operators-js': minor
'@lowdefy/actions-core': minor
'@lowdefy/websockets-core': minor
'@lowdefy/connection-mongodb': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
---

feat: Add websockets — a first-class realtime primitive.

Define channels under a new top-level `websockets:` key and subscribe pages to them with `subscriptions:` — live dashboards, notifications, and chat without polling or an external socket service. The same Lowdefy server that serves your pages pushes messages over a single multiplexed WebSocket connection, locally and on Vercel (native WebSocket support on Fluid compute). Authentication uses your existing session, with per-channel `auth.websockets` roles.

**Channels (`websockets:`)**

- Websocket types are plugins: `Channel` (client pub/sub relay) and `Interval` (timed ticks) ship in the new `@lowdefy/websockets-core` package; `MongoDBChangeStream` in `@lowdefy/connection-mongodb` pushes MongoDB change events to subscribed pages.
- Channel `properties` are evaluated server-side per subscription — `_payload` and `_user` make channels user-specific. Subscribers with identical evaluated properties share one running source.

**Page subscriptions (`subscriptions:`)**

- Pages subscribe on mount and unsubscribe on navigation — no wiring needed.
- React to messages with `onMessage`, `onSubscribe` and `onError` events, or read channel state anywhere with the new `_websocket` operator (`connected`, `messages`, `lastMessage`, `messageCount`, `error`).
- Renders are throttled (`client.throttleRender`) and message history is bounded (`client.maxMessages`).

**Actions**

- New `Publish`, `Subscribe` and `Unsubscribe` actions in `@lowdefy/actions-core` — publish messages to a channel or control subscriptions dynamically.

The client reconnects with backoff and resubscribes automatically, so serverless connection limits (e.g. Vercel function `maxDuration`) are invisible to users. See the new WebSockets section in the docs for a quick start.
