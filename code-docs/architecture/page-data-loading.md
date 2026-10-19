# How Pages Load Data

How a Lowdefy page gets its data: requests, the page instances that hold their results, and the websocket subscriptions that tell a page something changed. What one request does on the server is in [request-lifecycle.md](./request-lifecycle.md); how page instances are kept is in [engine.md](../packages/engine.md#page-contexts-and-instances).

Both paths are server-authoritative. The browser sends an id and a payload; the server evaluates everything else.

## Requests

- **One POST per request id.** A `Request` action names request ids. `Requests.callRequests` (`packages/engine/src/Requests.js`) maps them to `callRequest` and waits on them with `Promise.all`, so a list of ids is that many parallel `POST /api/request/{pageId}/{requestId}` calls (`packages/client/src/createCallRequest.js`, fetched by `packages/client/src/request.js`), not one HTTP call. `{ all: true }` calls every request on the page.
- **A per-caller result.** The server handler (`packages/api/src/routes/request/callRequest.js`) authorizes against the page's roles (the build copies page auth onto each request), applies tenancy with `resolveTenancy` (under `policy: tenant`, a tenant-scoped connection with no caller organization throws `AuthenticationError`; under the default `pinned` policy there is no wall), evaluates the properties with `_user`, `_payload` and secrets, and runs the connection's resolver. The result is a projection for that user and payload, not a shared view of a collection.
- **Auth reads before the query.** Every request outside `/api/auth` runs `resolveAuthentication` (`packages/api/src/context/resolveAuthentication.js`). BetterAuth's `getSession` reads the session and then the user, one after the other: Lowdefy does not turn on BetterAuth's database joins, and `session.cookieCache` is off unless the app enables it (`packages/build/src/build/buildAuth/setAuthDefaults.js`). `readMemberships` then reads the user's member rows in one query. A passkey count can add a fourth read; a pinned app answering a session for another organization stops before the member read.
- **Per-process caches.** Built config files are read through an LRU of 100 entries per process (`packages/servers/server/lib/server/fileCache.js`). MongoDB clients are pooled per process (`packages/plugins/connections/connection-mongodb/src/connections/MongoDBCollection/getClient.js`).
- **No result cache.** Two identical calls are two POSTs and two queries. Neither the engine, the client fetch nor the server deduplicates or reuses a result.
- **Where results land.** Each call is added to the front of `context.requests[id]`. `_request` reads the newest entry and deep-copies it on every read (`serializer.copy`, or `get` with `copy` for a sub-path). While a request reloads, `_request` reads `null`, unless the request sets `holdValue`, which seeds the new entry with the previous response.
- **Caller stamp.** Every response carries `x-lowdefy-caller`, the caller the server answered as. The client reloads the page when it names another user, organization or role set (`shouldReloadForCaller`); see [server.md](../servers/server.md).

## What survives navigation

- A page keeps up to 10 instances, one per set of path params (`keepPageInstance`, key from `pageInstanceKey`). Going back to a kept instance in the same tab keeps its request data; a reload never does. An instance is rebuilt when the caller's organization changes.
- A different path param (another record) is a new instance with no data: `onInit` runs again and every request starts from nothing. A record chosen by `urlQuery` reuses the instance, since the query is not part of the key.
- Between pages, an app shares data through `_global`, local storage, `urlQuery` and a Link's `input`. `CallAPI` results (`lowdefy.apiResponses`, read with `_api`) are app-level and also survive navigation; they are dropped on an organization change (`packages/client/src/setLowdefyUser.js`). Request results are never shared.

## Subscriptions

- **One socket per tab.** A page's `subscriptions:` open channels on one multiplexed websocket at `/api/websocket` (`packages/client/src/websocket/createWebSocketClient.js`; engine side `packages/engine/src/WebSockets.js`). The socket opens on the first subscribe or publish, closes 5 seconds after it goes idle, and reconnects with jittered backoff (500 ms base, 15 s cap), resubscribing everything.
- **Shared sources.** `prepareChannel` evaluates each subscriber's properties with its payload and user, and resolves tenancy. `createChannelRegistry` (`packages/api/src/routes/websocket/`) keys a channel on the websocket id and a hash of the evaluated connection properties, properties and tenant, so subscribers with identical keys share one server-side source. The registry is per server process: on serverless hosting, sharing happens only within one function instance.
- **Caller re-check.** `createWebSocketConnection` re-resolves the caller before every subscribe and every 60 seconds. When the user, organization or app roles change, it closes the socket with code 4401 and the client reconnects, authenticating afresh. A failed check closes with 1011.
- **MongoDB change streams.** `MongoDBChangeStream` (`packages/plugins/connections/connection-mongodb/src/connections/MongoDBCollection/MongoDBChangeStream/`) runs `collection.watch` with `fullDocument: 'updateLookup'` by default and publishes each change event as it is, once per channel. It keeps no resume token: a source restarted after an error (1 s doubling, at most 5 retries, then the channel is removed) starts from now, and a tab that reconnects misses what was sent while it was away. Under tenancy, `applyTenantToChangeStream` matches on `fullDocument.<field>` and forces `updateLookup`, so delete events, and any event without a full document, are dropped.
- **What a page does with a message.** `onMessage` fires once per batch, not once per change: `{ messages }`, with a leading-edge throttle (`throttleRender`, default 250 ms, minimum 100) and at most `maxMessages` kept (default 100). Apps usually refetch requests in `onMessage`. The Table block can patch rows from the change instead, with its `applyTransaction` method.
- **Unmount unsubscribes.** `WebSocketsEffect` (`packages/client/src/Context.js`) subscribes when the page context mounts and unsubscribes on cleanup, so a page hears nothing while another page or another record's instance is open. `client.subscribeOnMount: false` turns the automatic subscribe off.

## What it costs

Measured on Pelican in production on Vercel (cpt1), 9 to 13 October 2026, on a release that still flushed Sentry on every request and started full Sentry in the function. Source: Pelican task LDF-581 (Where a request's 430 ms goes).

- **A warm request** was answered in about 46 ms at the edge (p50), of which the handler took about 8 ms. Vercel billed about 430 ms per request, about 400 ms of it after the response was sent, waiting on a Sentry flush.
- **Cold starts were the real wait.** A page sends its requests at once, and Vercel routes some of them to new instances, which took about 5.5 to 6 s to boot. At least one request was cold in about 1 task view in 5. Starting Sentry in the function added about 1.6 s to each boot.
- **Chains add rounds.** Actions that wait on earlier requests before starting later ones spread a task view's requests over 1.1 s at the median and 3.3 s at p90.

The code now differs on both Sentry points. Serverless functions start Sentry in its light, errors-only mode unless `logger.sentry.serverTracing` is set, send no client reports, and flush only after the response closes, so a request with no error and no sampled transaction does not wait on a flush (`packages/servers/server/lib/server/sentry/initSentry.js`, `packages/cli/src/commands/vercelOutput/apiHandler.js`; see [error-tracing.md](./error-tracing.md)). The billed time and boot numbers above do not hold for it.

Every navigation to a new record, every live message an app answers by refetching, and every write followed by a reload pays these costs again.
