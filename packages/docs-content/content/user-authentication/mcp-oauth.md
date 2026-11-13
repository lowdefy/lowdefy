# MCP Server &amp; OAuth

A Lowdefy app can expose its API endpoints as tools to an MCP client — Claude, ChatGPT, an IDE assistant — over the Model Context Protocol. When those tools touch anything but public data, the client has to prove who is calling, and Lowdefy handles that by turning the app itself into an **OAuth 2.1 authorization server**: the assistant runs a normal browser authorization, the user signs in, chooses the organization to work in, and grants consent, and the app mints an access token the assistant sends on every tool call.

This page is about the *authenticated* MCP surface. Exposing tools to an app's own agents, and the `mcp` array on an agent (the app acting as an MCP *client*), are covered in [MCP tools for agents](/agent-mcp-tools) and the [`Mcp` connection](/Mcp). Here the app is the *server*, and the caller is an outside assistant.

## One resource, one address

There is a single MCP resource for the whole deployment, served at `/api/mcp`. The organization a call acts in is **not** part of the address — it is chosen once during authorization and carried inside the access token as a claim. Every assistant connects to the same URL; two users, or one user in two organizations, are told apart by their tokens, never by the path.

This is the Linear model — one link, the workspace is a property of the authorization rather than the address — and it is deliberate. An earlier design keyed the resource per organization (`/api/mcp/{organization_id}`); that put the organization in the URL, the RFC 8707 `resource` parameter, and the token audience, and needed a per-organization resource row kept in sync. The single resource deletes all of that: one address to paste, one audience, and the organization rides the token.

| Route | Purpose |
| ----- | ------- |
| `POST /api/mcp` | The MCP resource — streamable HTTP transport. Tools are listed and called here, per request, authorized against the bearer token. |
| `GET /.well-known/oauth-protected-resource/api/mcp` | RFC 9728 protected-resource metadata: the resource URI, the authorization server, and the scopes it supports. Public and constant per deployment. |
| `GET /.well-known/oauth-authorization-server/api/auth` | RFC 8414 authorization-server metadata, re-exposed at the path a client derives from the issuer. |
| `/api/auth/*` | The authorization server itself — authorize, token, registration, and the OAuth endpoints the consent and picker pages call. |

