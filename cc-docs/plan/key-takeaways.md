# Key Takeaways per File

What each file does today, how the plan affects it, and what to watch for.

---

## Build-Time Files

### `packages/build/src/lowdefySchema.js`

**What it does**: AJV schema that validates the entire lowdefy.yaml config.
`auth.api` and `auth.pages` share identical shapes: `protected`, `public`,
`roles`. Endpoints have no `auth` field in their schema.

**Plan impact**: Add `auth.strategies` array. No changes to `auth.api`,
`auth.pages`, or endpoint schemas.

**Key takeaway**: The schema uses `additionalProperties: false` on `authConfig`.
Adding `strategies` requires explicitly adding it to `properties` or it will be
rejected. The existing auth schema is strict — test schema validation first.

---

### `packages/build/src/build/buildAuth/buildAuth.js`

**What it does**: Orchestrator. Calls `validateAuthConfig`, sets `auth.configured`,
then calls `buildApiAuth`, `buildPageAuth`, `buildAuthPlugins` in sequence.

**Plan impact**: Add a `buildAuthStrategies` call between validation and the existing
build steps.

**Key takeaway**: `auth.configured` is set from `!type.isNone(components.auth)`.
If someone defines ONLY strategies (no providers), `configured` will be `true`.
This triggers `getServerSession` at runtime — verify that NextAuth handles the
no-providers case gracefully.

---

### `packages/build/src/build/buildAuth/buildApiAuth.js`

**What it does**: Reads `auth.api.protected/public/roles` and stamps each endpoint
with `endpoint.auth = { public: true/false, roles?: [...] }`. Uses `getProtectedApi`
and `getApiRoles` helpers.

**Plan impact**: NONE. This file is completely unchanged. Strategies don't affect
endpoint build output. Roles from strategies are checked at runtime, not build time.

**Key takeaway**: This is the file you'd expect to change — the fact that it doesn't
is the strongest signal that the roles-only design is correct. The entire existing
build pipeline remains untouched.

---

### `packages/build/src/build/buildAuth/buildPageAuth.js`

**What it does**: Same as `buildApiAuth` but for pages. Stamps each page with
`page.auth = { public, roles }`.

**Plan impact**: NONE.

**Key takeaway**: Pages remain session-only. Strategies don't affect page auth.

---

### `packages/build/src/build/buildAuth/validateAuthConfig.js`

**What it does**: Validates auth config structure. Sets defaults for empty
`callbacks: []`, `events: []`, `providers: []`. Validates `authPages` references
exist. Calls `validateMutualExclusivity` for protected/public.

**Plan impact**: Extend to validate `strategies` array (or delegate to
`buildAuthStrategies`). Add `strategies: []` default.

**Key takeaway**: This file sets defaults via mutation. Make sure
`components.auth.strategies` defaults to `[]` early, so downstream code can
safely iterate without null checks.

---

### `packages/build/src/build/buildAuth/validateMutualExclusivity.js`

**What it does**: Ensures `protected` and `public` aren't both arrays (you can
have `protected: true` + `public: [list]`, but not both as arrays).

**Plan impact**: NONE. Strategies don't affect this validation.

---

### `packages/build/src/build/buildAuth/getProtectedApi.js` / `getApiRoles.js`

**What they do**: Helper functions. `getProtectedApi` resolves the `protected`
config into a per-endpoint boolean. `getApiRoles` inverts the
`{ role: [endpointIds] }` map into `{ endpointId: [roles] }`.

**Plan impact**: NONE.

**Key takeaway**: The role→endpoint map inversion happens at build time. At runtime,
each endpoint already has its required roles baked in. The authorize function just
does a set intersection between user roles and endpoint roles.

---

### `packages/build/src/build/buildAuth/buildAuthPlugins.js`

**What it does**: Validates provider, callback, event plugin configs. Counts plugin
types via `context.typeCounters.auth`.

**Plan impact**: NONE. Strategies are not plugins (yet — plan defers plugin-based
strategies to the future).

---

## Runtime: API Context

### `packages/api/src/context/createApiContext.js`

