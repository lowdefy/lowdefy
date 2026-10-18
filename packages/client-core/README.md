# @lowdefy/client-core

The platform-free half of the Lowdefy client: requests and endpoint calls, the websocket client,
auth methods, storage keys, page lifecycle events, and the handling of the build and caller stamps
the server sends.

A renderer (`@lowdefy/client` for the web) builds the context with `createLowdefyCore` and passes
a `host` that reaches the platform: `fetch`, storage, the websocket URL, the router, and what to do
when the server's build or caller changes. The core never reads `window` or `document`.
