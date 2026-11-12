# The App's MCP Server and Views

How a production app serves its own MCP tools at `/api/mcp`, and how a tool shows a page of the app inside an MCP host as an MCP App view.

This is the app as an MCP _server_ for outside assistants. The dev server's `/lowdefy-docs/mcp` endpoint for coding agents is a different thing: see [agent-dev-hub.md](./agent-dev-hub.md). User docs: `packages/docs/users/mcp-oauth.yaml`.

## Pieces

```
MCP client (Claude)
  │ POST /api/mcp, bearer = OAuth access token or member token
  ▼
routes/mcp.js (server)          401 challenge, origin check
  ▼
createMcpServer (@lowdefy/api)  one stateless server per request
  ├─ tools/list, tools/call ──► callEndpoint
  ├─ resources/read ui://lowdefy/view ──► renderViewLoader (the view's HTML)
  └─ tools/call lowdefy_view_session ──► mintViewSession

Host sandbox frame, on https://<hash>.claudemcpcontent.com
  viewLoader ── GET /api/view/boot ──► entry script and stylesheets
  client/view.jsx (the app's web client, view host)
  └─ bearer view session ──► /api/view/root, /api/page, /api/request,
                             /api/endpoints, /api/user, /api/websocket, ...
```

## The build

| Step                 | File                                   | What it does                                                                                                                                                               |
| -------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buildMcp`           | `packages/build/src/build/buildMcp.js` | Validates the `mcp` block against the schema (strictly: a bad block stops the build), checks each tool's endpoint, sets `configured` and `hasPublicTool`.                  |
| `buildMcpViewConfig` | `build/buildMcpViewConfig.js`          | View defaults and the checks that need no pages. Moves `viewPages`, `viewSources` and `viewEndpoints` off `components.mcp` onto the context.                               |
| `validateMcpViews`   | `build/validateMcpViews.js`            | Checks against the route table: every `view.pageId` and `viewPages` entry is a page, and `pathParams` covers the page's path. Runs in the full and the dev skeleton build. |
| `buildMcpViews`      | `build/buildMcpViews.js`               | Full build only, after pages are built. Marks each view page `view: true` and lists what it uses.                                                                          |
| `writeMcp`           | `build/writeMcp.js`                    | Attaches `context.mcpViews` as `views` and writes `mcp.json`. Always written, also for an app with no `mcp` block.                                                         |

The build refuses:

- a tool whose name would be `lowdefy_view_session` (`RESERVED_TOOL_NAME`);
- an operator in `view.pathParams` or `view.urlQuery` that is not in `mcpViewOperators` (`packages/utils/helpers/src/mcpViewOperators.js`, checked by `validateMcpViewOperators`);
- `entrypoint: true` on a tool whose `payloadSchema` has required properties;
- any view or `viewPages` entry without `auth.oauthProvider`;
- a `viewEndpoints` id that is a duplicate or names no endpoint;
- a literal `viewSources` entry that fails `isViewSourceOrigin` (`@lowdefy/helpers`): exactly one `https` or `wss` origin, no path, no `*`.

It does not refuse a view page with `target: mobile`. The runtime does (`isViewPage`).

### `mcp.json`

```json
{
  "name": "...",
  "version": "...",
  "configured": true,
  "hasPublicTool": false,
  "endpoints": [
    {
      "id": "open_ticket",
      "scope": "mcp:read",
      "view": {
        "pageId": "ticket",
        "pathParams": { "ticket_id": { "_payload": "ticket_id" } },
        "entrypoint": false
      }
    }
  ],
  "views": {
    "configured": true,
    "pages": {
      "ticket": {
        "endpoints": [{ "id": "save-ticket", "scope": "mcp:write" }],
        "websockets": ["ticket-feed"],
        "agents": []
      }
    },
    "sources": ["https://files.example.com", { "_secret": "FILES_ORIGIN" }]
  }
}
```

- `views` is always written. With no view config it is `{ configured: false, pages: {}, sources: [] }`.
- `views.configured` is true when at least one tool has a `view`. `viewPages` alone does not set it.
- `view.pathParams` and `view.urlQuery` hold unevaluated operators with `~k` markers. Read the file with `serializer.deserialize`.
- `views.pages` has one key per view page. `endpoints` comes from `context.callApiActionRefs` for the page (a static `CallAPI` `endpointId` only, `InternalApi` left out). `websockets` comes from `context.websocketActionRefs` and the page's `subscriptions`. `agents` is always `[]`: the build collects no page-level agent references.
- An endpoint's scope is its tool scope, else its `viewEndpoints` scope, else `mcp:write`.
- `views.sources` has `_build` resolved. A `_secret` stays an operator for the server (`resolveViewSources`).
- The dev skeleton build writes `views.pages` as `{}`: it builds pages on request, and the dev server serves no views.

A view page's artifact, `pages/{pageId}.json`, carries `view: true`. `_response` is a server operator in `@lowdefy/operators-js`; `ServerParser.parse` takes `response` beside `payload`.

## `/api/mcp`

`packages/servers/server/src/routes/mcp.js` decides the 401 challenge before the transport runs. Past it, every answer is HTTP 200, so a role or scope shortfall is never a 403. It refuses a browser `Origin` that is not the canonical origin or a trusted origin, and answers a `GET` with 405. The view never calls this route itself: the host does, on the view's behalf.

`createMcpServer({ context })` (`packages/api/src/routes/mcp/createMcpServer.js`) builds one server per request with the SDK's low-level `Server`:

- A tool is listed and callable when `context.authorizeOutcome(endpointConfig)` is `allow` and `scopeCovers` holds for the token's granted scopes. A hidden tool answers like an unknown one.
- `tools/call` runs `callEndpoint` with `outsideCaller: true`, then `runAfterToolCall` when `mcp.afterToolCall` is set.

### What views add

All of it is on only when `getMcpViews` returns settings. It returns `null` when `views.configured` is false, in the dev server (`mode: 'dev'`, logged once at info), and when the app has no canonical URL (logged once at warn).

- **Capabilities**: `resources: {}`.
- **`tools/list`**: a tool with a view carries `_meta.ui.resourceUri` and the flat `_meta['ui/resourceUri']`, both `ui://lowdefy/view`, and `_meta['openai/ui'] = { entrypoints: [{ type: 'global' }] }` when `entrypoint` is true (`getViewToolMeta`). When the caller sees at least one such tool, `lowdefy_view_session` is listed with `_meta.ui.visibility: ['app']`.
- **`tools/call`** of a view tool: the reply also carries `structuredContent` (a non-object response is wrapped as `{ response }`) and `_meta['lowdefy/view'] = { path }`. `resolveViewAddress` evaluates `pathParams` and `urlQuery` with the `mcpViewOperators` alone, no secrets and no user, and fills the page's pattern from `routes.json` with `buildPagePath`. `path` starts with `/` and has no origin and no basePath. A failed operator, or a path value that is missing, `.` or `..`, logs `warn_mcp_view_address` and the tool answers with its text result alone.
- **`resources/list` and `resources/read`**: one resource, `ui://lowdefy/view`, mime type `text/html;profile=mcp-app`, for a caller who can see a tool with a view. Anyone else gets an empty list and "Resource not found".

