---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': patch
---

feat: A websocket can name a `check` endpoint that decides, on every subscribe and publish, whether the caller may use the channel. Use it for a channel whose payload names a record, such as the events on one ticket, where roles alone can not say whether this subscriber may see that record.

```yaml
websockets:
  - id: ticket_events
    type: MongoDBChangeStream
    connectionId: events
    check:
      endpointId: can-view-ticket # Api or InternalApi
      payload: # optional; defaults to the subscription payload
        ticket_id:
          _payload: ticket_id
```

The endpoint runs as the subscriber, after the `auth.websockets` role check. Only a return value of exactly `true` lets the subscription continue; any other value, an error or an endpoint the subscriber may not call refuses it with the same response as a websocket that does not exist, and an error is also logged. The check runs on the first subscribe, the resubscribe after a reconnect and a `Subscribe` with a new payload, and again once a minute while a subscription stays open, so revoking access ends a running subscription within a minute. A publish is checked too, with an empty payload, so a caller the check refuses can not publish into the channel. The check is not part of the channel identity, so subscribers who each pass still share one running source. The build fails when `check.endpointId` names no endpoint in the app.

fix: The server now deserializes a subscribe payload, as it already did a publish payload, so a Date the page sends reaches websocket `properties` and the check endpoint as a Date.
