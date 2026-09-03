# Publish and Actions

A `Channel` websocket relays messages between clients: any subscriber can publish, and the server broadcasts to everyone subscribed — including the sender. This powers chat, presence, and collaborative features with no extra services.

## A Minimal Chat

```yaml
lowdefy: 5.5.1

websockets:
  - id: team_chat
    type: Channel
    properties:
      publish: true

pages:
  - id: chat
    type: PageHeaderMenu
    subscriptions:
      - websocketId: team_chat
        client:
          maxMessages: 200
    blocks:
      - id: chat_input
        type: TextInput
        properties:
          placeholder: Say something...
      - id: send
        type: Button
        properties:
          title: Send
        events:
          onClick:
            - id: publish
              type: Publish
              params:
                websocketId: team_chat
                payload:
                  text:
                    _state: chat_input
            - id: clear
              type: SetState
              params:
                chat_input: ''
      - id: messages
        type: Html
        properties:
          html:
            _array.join:
              - _array.map:
                  on:
                    _websocket: team_chat.messages
                  callback:
                    _function:
                      __string.concat:
                        - '<p>'
                        - __args: 0.text
                        - '</p>'
              - ''
```

Publishing requires both the channel type to support it and `properties.publish: true` on the definition — server-push channels reject publishes by default.

## Actions

### `Publish`

Sends a payload to a channel. The action resolves when the server acknowledges the publish, and rejects if the channel does not allow publishing or the connection cannot be established:

```yaml
- id: publish
  type: Publish
  params:
    websocketId: team_chat
    payload:
      text:
        _state: chat_input
```

Payload values keep their types across the wire — dates arrive as dates.

### `Subscribe` and `Unsubscribe`

Page `subscriptions` cover most cases, but the actions give dynamic control — subscribe after an interaction, or re-subscribe with a fresh payload:

```yaml
- id: change_filter
  type: Unsubscribe
  params: activity_feed
- id: resubscribe
  type: Subscribe
  params: activity_feed # payload re-evaluates from current state
```

`Subscribe` on an already-subscribed channel does nothing. Channels subscribed with the action are still cleaned up when the page unmounts.

## Deployment

### Vercel

Websockets use Vercel's native WebSocket support for Node.js functions on Fluid compute — deploy the same project, no configuration. Two platform behaviors to know:

- Connections close when a function reaches its `maxDuration`. The Lowdefy client reconnects and resubscribes automatically, so this is invisible to users; raise `maxDuration` to reduce reconnect frequency on websocket-heavy apps.
- Under load, Vercel may run multiple instances of your app. Server-driven sources run per instance, so every subscriber receives every source message regardless of which instance they land on. Client publishes, however, reach subscribers connected to the same instance. For chat-style apps at multi-instance scale, a cross-instance pubsub adapter is on the roadmap.

### Self-Hosted

The Node.js server handles websocket upgrades directly — nothing to configure. A single server process delivers publishes to all subscribers, so `Channel` behavior is complete on one instance. Behind a reverse proxy, ensure upgrade headers are forwarded (`proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";` for nginx).