The `/.well-known` documents derive their URIs from the pinned canonical URL (`BETTER_AUTH_URL`, else the current environment's `url`), never from a request `Host` header, so they are the same for every caller. They mount **only when `auth.oauthProvider` is configured** — an app that is not an authorization server has nothing to discover, and its MCP tools are all public (see the rule below).

## Turning the app into an authorization server

Add `auth.oauthProvider`. It names the two pages the browser authorization flow hands control to, and whether unknown clients may register themselves:

```yaml
auth:
  oauthProvider:
    consentPage: /oauth-consent
    postLoginPage: /oauth-select-organization
    dynamicClientRegistration: false
```

- **`consentPage`** *(required)* — the Lowdefy page id of your consent screen. The authorization flow redirects the signed-in user here to approve or deny the client. The engine builds the redirect as `${origin}${basePath}${consentPage}`, joined with no separator, so **the leading slash is required**.
- **`postLoginPage`** — the page where a signed-in user chooses which organization the authorization acts in. It is shown after login and before consent. It is **required under `organizations.policy: tenant`** (the build fails without it) and is skipped under `pinned`, where there is only ever one organization to act in.
- **`dynamicClientRegistration`** — allow unregistered MCP clients to self-register per RFC 7591. Off by default; pre-registered clients are the primary path. Turn it on for public assistants you cannot pre-register.

Both page ids are validated at build time the same way: the page must exist, and it must not be public-listed in a way that would let it render without a session — the flow only ever reaches them for a signed-in user.

## Exposing tools, and their scopes

The app-level `mcp` block declares the server's identity and which API endpoints are tools:

```yaml
mcp:
  name: acme
  version: '1.0.0'
  title: Acme
  websiteUrl: https://acme.example.com
  instructions: Search for a customer before creating an invoice for them.
  icons:
    - src: https://acme.example.com/icon-512.png
      mimeType: image/png
      sizes: ['512x512']
  endpoints:
    - id: search-customers
      scope: mcp:read
      annotations:
        title: Search customers
        readOnlyHint: true
    - id: create-invoice
      scope: mcp:write
      annotations:
        title: Create invoice
        destructiveHint: false
```

`name`, `version`, `title`, `websiteUrl` and `icons` are the server branding a client shows the user in the `initialize` handshake. Each `endpoints` entry needs an `id` and a `scope`.

`annotations` is optional and sent with the tool in `tools/list`. `title` is the name a client shows for the tool. The hints tell a client how the tool behaves, and clients use them to decide whether to ask the user before calling it: `readOnlyHint` (the tool changes nothing), `destructiveHint` (a write may delete or overwrite data), `idempotentHint` (calling it twice with the same input has no further effect) and `openWorldHint` (it reaches systems outside the app). They are hints, not enforcement, and they are not derived from `scope`: an `mcp:read` tool can still write, so only set `readOnlyHint: true` on a tool that really changes nothing.

`instructions` is an optional string sent in the `initialize` result. Clients such as Claude Code place it in the model's system prompt, so use it for a short note on how the tools fit together or when to reach for them. Clients may truncate long instructions, so keep it to a few lines. When it is not set, the server sends no instructions.

**`scope` is a closed vocabulary — `mcp:read` or `mcp:write`, and nothing else.** Apps cannot mint their own scopes. `mcp:write` implies `mcp:read` at runtime, so a token granted write can call both. Tag a tool that only reads with `mcp:read` and one that mutates with `mcp:write`; the consent screen then lets a user grant an assistant read-only access to the whole surface if they choose.

Three rules the build enforces on every tool:

- **Only `Api` endpoints can be tools.** An `InternalApi` endpoint is not reachable as one — it has no external caller by design.
- **Every tool needs a `description` and a `payloadSchema`.** The description is what the assistant reads to decide when to call the tool; the `payloadSchema` becomes the tool's input schema. A tool with neither is not a usable tool, so the build refuses it.
- **The `mcp.agents` key is gone.** MCP agent tools are not supported; remove it if you are upgrading.

## Running an endpoint after every tool call

`afterToolCall` names an API endpoint the server runs after each tool call, once the reply to the client is built. Use it to see what agents do with your tools: which tools they call, with what arguments, and what came back, refusals included.

```yaml
mcp:
  afterToolCall: record-tool-call
  endpoints:
    - id: search-customers
      scope: mcp:read
```

The endpoint is called with this payload:

| Field | Value |
| ----- | ----- |
| `tool` | The tool name the client called. |
| `endpoint_id` | The `id` of the tool's `mcp.endpoints` entry. |
| `scope` | The `scope` of that entry. |
| `payload` | The arguments the tool was called with. |
| `success` | `true` when the tool's endpoint succeeded, `false` when its routine errored or rejected. |
| `response` | The tool endpoint's response, or `null` when `success` is `false`. |

- **It cannot change the reply.** A hook endpoint that throws, is refused, or ends in an error or reject is logged as a warning naming the hook and the tool, and the client gets its reply as if there were no hook.
- **It runs as the tool's caller.** The hook sees the same user, so `_user` is the person the agent acts for, and the hook endpoint's auth is checked against that caller like a `CallApi` step. Give it auth every tool caller passes, or calls by the others are logged as refused.
- **It runs only for a call that reached its tool's endpoint.** An unknown or hidden tool, a role or scope shortfall and a payload the tool's `payloadSchema` rejects never reach the endpoint's routine, so they never run the hook.
- **The reply waits for it.** The hook finishes before the request does, so it is not cut short on serverless platforms that stop work once the response is sent. Keep it quick.

The hook is normally an `InternalApi` endpoint and is not listed in `mcp.endpoints`, so it is never offered as a tool. The build checks that the endpoint it names exists.

## A tool is gated twice

When a call arrives at `/api/mcp`, a tool is listed and callable only when **both** hold:

1. the caller's **role outcome** allows the endpoint — the same `auth.api` / `auth.api.roles` gate every API call passes; and
2. the **token's granted scope** covers the tool's tag.

The 401 challenge is decided once, at the route boundary, before the MCP transport runs. Past that boundary the transport answers over HTTP 200, so a role or scope shortfall never surfaces as a `403` or an `insufficient_scope` error to the assistant — the tool is simply not offered. This is intentional: the tool surface does not disclose the existence of tools the caller may not use.

## The rule that catches everyone: keep MCP endpoints out of `auth.api.public`

> **Never list an MCP endpoint id in `auth.api.public`.**

One public tool suppresses the 401 challenge for the *whole* route. The build sets `mcp.json`'s `hasPublicTool` flag when any exposed endpoint is public, and the `/api/mcp` route then serves an anonymous caller a `200` with the public tools instead of a `401` with the `WWW-Authenticate` challenge. A freshly added assistant reports "connected, 1 tool" and **never runs the OAuth flow** — only a *stale* token would take the challenge branch. Every protected tool then sits behind a door the client was never told to knock on.

So a protected app keeps its `auth.api` gates and leaves every `mcp.endpoints` id out of the public list:

```yaml
auth:
  api:
    protected: true
    # Keep MCP endpoint ids OUT of this list. A single public tool
    # flips mcp.json hasPublicTool, and /api/mcp then serves anonymous
    # callers a 200 with that tool instead of the 401 challenge.
    public:
      - webhooks/stripe   # a webhook receiver, not an MCP tool
```

The build has a matching guard from the other direction: a protected or role-gated MCP endpoint **requires** `auth.oauthProvider`. Without the authorization server there is no way to authenticate the caller, so the build fails rather than shipping an unreachable tool — make the endpoint public (accepting the trade above) or configure `oauthProvider`.

## The authorization flow, end to end

1. The assistant reads `/.well-known/oauth-protected-resource/api/mcp`, finds the authorization server, and (if it is not pre-registered and `dynamicClientRegistration` is on) registers itself.
2. It opens a browser to the authorization endpoint. The user signs in through your normal sign-in page.
3. **Under `tenant`,** the flow redirects to `postLoginPage`. The user picks the organization to work in; the page sets it active and continues the authorization. **Under `pinned`,** this step is skipped.
4. The flow redirects to `consentPage`. The user approves the client and the requested scopes — or, if they have already consented for this client in this organization, consent is skipped.
5. The app mints an access token whose **`organization_id` claim is the chosen organization** (the consent `referenceId`), and the assistant sends it as a `Bearer` token on every `/api/mcp` call.

Consent is recorded per **(client, user, organization)**. Re-authorizing into an organization the user has already consented for skips the consent screen; a first authorization into a *different* organization asks for consent again, for that organization.

### How a token becomes a caller

On every `/api/mcp` request the token is verified in-process against the authorization server's own signing keys: the issuer and audience must match the resource, and the token must carry both a `sub` (the user) and an `organization_id` claim. The claim is not trusted on its own — the **consent row for `(client, user, organization)` must still exist**. That liveness read on every call is what makes switching and disconnecting take effect *immediately*: revoke the grant and the next call is refused at once, not at the token's expiry.

The caller is then resolved as a member of that organization, exactly as a session caller is — same membership wall, same role source, same `_user` shape — with one extra field: **`_user.auth_method` is `'mcp'`**, so a routine can tell an assistant apart from a browser without any app-side plumbing.

```yaml
# In an endpoint routine, branch on how the caller arrived:
- id: set_channel
  type: SetState
  params:
    channel:
      _if:
        test:
          _eq:
            - _user: auth_method
            - mcp
        then: mcp
        else: ui
```

A token that cannot be verified (for example, an opaque token minted because the client omitted the RFC 8707 `resource` parameter), one whose grant has been revoked, or one whose user is no longer a member of the token's organization (removed, left, or the user deleted), gets a `401` with a `WWW-Authenticate` challenge that tells the client what to do — reconnect and re-run the authorization, including the organization choice. The authorization server also refuses to refresh a grant whose user is no longer a member of its organization (`invalid_grant`), so a client holding a refresh token falls back to the full authorization instead of refreshing into another refused token.

## Building the consent and picker pages

Both pages are ordinary Lowdefy pages that read the authorization request from the URL query, show the user what is being asked, and finish the flow with client actions. Four actions do the work:

| Action | What it does |
| ------ | ------------ |
| `ListOrganizations` | Returns the caller's organization memberships — the rows the picker renders. |
| `SetActiveOrganization` | Sets the caller's active organization. The picker calls it for the chosen organization. |
| `OAuthContinue` | Continues the authorization after the organization is chosen (`POST /api/auth/oauth2/continue`). Returns `{ url }` to redirect to. |
| `OAuthConsent` | Approves (`accept: true`) or denies (`accept: false`) the client. Returns `{ url }` to redirect to. |

### The organization picker (`postLoginPage`)

On mount the page calls `ListOrganizations` and stores the rows in state; a `ListSelector` renders them, and its click handler sets the chosen organization active and continues:

```yaml
id: select_org_rows
type: ListSelector
properties:
  selectable: false
  hoverable: true
  data:
    _state: organizations
events:
  onClick:
    - id: set_active_organization
      type: SetActiveOrganization
      skip:
        _eq:
          - _event: item.id
          - _user: organization_id
      params:
        organizationId:
          _event: item.id
    - id: continue_authorization
      type: OAuthContinue
      messages:
        error: false
    - id: continue_redirect
      type: Link
      params:
        url:
          _actions: continue_authorization.response.url
```

`SetActiveOrganization` is skipped when the chosen organization is already the active one, so re-picking the current organization is a no-op that still continues the flow.

### The consent screen (`consentPage`)

Reads the request from the query, shows the client and scopes, and finishes on the user's decision:

```yaml
id: consent_allow
type: Button
properties:
  title: Allow access
events:
  onClick:
    - id: consent_allow_action
      type: OAuthConsent
      messages:
        error: false
      params:
        accept: true
    - id: consent_allow_redirect
      type: Link
      params:
        url:
          _actions: consent_allow_action.response.url
```

The deny button is identical with `params: { accept: false }`. Read `_url_query: client_id` and `_url_query: scope` to render what the client is asking for, and `_url_query: resource` to confirm the audience. Fetch the client's own metadata (name, logo) from `/api/auth/oauth2/public-client?client_id=...` to show a human-readable client name rather than an opaque id.

## Switching organization from the assistant

An assistant connected to one organization switches by *disconnecting* — the client then re-runs the authorization and the user picks a different organization. Expose a tool that revokes the calling grant with the `RevokeMcpGrant` step:

```yaml
id: switch-organization
type: Api
description: >
  Disconnect this assistant from the organization it is connected to so
  the user can connect it to another one. Use ONLY when the user asks to
  work in a different organization. After it succeeds the connection is
  gone: tell the user to reconnect in their assistant — the browser will
  ask which organization to connect to.
payloadSchema:
  type: object
  additionalProperties: false
  properties: {}
routine:
  - id: revoke_grant
    type: RevokeMcpGrant
  - ':return':
      disconnected: true
      organization_id:
        _step: revoke_grant.organizationId
      message: >-
        Disconnected. Ask the user to reconnect in their assistant.
```

[`RevokeMcpGrant`](/auth-steps) reads the calling token's `(client, user, organization)` from the request context, deletes that one consent row, and deletes its access and refresh tokens. It is **caller-scoped**: it touches only the grant the call arrived on, so another assistant the same person connected, or this assistant's grant in another organization, is untouched. It refuses to run for any caller that did not arrive over MCP — there is no grant behind a browser session for it to revoke.

Expose it as an `mcp:read` tool. The next tool call the assistant makes gets a `401`, the client re-runs OAuth, and the user lands back on the organization picker.

## Disconnecting assistants from the app

The mirror control belongs in your app's UI: a person removing every assistant connected to their active organization. It deletes the caller's consent rows, access tokens and refresh tokens for that organization — what `RevokeMcpGrant` does, scoped to the active organization instead of one client. Delete the access tokens before the refresh tokens they reference, and delete the refresh tokens rather than marking them revoked: the authorization server treats a revoked refresh token presented again as theft, and the client's next refresh would then delete every token it holds for the user, in every organization:

```yaml
id: disconnect-assistants
type: Api
description: Disconnect every assistant connected to the caller's active organization.
payloadSchema:
  type: object
  additionalProperties: false
  properties: {}
routine:
  - id: delete_access_tokens
    type: MongoDBDeleteMany
    connectionId: oauth-access-tokens
    properties:
      filter:
        user_id:
          _user: id
        reference_id:
          _user: organization_id
  - id: delete_refresh_tokens
    type: MongoDBDeleteMany
    connectionId: oauth-refresh-tokens
    properties:
      filter:
        user_id:
          _user: id
        reference_id:
          _user: organization_id
  - id: delete_consents
    type: MongoDBDeleteMany
    connectionId: oauth-consents
    properties:
      filter:
        user_id:
          _user: id
        reference_id:
          _user: organization_id
  - ':return':
      disconnected:
        _step: delete_consents.deletedCount
```

Because the `/api/mcp` route reads the live consent row on every call, every affected assistant is refused on its next call, not at token expiry.

## Tokens for scripts

An assistant a person connects from a browser holds an OAuth grant. A script that runs on its own — a worker loop, a CI job — has no browser to sign in again when something goes wrong, so it uses a **member token** instead: a long-lived bearer a member creates for themselves, stored hashed, that the script sends on every call to `/api/mcp`.

A member token needs the authorization server above (`auth.oauthProvider`). Without it the route authenticates nobody, so a token would reach nothing, and `CreateMcpToken` refuses.

A call with a member token is served as the member who made it: their roles, attributes and organization, read live on every call, and `_user.auth_method` is `'mcp'`, the same as an assistant. A token carries both `mcp:read` and `mcp:write`, so the member's roles alone decide which tools it reaches.

### Creating a token

A member creates a token for themselves, in their active organization, from a signed-in session. `CreateMcpToken` refuses any other caller — an assistant, another token, an API strategy caller — so nothing that holds a narrower or shorter-lived credential can turn it into a token.

```yaml
id: create-mcp-token
type: Api
payloadSchema:
  type: object
  additionalProperties: false
  required: [name, expires_in_days]
  properties:
    name:
      type: string
      minLength: 1
    expires_in_days:
      type: [integer, 'null']
      minimum: 1
routine:
  - id: create
    type: CreateMcpToken
    properties:
      name:
        _payload: name
      expiresInDays:
        _payload: expires_in_days
  - ':return':
      _step: create
```

`expiresInDays` is a positive whole number of days, or `null` for a token that never expires. The step sets no ceiling: an app that wants one checks the payload before the step. It returns `{ id, token, start, expiresAt }`. `token` appears here and nowhere else — only its SHA-256 and `start`, its first 12 characters, are stored — so show it once and tell the person to copy it.

A token starts with `ldf_mcp_`, so secret scanners and people can recognise a leaked one.

### Calling with a token

The script sends the token as a bearer:

```bash
curl https://app.example.com/api/mcp \
  -H "Authorization: Bearer ldf_mcp_..." \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

A refused token gets a `401` whose challenge says why, with no `resource_metadata`, since a script cannot sign in:

```
WWW-Authenticate: Bearer error="invalid_token", error_description="This token has expired."
```

The three reasons are *This token was switched off or does not exist*, *This token has expired*, and *This token's member can no longer use it*. The last covers a member who left or was removed, a deleted or banned user, and a token for an organization other than a pinned app's own. A token works only for the member row it was made for, so a member who leaves and rejoins holds none of their old tokens.

### Switching a token off

`RevokeMcpToken` deletes one of the caller's own tokens by `id`. `RevokeOrgMcpToken` deletes any token in the organization, for owners and admins (`member: [update]`). Both return the token's `{ id, userId, memberId, name, start }` for an audit event, and the token is refused on its next call. `RemoveMember`, `LeaveOrganization` and `DeleteUser` delete the member's tokens too.

### Listing tokens

Tokens live in the `user-mcp-tokens` collection, one document per token with `_id`, `organization_id`, `user_id`, `member_id`, `name`, `hash`, `start`, `created_at`, `expires_at` and `last_used_at` (written at most once an hour). Read them through a MongoDB connection, as the [disconnect example](#disconnecting-assistants-from-the-app) reads the OAuth collections, and always project out `hash`:

```yaml
id: get_my_mcp_tokens
type: MongoDBFind
connectionId: mcp-tokens
properties:
  query:
    user_id:
      _user: id
    organization_id:
      _user: organization_id
  options:
    projection:
      hash: 0
    sort:
      created_at: -1
```

For an owner's or admin's list, filter on `organization_id` alone. Pass a document's `_id` as `id` to the revoke steps.

## Views

A tool can name a page of the app as its **view**. When Claude calls the tool, the page opens inside the conversation, signed in as the person who connected the app. It is the app's real page: it loads the app's own client from the app's server and calls its requests and endpoints.

Views work in Claude only. Other MCP clients get the tool's text result.

### Config

```yaml
mcp:
  endpoints:
    - id: search-tickets
      scope: mcp:read
    - id: open_ticket
      scope: mcp:read
      annotations:
        title: Open ticket
      view:
        pageId: ticket
        pathParams:
          ticket_id:
            _payload: ticket_id
        urlQuery:
          tab:
            _response: default_tab
        entrypoint: false
  viewPages:
    - customer
  viewSources:
    - https://files.example.com
  viewEndpoints:
    - id: ticket-comments
      scope: mcp:read
```

Here the `ticket` page has `path: /tickets/{ticket_id}`. A call to `open_ticket` with `ticket_id: T-42` runs the endpoint, then shows the page at `/tickets/T-42?tab=...`.

`view` on an `endpoints` entry addresses a page the way the `Link` action does:

- **`pageId`** *(required)*: the page that shows this tool. A fixed string, not an operator.
- **`pathParams`**: a value for every placeholder in the page's `path`. The build fails if one is missing.
- **`urlQuery`**: the page's URL query.
- **`entrypoint`**: list the view in Claude outside a conversation. Default `false`. Claude calls an entry point with no arguments, so the build refuses `entrypoint: true` on a tool whose `payloadSchema` has required properties. Claude shows entry points only to organizations that have that feature.

`pathParams` and `urlQuery` are evaluated on the server after each call. `_payload` is the arguments Claude passed. `_response` is what the endpoint's routine returned, and is used like `_payload`: `_response: default_tab`. The resulting address is sent to the MCP client, so only these operators are allowed there: `_payload`, `_response`, `_and`, `_array`, `_boolean`, `_eq`, `_get`, `_if`, `_if_none`, `_ne`, `_not`, `_number`, `_object`, `_or`, `_regex`, `_string`, `_switch`, `_type` and `_uri`. The build refuses any other, including `_secret`, `_user` and `_js`.

If a path value comes out empty for a call, or an operator fails, the tool still answers with its text result and no view opens.

The other three keys sit on `mcp`:

- **`viewPages`**: more page ids a view may show without a tool of their own. Use it for pages reached by a link from a view.
- **`viewSources`**: other origins a view page loads from or calls, such as a file store or a map tile server. Claude blocks every origin a view does not declare. Each entry must be exactly one `https://` or `wss://` origin, with no path and no wildcard. An entry may be a `_build` operator or a `_secret`; a secret is checked when the server starts.
- **`viewEndpoints`**: a scope for each endpoint a view page calls that is not a tool. See [what a view can reach](#what-a-view-can-reach).

A **view page** is a page some tool names in `view.pageId`, or one `viewPages` lists.

The build also enforces:

- **Views need `auth.oauthProvider`.** A view signs in with the OAuth grant, and its address is computed from the app's pinned public URL.
- **The tool name `lowdefy_view_session` is reserved.** The server adds that tool itself; a view calls it to sign in. An endpoint whose id would become that name is refused.
- A `view.pageId`, a `viewPages` entry and a `viewEndpoints` id must each exist.

A view page cannot be a mobile page. A page with `target: mobile` is not shown in a view, even when a tool names it.

### Put a view on a tool made for it

Claude opens the view on every call of the tool. Agents call an app's read tools all the time, so a tool that only returns data should keep no view. Add a tool whose job is to show something, such as `open_ticket`, and put the view there. A tool that could show several pages is several tools.

### Adding the connector

Claude runs a connector's views on an origin it computes from the connector's URL. The server computes the same origin from the app's MCP URL. If they differ, Claude refuses to show the view.

So add the connector with **exactly** the app's MCP URL: the pinned public URL (`BETTER_AUTH_URL`, else the current environment's `url`), then the `basePath`, then `/api/mcp`. The server logs it at start, with the view origin:

```
MCP views are on. Add the connector with exactly the URL https://app.example.com/api/mcp. Its views run on https://<hash>.claudemcpcontent.com.
```

If the app has no pinned public URL, the server logs a warning and serves its tools without views.

### What a view can reach

A view signs in by itself, as the person who connected, in the organization of their grant. Its session lasts 15 minutes and the view renews it without a prompt. It ends at once when the grant is revoked. A script using a member token cannot open a view.

That session is limited to what the view pages need. It can reach:

- **View pages only.** A link to a view page navigates in place. Every other page opens in the browser.
- **The requests of view pages.**
- **The endpoints and websocket channels that view pages use.** The build lists them from each view page's `CallAPI` actions and subscriptions.

It cannot reach:

- **An endpoint called with a computed id.** The build lists a `CallAPI` only when its `endpointId` is a fixed string. If `endpointId` is an operator, the call is refused in a view.
- **Agents.** No agent is available on a view page. An agent chat on a view page is refused.
- **Anything under `/api/auth`.** A view cannot sign out, change the account or switch organization.

### Read-only connections

A view never does more than the person granted. With `mcp:write`, the person's roles decide, as in the browser. With `mcp:read` only, the view reads:

- **Requests.** Only a request type that declares itself a read and not a write runs, such as `MongoDBFind`, `MongoDBAggregation` or `ElasticsearchSearch`. Types that do not declare a read are refused even when your request only reads. That covers HTTP (`AxiosHttp`), SQL (`KnexRaw`, `KnexBuilder`), `Redis`, mail and payment requests.
- **Aggregations.** A MongoDB aggregation that contains `$out` or `$merge` is refused.
- **Endpoints.** An endpoint runs only when its scope is `mcp:read`. A tool has its scope already. For an endpoint that is not a tool, set it under `viewEndpoints`. **An endpoint with no scope counts as `mcp:write`.**
- **Steps inside a read endpoint.** Tagging an endpoint `mcp:read` does not let it write. Its request steps follow the request rule above. Of the auth steps, only `ListMembers` and `ListUsers` run. A `CallAgent` step needs write access.
- **Websockets.** Subscribing works. Publishing is a write.

`CreateMcpToken` is refused in every view, with or without write access.

A refused write shows the message "This connection is read-only. Reconnect with write access to make changes."

**Say this on your `consentPage`.** When the person grants read-only access, tell them that views opened from this connection can show data but cannot change it, and that they need to grant write access to make changes from a view.

### Pages that know they are in a view

- [`_mcp: embedded`](/_mcp) is `true` inside a view and `null` in the browser. Use it to drop the app's own chrome, such as the menu and header.
- [`_mcp: displayMode`](/_mcp) is how Claude shows the view: `inline`, `fullscreen` or `pip`.
- [`McpSendMessage`](/McpSendMessage) sends Claude a message from the page.
- [`McpOpenLink`](/McpOpenLink) opens a URL or a page of the app in the browser.

The tool's arguments and result reach the page only as its path and URL query.

### Limits inside a view

The view runs in a sandbox on another origin than the app:

- `alert`, `confirm`, `print` and file downloads do nothing.
- Links to anything but a view page open in the browser. That includes `newTab` links, `target="_blank"` anchors and `window.open`. Only `http` and `https` links open.
- The app's `appendHead` and `appendBody` HTML is not loaded.
- Usage telemetry to the Lowdefy API is blocked, because the view may only call origins it declares. Add `https://api.lowdefy.net` to `viewSources` to send it.

When a view cannot load or sign in, it shows the tool's title, its result as text and an **Open in browser** button. After a deploy, an open view shows "This app has been updated." with a button that loads the new version.

### Testing a view

The dev server serves no views. It serves the tools without them and logs why.

Test against a built app on a public `https` hostname. Use a deployment, or a named tunnel on a domain you control.

1. Point the hostname at the port the app will run on.
2. Set `BETTER_AUTH_URL` to `https://` and that hostname, so the view origin matches.
3. Build and start the app.
4. Copy the connector URL from the start-up log line and add it to Claude as a custom connector.
5. Ask Claude to call the tool.

**Do not use a quick tunnel.** A quick tunnel is one with a random address on the tunnel provider's own domain, such as `trycloudflare.com`. In our testing, an app on such an address finished sign-in and consent and issued Claude a token, and Claude then made no call with it and reported that the server refused its request. The same app connected on a hostname of our own domain. A quick tunnel does work for an MCP server with no sign-in.

Views were tested in Claude in a web browser and in the Claude desktop app. Claude Code calls tools as text and shows no view.

## Summary

- The app is an OAuth 2.1 authorization server; enable it with `auth.oauthProvider`.
- There is one MCP resource at `/api/mcp`. The organization is a token claim, not a URL segment.
- Tag each tool `mcp:read` or `mcp:write`; a tool is gated by both role and scope.
- **Never list an MCP endpoint id in `auth.api.public`** — one public tool suppresses the challenge for the whole route.
- Consent is per `(client, user, organization)` and read live on every call, so `RevokeMcpGrant` and disconnecting take effect immediately.
- `_user.auth_method` is `'mcp'` for assistant callers.
- A script uses a member token (`CreateMcpToken`), served as its member and switched off with `RevokeMcpToken` or `RevokeOrgMcpToken`.
- A tool with a `view` opens a page of the app inside Claude. A view reaches only view pages and what they use, and a read-only grant gives a read-only view.