The wire names are in `mcpViewNames.js`. Hosts cache the view's HTML and clients keep their tool list, so a renamed key breaks open views.

### View hosts

`getViewHosts({ config })` returns the hosts the app serves views to, each `{ id, domain, origin }`. It has one entry, Claude: `domain` is the first 32 hex characters of the SHA-256 of `getMcpResourceUri` (canonical URL + basePath + `/api/mcp`, no trailing slash), then `.claudemcpcontent.com`. Claude computes the same from the connector's URL and refuses to render on a mismatch. With no canonical URL it returns `[]`.

Everything that admits a view's origin reads this list: the resource metadata, CORS, the websocket origin check and the client error route. The server reads it through `src/lib/getViewOrigins.js`, which is `[]` for an app without a view. A second host is added in `getViewHosts`.

The resource's content item carries (`getViewResourceMeta`):

- `_meta.ui.domain`: the host's `domain`;
- `_meta.ui.csp.resourceDomains`: the app's origin and `viewSources`;
- `_meta.ui.csp.connectDomains`: the app's origin, its `wss` form and `viewSources`.

`logMcpViews`, called from `initServer.js`, logs the connector URL and the view origin at start (`event: 'mcp_views'`). Resolving the views there also fails the start on a `viewSources` secret that is not set or is not an origin.

## The loader

