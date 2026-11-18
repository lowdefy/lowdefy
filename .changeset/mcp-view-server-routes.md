---
'@lowdefy/api': minor
'@lowdefy/server': minor
'lowdefy': minor
---

feat: The production server serves MCP App views. For an app whose `mcp` block has a view, the routes a view calls (`/api/view/boot`, `/api/view/root`, `/api/page`, `/api/request`, `/api/endpoints`, `/api/agent`, `/api/user`, `/api/client-error` and `/api/usage`) answer the view host's exact origin with CORS headers: the preflight is answered, the response names the one origin the request came from, and credentials are never allowed, so no cookie crosses. No other route and no other origin gets a CORS header, and an app without a view sends none. A view session is refused with a 403 on every `/api` route that is not one of those or `/api/websocket`, so a route added later is closed to views until it is listed. `GET /api/view/boot` is public and answers `{ buildId, js, css }` for the view entry of the current build; `GET /api/view/root` answers the root config for a view session's user. `/api/client-error` admits a view's origin only with a view session. The websocket accepts a view's origin with a view session, sent as a subprotocol, and `isWebSocketOriginAllowed` takes the view origins to accept. Hashed assets and public files send `Access-Control-Allow-Origin: *` for an app with a view, from the Node server and in the `lowdefy vercel-output` routes.
