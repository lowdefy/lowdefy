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

The `/.well-known` documents derive their URIs from the pinned `BETTER_AUTH_URL`, never from a request `Host` header, so they are the same for every caller. They mount **only when `auth.oauthProvider` is configured** — an app that is not an authorization server has nothing to discover, and its MCP tools are all public (see the rule below).

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
  icons:
    - src: https://acme.example.com/icon-512.png
      mimeType: image/png
      sizes: ['512x512']
  endpoints:
    - id: search-customers
      scope: mcp:read
    - id: create-invoice
      scope: mcp:write
```

`name`, `version`, `title`, `websiteUrl` and `icons` are the server branding a client shows the user in the `initialize` handshake. Each `endpoints` entry needs an `id` and a `scope`.

**`scope` is a closed vocabulary — `mcp:read` or `mcp:write`, and nothing else.** Apps cannot mint their own scopes. `mcp:write` implies `mcp:read` at runtime, so a token granted write can call both. Tag a tool that only reads with `mcp:read` and one that mutates with `mcp:write`; the consent screen then lets a user grant an assistant read-only access to the whole surface if they choose.

Three rules the build enforces on every tool:

- **Only `Api` endpoints can be tools.** An `InternalApi` endpoint is not reachable as one — it has no external caller by design.
- **Every tool needs a `description` and a `payloadSchema`.** The description is what the assistant reads to decide when to call the tool; the `payloadSchema` becomes the tool's input schema. A tool with neither is not a usable tool, so the build refuses it.
- **The `mcp.agents` key is gone.** MCP agent tools are not supported; remove it if you are upgrading.

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

A token that cannot be verified (for example, an opaque token minted because the client omitted the RFC 8707 `resource` parameter), or one whose grant has been revoked, gets a `401` with a `WWW-Authenticate` challenge that tells the client what to do — reconnect and re-run the authorization, including the organization choice.

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

[`RevokeMcpGrant`](/auth-steps) reads the calling token's `(client, user, organization)` from the request context, deletes that one consent row, and revokes its refresh tokens. It is **caller-scoped**: it touches only the grant the call arrived on, so another assistant the same person connected, or this assistant's grant in another organization, is untouched. It refuses to run for any caller that did not arrive over MCP — there is no grant behind a browser session for it to revoke.

Expose it as an `mcp:read` tool. The next tool call the assistant makes gets a `401`, the client re-runs OAuth, and the user lands back on the organization picker.

## Disconnecting assistants from the app

The mirror control belongs in your app's UI: a person removing every assistant connected to their active organization. It deletes the caller's consent rows for that organization and revokes the matching refresh tokens — the same two writes `RevokeMcpGrant` makes, scoped to the active organization instead of one client:

```yaml
id: disconnect-assistants
type: Api
description: Disconnect every assistant connected to the caller's active organization.
payloadSchema:
  type: object
  additionalProperties: false
  properties: {}
routine:
  - id: revoke_refresh_tokens
    type: MongoDBUpdateMany
    connectionId: oauth-refresh-tokens
    properties:
      filter:
        user_id:
          _user: id
        reference_id:
          _user: organization_id
        revoked: null
      update:
        $set:
          revoked:
            _date: now
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

## Summary

- The app is an OAuth 2.1 authorization server; enable it with `auth.oauthProvider`.
- There is one MCP resource at `/api/mcp`. The organization is a token claim, not a URL segment.
- Tag each tool `mcp:read` or `mcp:write`; a tool is gated by both role and scope.
- **Never list an MCP endpoint id in `auth.api.public`** — one public tool suppresses the challenge for the whole route.
- Consent is per `(client, user, organization)` and read live on every call, so `RevokeMcpGrant` and disconnecting take effect immediately.
- `_user.auth_method` is `'mcp'` for assistant callers.
