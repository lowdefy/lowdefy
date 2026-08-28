# @lowdefy/websockets-core

Core websocket types for Lowdefy.

- `Channel` — pure client pub/sub relay. Set `properties.publish: true` to allow clients to publish.
- `Interval` — emits a `{ tick, at }` message every `properties.ms` milliseconds (default 1000, min 100). Useful for examples and tests.

See the [Lowdefy websockets docs](https://docs.lowdefy.com) for usage.