**What it does**: Sets `context.state = {}`, `context.steps = {}`,
`context.user = context?.session?.user`, then creates `authorize` and
`readConfigFile`.

**Plan impact**: Must change `context.user` assignment (see BUG-1 in review).

**Key takeaway**: This is the most dangerous change point. The user assignment
must become conditional: `if (type.isNone(context.user))` to avoid overwriting
strategy-resolved users while still supporting `serverSidePropsWrapper` which
doesn't call `resolveAuthentication`.

---

### `packages/api/src/context/createAuthorize.js`

**What it does**: Creates the `authorize(config)` closure. Currently closes over
`session` at creation time — extracts `authenticated` and `roles` once.

**Plan impact**: Change to read `context.user` at call time instead of closing
over session.

**Key takeaway**: The function already receives `context` as its argument
(see `createApiContext` line 25: `createAuthorize(context)`). The change is
purely internal — destructure differently. But existing TESTS pass
`{ session: {...} }` directly and will break. Test updates needed.

---

### `packages/api/src/context/createEvaluateOperators.js`

**What it does**: Creates a `ServerParser` instance with `context.user`,
`context.payload`, `context.secrets`, etc. Used by both `callEndpoint` and
`callRequest` to evaluate `_user`, `_secret`, `_payload`, etc. in operator
expressions.

**Plan impact**: Not mentioned in plan, but works correctly. It reads
`context.user` at creation time (line 20). Since it's created inside
`callEndpoint`/`callRequest` (after `resolveAuthentication` and
`createApiContext` have run), it picks up the strategy-resolved user.

**Key takeaway**: `_user` operator will work for strategy users. But the user
object shape differs — API key users have `{ sub, type, strategyId, roles }`
without OIDC fields like `email` and `name`. Routine authors need to know this.

---

## Runtime: Endpoints

### `packages/api/src/routes/endpoints/callEndpoint.js`

**What it does**: Orchestrates endpoint execution: get config → authorize →
create routine context → run routine → return response.

**Plan impact**: NONE. Authorization still happens via `authorizeApiEndpoint`
which calls `context.authorize(endpointConfig)`. The user was already resolved
upstream.

**Key takeaway**: The response shape is `{ error, response, status, success }`.
External callers get this same shape. If custom response formats are needed
later, this is where they'd be added.

---

### `packages/api/src/routes/endpoints/authorizeApiEndpoint.js`

**What it does**: Calls `context.authorize(endpointConfig)`. On failure, throws
`ConfigError` with "does not exist" message (info-leak prevention).

**Plan impact**: NONE.

