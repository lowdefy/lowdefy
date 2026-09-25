# Page Subscriptions

Pages subscribe to websocket channels with the `subscriptions` key. The engine subscribes when the page mounts and unsubscribes when the user navigates away — no cleanup wiring needed.

## Subscription Definition

- `websocketId: string`: __Required__ - The id of a websocket defined in the top-level `websockets` array.
- `payload: object`: Client-side operators (`_state`, `_url_query`, `_global`) evaluated at subscribe time. The server reads these values with `_payload` in the websocket `properties`.
- `events: object`: Actions for `onMessage`, `onSubscribe` and `onError`.
- `client.maxMessages: number`: How many messages to retain in `messages` (default 100, oldest dropped first).
- `client.throttleRender: number`: Minimum milliseconds between renders while messages stream in (default 250, minimum 100).

## Reacting to Messages

The most common realtime pattern is prompting a data refresh — a source signals that something changed, and the page refetches its request:

```yaml
pages:
  - id: orders
    type: PageHeaderMenu
    requests:
      - id: get_orders
        type: MongoDBFind
        connectionId: mongodb
        properties:
          query: {}
    subscriptions:
      - websocketId: order_updates
        events:
          onMessage:
            - id: refetch
              type: Request
              params: get_orders
    blocks:
      - id: orders_table
        type: AgGridAlpine
        properties:
          rowData:
            _request: get_orders
```

`onMessage` fires once per render batch, not once per message — on a busy channel the batch holds every message since the last flush. The batch is available on the event:

```yaml
events:
  onMessage:
    - id: use_batch
      type: SetState
      params:
        latest_batch:
          _event: messages # array of message payloads in this batch
```

`onSubscribe` fires when the server acknowledges the subscription (including after an automatic reconnect). `onError` fires with `_event: message` when the channel errors.

## Reading Channel State with `_websocket`

The `_websocket` operator reads the channel's client state anywhere on the page:

```yaml
_websocket: ticker.connected # boolean — subscription is live
_websocket: ticker.messages # array — retained payloads, newest last
_websocket: ticker.lastMessage # the most recent message payload
_websocket: ticker.lastMessage.tick # dot paths into the payload
_websocket: ticker.messageCount # total received this page visit (not capped)
_websocket: ticker.error # last error, null when healthy
```

Unlike `_request`, there is no invocation history — a subscription is continuous. State resets when the page unmounts.

## Subscription Payloads

The subscription `payload` parameterizes the channel per subscriber. Client operators are evaluated when the subscription starts:

```yaml
pages:
  - id: activity
    type: PageHeaderMenu
    subscriptions:
      - websocketId: activity_feed
        payload:
          project_id:
            _url_query: project_id
```

```yaml
websockets:
  - id: activity_feed
    type: MongoDBChangeStream
    connectionId: mongodb
    properties:
      pipeline:
        - $match:
            fullDocument.project_id:
              _payload: project_id
            fullDocument.owner_id:
              _user: id
```

The payload is evaluated once, at subscribe time. To subscribe with new values — say a changed filter — run [`Unsubscribe` then `Subscribe`](/websocket-publish).
