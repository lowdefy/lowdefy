---
'@lowdefy/api': patch
'@lowdefy/connection-mongodb': patch
---

fix(api): A failing websocket source keeps restarting and tells pages when it is back

When a websocket source kept failing, for example during a database outage of more than about 30 s, the server restarted it 5 times, then dropped the channel without telling its subscribers. Pages still showed the subscription as connected but heard nothing more until they reloaded or reconnected. Every failed restart was also logged as an error and sent to Sentry.

The server now restarts a failed source for as long as its channel has subscribers, 1 s after the failure and doubling up to once a minute. The first failure of an outage is logged as an error and sent to Sentry. Each further failed restart is a warning. Subscribers still get an error for each failed start.

When the source is listening again, each subscriber gets its subscription acknowledged again, so the page's `onSubscribe` fires and `_websocket: <id>.error` returns to `null`. The source missed every change during the outage, so a page that refetches in `onSubscribe` catches up. A websocket source receives a new `ready` function and calls it once it is listening; a source that publishes counts as listening too. `MongoDBChangeStream` calls it when the database first answers the stream.