**Key takeaway**: This always returns 500 with "does not exist" on auth failure
(the error is caught by `apiWrapper`'s catch block). The plan's proposed
`AuthenticationError` → 401 would need to be handled BEFORE this function runs,
or this function needs to be changed to throw different errors. Currently it
doesn't distinguish between "unauthenticated" and "wrong roles."

---

### `packages/api/src/routes/endpoints/getEndpointConfig.js`

**What it does**: Reads endpoint config from `build/api/{endpointId}.json`.
Returns the full endpoint config including `auth` field (set by `buildApiAuth`).

**Plan impact**: NONE.

---

### `packages/api/src/routes/endpoints/runRoutine.js`

**What it does**: Executes the routine steps (connection calls, branching logic).

**Plan impact**: NONE.

---

## Runtime: Request (Page-Level)

### `packages/api/src/routes/request/callRequest.js`

**What it does**: Handles page-level requests (block → connection). Similar to
`callEndpoint` but for page requests. Calls `authorizeRequest`.

**Plan impact**: Not discussed in plan, but affected by `createAuthorize` change.
Works correctly since page requests always have session auth.

**Key takeaway**: Strategy auth technically works for page requests too (if an
API key user calls `/api/request/...`). Whether this is desirable is undiscussed.
The authorization would check the page's `auth.roles` — only users with matching
roles would pass. This is probably fine but worth explicit testing.

---

### `packages/api/src/routes/request/authorizeRequest.js`

**What it does**: Same pattern as `authorizeApiEndpoint`. Calls
`context.authorize(requestConfig)`, throws "does not exist" on failure.

**Plan impact**: NONE.

---

## Runtime: Auth (NextAuth)

### `packages/api/src/routes/auth/getNextAuthConfig.js`

**What it does**: Initializes NextAuth config once at startup. Parses ENTIRE
`authJson` through `ServerParser` (resolves all `_secret` operators). Creates
adapter, callbacks, events, providers from parsed config. Caches result.

**Plan impact**: The plan creates a SEPARATE `getAuthStrategies` function that
also parses `authJson` through `ServerParser`. This is duplicate work.

**Key takeaway**: `getNextAuthConfig` already resolves `_secret` in strategies
(it parses the whole authJson). The plan should either:
(a) Extract strategies from the parsed `authConfig` inside this function, or
(b) Have `getAuthStrategies` receive pre-parsed data.
Don't create a second ServerParser to parse the same data.

---

### `packages/api/src/routes/auth/callbacks/createSessionCallback.js`

**What it does**: Creates the NextAuth session callback. Copies 20+ OIDC claims
from JWT token to `session.user`. Applies `userFields` mapping. Runs callback
plugins. Adds `hashed_id`.

**Plan impact**: NONE. Session callback only runs for NextAuth sessions, not
strategy auth.

**Key takeaway**: This is where session users get their rich user object. Strategy
users skip this entirely — their user object is simpler (from strategy config
or JWT claims only).

---

## Server Files

### `packages/servers/server/lib/server/apiWrapper.js`

**What it does**: Wraps all API route handlers. Creates context, resolves session,
calls `createApiContext`, logs request, handles errors with 500 status.

**Plan impact**: Add `getAuthStrategies` call (cached), add `resolveAuthentication`
call after session resolution and before `createApiContext`.

**Key takeaway**: Error handling always returns 500. The plan's 401/403 status
codes require modifying the catch block to check error type. Currently all auth
failures surface as 500 with "does not exist" message.

---

### `packages/servers/server/lib/server/serverSidePropsWrapper.js`

**What it does**: Same pattern as `apiWrapper` but for page SSR
(`getServerSideProps`). Creates context, resolves session, calls
`createApiContext`, handles errors.

**Plan impact**: NOT addressed in plan. Must work correctly with the modified
`createApiContext` (see BUG-1).

**Key takeaway**: This file does NOT call `resolveAuthentication` (pages are
session-only). The `createApiContext` change must be conditional to avoid
breaking page auth.

---

### `packages/servers/server/lib/server/auth/getServerSession.js`

**What it does**: Calls `getNextAuthServerSession(req, res, authOptions)` if
`authJson.configured === true`, else returns `undefined`.

**Plan impact**: NONE. Session resolution is unchanged.

**Key takeaway**: If auth is configured (even strategies-only, no providers),
this calls NextAuth's `getServerSession`. Without providers, it returns null
session. That's fine — `resolveAuthentication` then tries strategies.

---

### `packages/servers/server/lib/server/auth/getAuthOptions.js`

**What it does**: Calls `getNextAuthConfig` with auth plugins and secrets.
Returns NextAuth options object.

**Plan impact**: Possibly extend to also return strategy configs (to avoid
double-parsing). Or keep separate.

---

### `packages/servers/server/pages/api/endpoints/[endpointId].js`

**What it does**: Next.js API route handler. Validates POST method. Extracts
`endpointId` from query, `blockId/payload/pageId` from body. Calls
`callEndpoint`.

**Plan impact**: Modify to support external request format (plain JSON body
when `blockId` is absent) and configurable HTTP methods.

**Key takeaway**: The `req.method !== 'POST'` check happens BEFORE auth. An
external caller hitting with GET would get a 500 error before any auth check
runs. HTTP method support should be added before or alongside auth strategies.

---

## Error Package

### `packages/errors/`

**Plan impact**: Add `AuthenticationError` class.

**Key takeaway**: The error package has environment-specific subpaths
(`/server`, `/build`, `/client`). `AuthenticationError` is server-side only.
Follow the existing class hierarchy — probably extends the base `LowdefyError`.
