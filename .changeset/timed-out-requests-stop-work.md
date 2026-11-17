---
'@lowdefy/api': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/connection-axios-http': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix: A request that times out stops the work behind it

When a request passed `config.requestTimeout`, the server answered 504 but the work behind it ran on: MongoDB queries, HTTP calls and the rest of an endpoint's routine, writes included. Now:

- `MongoDBAggregation`, `MongoDBFind`, `MongoDBFindOne` and `MongoDBTableQuery` pass the request's signal to the MongoDB driver, which stops the operation on the server.
- `AxiosHttp` passes the signal to axios, which aborts the call. A `timeout` the request sets still applies.
- A routine runs no step or control after its request times out or the client closes the connection. A step already running, such as a MongoDB write, runs to its end and is not undone.
- A request stopped this way is logged once at debug as a cancellation, not as a fault, and is not sent to error tracking. The server's error handler no longer logs it again as a bad request.

Background, detached and scheduled endpoint runs (synchronous ones included), agent chats and the MCP `afterToolCall` hook run with no request signal and run to the end, as before.
