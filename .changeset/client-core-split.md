---
'@lowdefy/client': minor
'@lowdefy/client-core': minor
---

refactor(client): Move the platform-free client into @lowdefy/client-core

The request, API call, error handling, page lifecycle, storage, websocket and auth code the web client and native shells share now lives in the new `@lowdefy/client-core`, which `@lowdefy/client` depends on. Web apps behave as before. A plugin that deep-imported one of these files from `@lowdefy/client` (such as `@lowdefy/client/request.js`, `createCallRequest.js`, `createHandleError.js`, `getContextKey.js`, `storage/*`, `websocket/*` or `auth/*`) imports it from `@lowdefy/client-core` instead.