`renderViewLoader` writes the view's HTML: the two pre-render scripts the app's pages start with (`layerOrderScript`, `darkModeScript`, both in `packages/api/src/html/`), a `#root` div, and the source of `viewLoader` called with `{ origin, basePath }`. It names no build's files, because the host caches it across deploys. The app's `appendHead` and `appendBody` are left out.

`viewLoader.js` runs in the frame. It imports nothing and reads nothing from module scope. In order:

1. `ui/initialize` handshake with the host over `postMessage`, then `ui/notifications/initialized`. It keeps the host context, the tool input and the tool result, and reports the page height with `ui/notifications/size-changed`.
2. `GET {origin}{basePath}/api/view/boot`.
3. With the connection, the boot answer and a tool result that carries `_meta['lowdefy/view'].path`, it sets the hand-over object and adds the stylesheets and the entry script (`<script type="module" crossorigin="anonymous">`).
4. Otherwise it shows the fallback: the tool's title, the result's text and an "Open in browser" button.

### The hand-over object

```
window.__LOWDEFY_VIEW__ = {
  version: 1,
  origin,       // the app's origin
  basePath,     // '' or '/base'
  boot,         // { buildId, js, css }
  toolInput,    // { arguments } as the host sent it, or null
  toolResult,   // the tool's CallToolResult
  host: {
    info, capabilities,
    getContext(),               // displayMode, theme, ...
    onContextChange(listener),  // returns a stop function
    callServerTool({ name, arguments }),
    openLink({ url }),          // ui/open-link
    sendMessage({ text }),      // ui/message
  },
  showFallback({ message }),
};
```

An old loader meets new bundles, so fields are added and never renamed or removed. The loader does not mint the session; the client does. `packages/client/src/host/createViewBridge.js` is the only module that reads this object.

## The view session

The MCP access token works on `/api/mcp` only, so the view asks for a session of its own by calling `lowdefy_view_session` through the host.

**Minting** (`packages/api/src/routes/auth/view/mintViewSession.js`). Needs a valid OAuth caller; a member token and the anonymous caller are refused. It creates a BetterAuth session for the user with the fields `view: true`, `viewClientId` and `viewScopes`, sets `activeOrganizationId` to the grant's organization, prunes, and logs `mcp_view_session_minted`. The tool result is `{ content: [], _meta: { 'lowdefy/viewSession': { token, expiresAt } } }`: `token` is the signed session token the bearer plugin accepts, `expiresAt` an ISO string. `afterToolCall` does not run for it.

Any holder of the MCP bearer can call the tool; `visibility: ['app']` is the host's courtesy. The limits below are what make that safe.

**Lifetime.** `VIEW_SESSION_EXPIRES_IN` is 15 minutes, never extended. BetterAuth would slide the expiry on first read, so `createViewSessionRefreshHook` (`session.update.before`) holds it. `resolveViewSession` also reads the age from `createdAt`.

**Cap.** `VIEW_SESSIONS_PER_GRANT` is 20 per (client, user, organization). `pruneViewSessions` deletes the oldest past that after each mint.

**Grant check.** `resolveAuthentication` calls `resolveViewSession` for a session marked `view`. It returns `context.viewSession = { clientId, grantedScopes }`, or `null` (unauthenticated) when the session is too old, the user is banned, or the consent row for (client, user, organization) is gone. `grantedScopes` is the recorded scopes cut to those the consent row still carries.

The bearer plugin is on when the app has a mobile section or `views.configured` (`getBetterAuthConfig.js`). The session marks and `buildViewSessionGatePlugin` are registered for every app, so a session minted before a deploy that removed the views is still held to the rules.

**In the client** (`packages/client/src/host/createViewSession.js`). The token is in memory only. A 401 to a call that carried it mints once and retries once. A second 401 or a failed mint ends the view with the loader's fallback.

## What a view session may reach

### Refused by default

`refuseViewSession` is registered on `/api/*` after `apiContext`. It answers a view session with 403 `{ name: 'AuthorizationError', message: 'A view session cannot call this route.' }` unless `admitViewSession` marked the route. A route opts in by being listed in `packages/servers/server/src/lib/viewRoutes.js`:

| List      | Routes                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cors`    | `/api/view/boot`, `/api/view/root`, `/api/page/*`, `/api/request/*`, `/api/endpoints/*`, `/api/agent/*`, `/api/user`, `/api/client-error`, `/api/usage` |
| `session` | everything in `cors`, plus `/api/websocket`                                                                                                             |

`app.view.test.mjs` walks `app.routes` and fails if a route answers a view session without being listed.

`/api/auth` resolves no caller in `apiContext`, so it is refused inside BetterAuth: `buildViewSessionGatePlugin` (`onRequest`) answers 403 `{ code: 'VIEW_SESSION_REFUSED' }` when the cookie or the bearer is a view session. `handleMobileSignIn` treats a view session as no session.

`server-dev` mounts its own `refuseViewSession` on `/api/*` and `/*` and admits nothing.

### Held to the view pages

An admitted route still applies its own limits in `@lowdefy/api`. Each check returns at once when `context.viewSession` is none.

| Check                    | Called from                              | Rule                                                                                                             |
| ------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `servesSurface`          | `getPageConfig`                          | Only a view page (`isViewPage`: `view: true` and `target` not `mobile`). Any other page answers `wrong_surface`. |
| `authorizeViewRequest`   | `callRequest`                            | The request's page is a view page.                                                                               |
| `authorizeViewEndpoint`  | `callEndpoint`, `runLinkEndpoint`        | The endpoint id is in `views.pages` of some view page (`readViewReach`).                                         |
| `authorizeViewWebsocket` | `prepareChannel` (subscribe and publish) | The websocket id is listed.                                                                                      |
| `authorizeViewAgent`     | `callAgent`                              | The agent id is listed. The build lists none, so every agent chat is refused.                                    |

The lists are a union over all view pages: the session is not tied to one page. An unlisted id answers like a missing one. Every check also needs a grant that covers `mcp:read`; a grant with no MCP scope reaches nothing. Nested calls are not held to the lists: an endpoint a routine calls, a websocket's check endpoint, a `CallAgent` step.

### Capped by the grant

On a grant without `mcp:write`, `authorizeViewWrite` throws an `AuthorizationError` with `code: 'view_write_required'`. Each server's `errorHandler.js` passes that one code through in the body; the client keeps `body.code` (`decodeErrorBody`), does not reload for it, and shows the server's message.

| Check                            | Called from                                   | Refuses on a read-only grant                                                                          |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `authorizeViewRequestResolver`   | `callRequest`, `handleRequest` (routine step) | A request whose resolver meta is not `checkRead: true` with `checkWrite` not true.                    |
| `authorizeViewRequestProperties` | same                                          | Evaluated request properties that hold `$out` or `$merge` at any depth.                               |
| `authorizeViewWrite`             | `callEndpoint`, `runLinkEndpoint`             | An endpoint whose listed scope is not `mcp:read`.                                                     |
| `authorizeViewAuthStep`          | `handleAuthStep`                              | Every auth step but `ListMembers` and `ListUsers`. `CreateMcpToken` is refused to every view session. |
| `authorizeViewWrite`             | `handleAgentCall`, `authorizeViewAgent`       | A `CallAgent` step and an agent chat.                                                                 |
| `authorizeViewWrite`             | `createChannelRegistry.publish`               | A websocket publish.                                                                                  |

Request types that declare neither check (`AxiosHttp`, `KnexRaw`, `KnexBuilder`, `Redis`, mail, payments) are refused even when a request only reads. The auth step lists are by type name in `authorizeViewAuthStep.js`; `authorizeViewAuthStep.contract.test.js` fails when the auth plugin gains a step that is not placed. A detached `CallApi` carries `viewSession` in its principal and `runDetachedEndpoint` restores it.

`getCallerFingerprint` includes a view session's scopes, so a narrowed grant closes an open socket with 4401 on its next publish, subscribe or minute check.

## The app server for a view

All of this is registered only when `getViewOrigins()` is not empty.

**CORS** (`middleware/viewCors.js`, on `viewRoutes.cors`). Only the exact view origins are answered. A preflight gets 204 with `Access-Control-Allow-Methods: GET, POST`, `Access-Control-Allow-Headers: authorization, content-type, x-lowdefy-build` and `Access-Control-Max-Age: 600`. A response names the one requesting origin, exposes `x-lowdefy-caller`, and never allows credentials. `Vary: Origin` is on every response. Headers are set after `next()`, so a refusal, a 409 and a 504 carry them. `/api/auth` and `/api/mcp` send none.

**Assets.** `allowAnyOrigin` wraps the static middleware, so `/assets/*` and public files send `Access-Control-Allow-Origin: *`. `lowdefy vercel-output` writes the same header into the build output's routes when `mcp.json` has `views.configured`.

**`GET /api/view/boot`** (`routes/viewBoot.js`). Public, `Cache-Control: no-store`. Answers `{ buildId, js, css }`: `js` and each `css` entry is a path that starts with `/` and holds the basePath. 404 when the app has no view or the Vite manifest has no `client/view.jsx` entry. `vite.config.js` adds that entry only when `views.configured` is true.

**`GET /api/view/root`** (`routes/viewRoot.js`). `getRootConfig(context)` for a view session. 401 with no caller, which the view reads as an ended session; 403 for any other caller. No-store, with the caller stamp.

**`/api/client-error`** admits a cross-site report only from a view origin that carries a view session.

**Websocket.** A browser cannot set headers on a handshake, so the view offers exactly two subprotocols, in order: `lowdefy.view`, then `lowdefy.view.bearer.<base64url of the token, no padding>` (`lib/readViewSocketToken.js`; the client side is `getViewSocketProtocols.js`). `getAuthenticationHeaders` turns the second into an `Authorization` header for caller resolution. The server answers `lowdefy.view` only, so the token is never sent back. `isWebSocketOriginAllowed` takes `viewOrigins`; an upgrade from a view origin with no live view session answers 401.

## The client in a view

`packages/servers/server/client/view.jsx` starts `view/startView.jsx`, which reads its root config from `/api/view/root`, its user from `/api/user` and the page from `/api/page`, and passes `Client` the view host. The host, bridge and router are described in [client.md](../packages/client.md#the-view-host).

- **Navigation.** A link to a view page pushes on the view router. When `/api/page` refuses the page, `ViewPage.jsx` restores the shown page and opens the app's URL through the host. `captureViewLinks.js` catches `target="_blank"` anchors, modified clicks, `window.open` and any other document navigation. `createViewOpenLink.js` and `getOpenLinkUrl.js` let only absolute `http` and `https` URLs through.
- **A new build.** The frame is never reloaded: its document is the cached loader. `ViewNewBuild.jsx` shows a button, and `loadViewBuild.js` fetches `/api/view/boot` again, swaps the stylesheets and entry, and restarts at the page it was on.
- **`_mcp` and the actions.** `createMcp.js` builds `lowdefy._internal.mcp` from the bridge, or `null` outside a view. The `_mcp` operator and the `McpSendMessage` and `McpOpenLink` actions read it. `McpEffect.js` re-evaluates blocks that read `displayMode` when the host context changes.
- **Usage.** `createLogUsage` posts `/api/usage` through `host.view.fetchApi`. Its second post, to `https://api.lowdefy.net`, is blocked by the view's content security policy unless the app lists that origin in `viewSources`.
- Sentry is not started in a view.

## Not proven on a real host

The code was checked against a fake loader and canned answers, and three spikes ran in Claude on the web. Still to confirm in Claude: that it forwards a tool result's `_meta` to the view and returns `_meta` on a `tools/call` the view makes, `ui/open-link` and `ui/message`, a display mode change, entry points, and the desktop and mobile apps.

## Key Files

| Component             | File                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| MCP server            | `packages/api/src/routes/mcp/createMcpServer.js`                             |
| Wire names            | `packages/api/src/routes/mcp/mcpViewNames.js`                                |
| View settings         | `packages/api/src/routes/mcp/getMcpViews.js`                                 |
| View hosts            | `packages/api/src/routes/mcp/getViewHosts.js`                                |
| Loader                | `packages/api/src/routes/mcp/viewLoader.js`, `renderViewLoader.js`           |
| View address          | `packages/api/src/routes/mcp/resolveViewAddress.js`                          |
| View session, checks  | `packages/api/src/routes/auth/view/`                                         |
| Build                 | `packages/build/src/build/buildMcp*.js`, `validateMcpViews.js`               |
| Route lists           | `packages/servers/server/src/lib/viewRoutes.js`                              |
| CORS, default refusal | `packages/servers/server/src/middleware/viewCors.js`, `refuseViewSession.js` |
| View entry            | `packages/servers/server/client/view.jsx`, `client/view/`                    |
| View host             | `packages/client/src/host/createViewHost.js`                                 |
