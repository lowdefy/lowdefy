# WebSockets

Lowdefy websockets add realtime updates to your app — live dashboards, notifications, and chat — without polling and without running a separate socket service. Channels are defined at the root of your Lowdefy configuration, pages subscribe to them, and the same Lowdefy server that serves your pages pushes messages to the browser over a single WebSocket connection.

Websockets work identically on a self-hosted Node.js server and on Vercel, where Fluid compute now accepts WebSocket connections natively — one deployment, no extra infrastructure, no token wiring. Authentication uses your app's existing session: the connection is authorized with the same user roles as [API endpoints](/api-endpoints).

## Quick Start

A channel and a page subscription — this page shows a live tick counter:

```yaml
lowdefy: 5.5.1

websockets:
  - id: ticker
    type: Interval
    properties:
      ms: 1000

pages:
  - id: dashboard
    type: PageHeaderMenu
    subscriptions:
      - websocketId: ticker
    blocks:
      - id: ticks
        type: Html
        properties:
          html:
            _string.concat:
              - 'Ticks: '
              - _websocket: ticker.lastMessage.tick
```

When the page loads, the client opens a websocket connection, subscribes to `ticker`, and the block re-renders as messages arrive. When the user navigates away, the subscription ends and the channel's server source stops.

## How WebSockets Work

1. A page with `subscriptions` mounts. The client opens one shared WebSocket connection to the Lowdefy server (lazily — apps without websockets never connect).
2. For each subscription, the client evaluates the subscription `payload` (client-side operators like `_state`) and sends a subscribe frame.
3. The server authorizes the subscription against the channel's `auth` config, then evaluates the websocket `properties` server-side — `_payload` reads the subscription payload and `_user` reads the subscriber's session, so a channel can be user-specific.
4. Subscribers whose evaluated properties are identical share one running source on the server. The first subscriber starts it; the last one to leave stops it.
5. Messages from the source are pushed to all subscribers, update the channel state read by the [`_websocket`](/websocket-subscriptions) operator, and fire the subscription's `onMessage` event.

If the connection drops — a deploy, a network blip, or a serverless function reaching its time limit — the client reconnects with backoff and resubscribes automatically. Channel state on the page is preserved across reconnects.

## Websocket Definition

Websockets are defined in the top-level `websockets` array:

- `id: string`: __Required__ - A unique identifier for the channel.
- `type: string`: __Required__ - The websocket type. `Channel` and `Interval` ship with Lowdefy; connection plugins provide types like [`MongoDBChangeStream`](/MongoDB).
- `connectionId: string`: The `id` of a [connection](/connections) for connection-backed types.
- `properties: object`: Settings for the type. __Operators are evaluated server-side per subscription__ — `_secret`, `_user`, and `_payload` are available.

###### A user-specific channel:
```yaml
websockets:
  - id: my_feed
    type: MongoDBChangeStream
    connectionId: mongodb
    properties:
      pipeline:
        - $match:
            fullDocument.owner_id:
              _user: id
            fullDocument.category:
              _payload: category
```

Because `properties` evaluate per subscription, two users subscribing to `my_feed` get two independent server sources — but a thousand subscribers to a channel with static properties share just one.

## Core Types

- `Channel` — a pure pub/sub relay. Clients publish messages with the [`Publish`](/websocket-publish) action and the server broadcasts them to all subscribers. Set `properties.publish: true` to allow publishing.
- `Interval` — emits `{ tick, at }` every `properties.ms` milliseconds (default 1000, minimum 100). Useful for examples and testing.

## Securing Channels

Channel access follows the same pattern as [protected API endpoints](/api-endpoints). Configure `auth.websockets` with `public`, `protected`, and `roles` lists:

```yaml
auth:
  websockets:
    roles:
      admin:
        - admin_feed # only users with the admin role may subscribe
    public:
      - ticker # everyone else requires a session
```

Unauthorized subscriptions receive the same response as subscriptions to channels that do not exist.

## What's Next

- [Page Subscriptions](/websocket-subscriptions) — Subscribe pages to channels, handle messages with events, and read channel state with `_websocket`.
- [Publish and Actions](/websocket-publish) — Client publishing, the `Publish`, `Subscribe` and `Unsubscribe` actions, and deployment notes.
