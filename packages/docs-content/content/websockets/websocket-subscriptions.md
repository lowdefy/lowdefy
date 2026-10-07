# Page Subscriptions

Pages subscribe to websocket channels with the `subscriptions` key. The engine subscribes when the page mounts (unless the subscription sets `client.subscribeOnMount: false`) and unsubscribes when the user navigates away — no cleanup wiring needed.

## Subscription Definition

- `websocketId: string`: __Required__ - The id of a websocket defined in the top-level `websockets` array.
- `payload: object`: Client-side operators (`_state`, `_url_query`, `_global`) evaluated at subscribe time. The server reads these values with `_payload` in the websocket `properties`.
- `events: object`: Actions for `onMessage`, `onSubscribe` and `onError`.
- `client.maxMessages: number`: How many messages to retain in `messages` (default 100, oldest dropped first).
- `client.throttleRender: number`: Minimum milliseconds between renders while messages stream in (default 250, minimum 100).
- `client.subscribeOnMount: boolean`: Subscribe when the page mounts (default `true`). Set `false` to open the channel only with the [`Subscribe`](/websocket-publish) action.

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

The payload is evaluated once, at subscribe time. To subscribe with new values — say a changed filter — run [`Subscribe`](/websocket-publish) again: with a changed payload it replaces the open channel, and the channel state starts empty.

## Subscribing on Demand

A subscription with `client.subscribeOnMount: false` is declared on the page but opens only when a [`Subscribe`](/websocket-publish) action runs, and [`Unsubscribe`](/websocket-publish) closes it. Use it for a channel the page needs only some of the time, such as a chat panel that holds a change stream only while it is open:

```yaml
subscriptions:
  - websocketId: thread_messages
    payload:
      ticket_id:
        _state: ticket_id
    client:
      subscribeOnMount: false
blocks:
  - id: open_thread
    type: Button
    events:
      onClick:
        - id: set_ticket
          type: SetState
          params:
            ticket_id: T-1
        - id: subscribe
          type: Subscribe
          params: thread_messages # payload evaluates now, with ticket_id T-1
  - id: close_thread
    type: Button
    events:
      onClick:
        - id: unsubscribe
          type: Unsubscribe
          params: thread_messages
```

Until it is subscribed, the channel's `_websocket` state reads as not connected with no messages. The page still closes it when it unmounts.
