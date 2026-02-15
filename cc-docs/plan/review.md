# Critical Review: API Auth Strategies Plan

> **Status**: All bugs fixed, all gaps addressed, design concerns resolved.
> See `ApiAuthStrategies.md` section 15 for the full resolution of each finding.

## Verdict

The plan is architecturally sound. The core decision — strategies grant roles,
roles scope endpoints, same pattern as pages — is the right call. It keeps
`auth.api` unchanged, touches minimal files, and the authorization layer
(`createAuthorize`, `buildApiAuth`, `authorizeApiEndpoint`) stays untouched.

The bugs, gaps, and design concerns identified below have all been addressed
in the updated plan (v3). Resolution details are in section 15 of
`ApiAuthStrategies.md`.

---

## Bugs (Will Break Things)

### BUG-1: `createApiContext` will overwrite strategy-resolved user — FIXED

> **Resolution**: Plan section 7.2.3 updated with conditional assignment.
> See section 15.1 of `ApiAuthStrategies.md`.

**Severity**: Critical — strategies would silently not work.

The plan says `resolveAuthentication` runs before `createApiContext`. But
`createApiContext` does this on line 23:

```javascript
context.user = context?.session?.user;
```

This OVERWRITES whatever `resolveAuthentication` set. For API key users,
`context.session` is null, so `context.user` becomes `undefined` — wiping
the strategy-resolved identity.

The plan mentions removing this line (section 7.2.3) but doesn't address
that `serverSidePropsWrapper` also calls `createApiContext` and DOESN'T
call `resolveAuthentication`. Removing the line breaks page auth.

**Fix**: Change `createApiContext` to conditional assignment:
```javascript
if (type.isNone(context.user)) {
  context.user = context?.session?.user;
}
```

This way:
- `apiWrapper`: `resolveAuthentication` sets user first → `createApiContext` doesn't overwrite
- `serverSidePropsWrapper`: no `resolveAuthentication` → `createApiContext` falls back to session

### BUG-2: Sentry user tracking skipped for strategy users — FIXED

> **Resolution**: Plan section 7.2.5 updated — `setSentryUser` moved after
> `resolveAuthentication`. See section 15.2 of `ApiAuthStrategies.md`.

**Severity**: Low — observability gap, not functional.

In `apiWrapper.js`, `setSentryUser` is called BEFORE `resolveAuthentication`:

```javascript
context.session = await getServerSession(context);
setSentryUser({ user: context.session?.user, sentryConfig });  // ← here
resolveAuthentication(context);                                 // ← too late
```

For API key/JWT callers, `context.session?.user` is null, so Sentry never
gets the user identity.

**Fix**: Call `setSentryUser` AFTER `resolveAuthentication`, using `context.user`.

### BUG-3: Build-time key length validation is impossible — FIXED

> **Resolution**: Plan sections 5.2, 6.4, 9.3 updated — validation moved to
> server startup. See section 15.3 of `ApiAuthStrategies.md`.

**Severity**: Low — misleading claim in plan.

Section 9.3 says "Keys should be at least 32 characters (validated at build
time)." But at build time, keys are `_secret` references:

```yaml
keys:
  - _secret: API_KEY_1    # ← this is a reference, not a value
```

The actual key value lives in environment variables and is only resolved at
server startup. You cannot validate key length at build time.

**Fix**: Validate at startup in `getAuthStrategies` after `_secret` resolution.
Log a warning, don't fail the build.

---

## Gaps (Plan is Silent on These)

### GAP-1: `serverSidePropsWrapper` is not addressed — ADDRESSED

> **Resolution**: Plan section 7.2.5 explicitly documents that `serverSidePropsWrapper`
> is intentionally unchanged. See section 15.4 of `ApiAuthStrategies.md`.

The plan only modifies `apiWrapper`. But `serverSidePropsWrapper` also calls
`createApiContext` → `createAuthorize`. Since pages are session-only, this
works IF BUG-1 is fixed with the conditional assignment approach. But the
plan should explicitly state that `serverSidePropsWrapper` is intentionally
left unchanged and explain why.

### GAP-2: `callRequest` (page-level requests) also uses `context.authorize` — ADDRESSED

> **Resolution**: Plan section 8.5 and 15.5 confirm this works correctly.
> `authorizeRequest` gets the same `AuthenticationError` change.

The plan focuses entirely on endpoints. But page-level requests
(`/api/request/[pageId]/[requestId]`) go through `callRequest` →
`authorizeRequest`, which also calls `context.authorize`. The
`createAuthorize` change affects these too.

This actually works correctly — page requests come from browsers with
sessions, so `context.user = session.user` just like today. But the plan
should explicitly confirm this isn't a regression vector and note that
strategy auth technically works for page requests too (API key user could
call a page request if they have the right roles).

### GAP-3: Strategies without providers (API-key-only auth) — CONFIRMED VALID

> **Resolution**: Plan section 15.6 confirms this is a valid and supported configuration.
> `NEXTAUTH_SECRET` only required when `providers.length > 0`.

What if someone wants ONLY API key auth, no NextAuth?

```yaml
auth:
  strategies:
    - id: my-key
      type: apiKey
      properties:
        keys: [{ _secret: KEY }]
      roles: [api-user]
  api:
    protected: true
    roles:
      api-user: [my-endpoint]
```

No `providers`, no `adapter`. Currently `auth.configured` is set when
`auth` is not `isNone` (any auth config present). So this would set
`configured: true`. Then `getServerSession` would call
`getNextAuthServerSession(req, res, authOptions)` with no providers —
NextAuth likely returns null session, which is fine. But `getNextAuthConfig`
would also run, creating empty providers/callbacks/etc.

This should work but needs explicit testing. The plan should confirm this
path is valid or explain if providers are required.

### GAP-4: `_user` operator shape differs for strategy users — DOCUMENTED

> **Resolution**: Plan section 15.7 documents user object shapes per strategy type
> and recommends checking `_user.type` in routines.

The `_user` operator in endpoint routines reads from `context.user`. For
session users, this has OIDC claims (name, email, picture, etc.). For API
key users, it's `{ sub: 'apiKey:...', type: 'apiKey', strategyId: '...', roles: [...] }`.

Routine authors writing `_user.email` will get `undefined` for API key
callers. The plan should document the user object shape per strategy type
and recommend checking `_user.type` in routines that need to handle both.

### GAP-5: Strategy ordering and `Authorization: Bearer` ambiguity — ADDRESSED

> **Resolution**: Plan section 15.8 documents strategy ordering and header
> recommendations. `X-API-Key` preferred for API keys when JWT also configured.

Both `apiKey` and `jwt` strategies can read from `Authorization: Bearer`.
The plan says "first strategy that matches wins" but doesn't discuss:

- If an API key value is sent via `Authorization: Bearer` and a JWT strategy
  is also configured, the JWT strategy will try to parse the key as a JWT
  (and fail). This is fine but wasteful.
- If apiKey's default `headerName` checks both `X-API-Key` AND `Authorization:
  Bearer`, users should use `X-API-Key` for API keys when JWT is also configured.
- Strategy ordering in the YAML array determines resolution priority.

**Recommendation**: Document that `X-API-Key` header is preferred for API
keys. Consider defaulting apiKey to ONLY check `X-API-Key` (not
`Authorization: Bearer`) to avoid ambiguity.

### GAP-6: Double-parsing of `authJson` secrets — FIXED

> **Resolution**: Plan section 6.4 eliminates the separate `getAuthStrategies` function.
> Strategies extracted from the already-parsed `authConfig` inside `getNextAuthConfig`.
> See section 15.9 of `ApiAuthStrategies.md`.

`getNextAuthConfig` already parses the ENTIRE `authJson` (including
strategies) through `ServerParser` with `_secret` resolution (line 39-42
of `getNextAuthConfig.js`). The plan's separate `getAuthStrategies` does
its own `ServerParser` parse — duplicating the work.

**Option A**: Extract strategies from the already-parsed `authConfig` inside
`getNextAuthConfig` and expose them (e.g., `nextAuthConfig.strategies = authConfig.strategies`).

**Option B**: Have `getAuthStrategies` receive the already-parsed strategies
from `getNextAuthConfig` instead of re-parsing.

Either way, avoid creating two `ServerParser` instances that parse the same
data.

---

## Design Concerns (Worth Discussing)

### CONCERN-1: Protected endpoints without roles accept ANY strategy — ACCEPTED

> **Decision**: This is by design. Same as how any session user can access
> protected-but-no-roles endpoints today. Document clearly.

With `auth.api.protected: true` and no roles on an endpoint, ANY authenticated
caller (session, any API key, any JWT) can access it. This is by design —
same as how any session user can access protected-but-no-roles endpoints today.

But with strategies, the blast radius is larger. Before: only browser users.
After: any API key holder or JWT bearer. A misconfigured API key strategy
could grant unintended access to all protected endpoints.

**Mitigation**: Consider a build-time warning if strategies are defined but
some protected endpoints have no role restrictions. Or document this clearly.

### CONCERN-2: Session always wins — no opt-out — ACCEPTED

> **Decision**: This is by design. Prevents privilege escalation.

The plan says "Session auth always takes priority." If a browser user sends
an API key header alongside their session cookie, the session wins. The plan
frames this as "prevents privilege escalation."

But the opposite is also true: a session user CANNOT test an API key from
their browser (the session cookie is always sent). This makes development
harder. Consider logging which auth method was used, so developers can debug.

### CONCERN-3: `AuthenticationError` vs existing "does not exist" pattern — RESOLVED

> **Resolution**: Plan section 8 redesigned with concrete `AuthenticationError` class.
> Unauthenticated (null user) → 401. Wrong roles → existing "does not exist" (500).
> No 403. No `verboseErrors` flag needed. See section 15.10 of `ApiAuthStrategies.md`.

The plan introduces `AuthenticationError` (401) but existing code returns
"does not exist" (hides auth failures). These two patterns conflict. The
plan suggests returning proper 401/403 when strategies are configured, but
strategies are global — there's no per-endpoint flag.

**Question**: Should ALL endpoints return 401/403 when any strategy is
defined? Or should it be opt-in via `auth.api.verboseErrors: true`?
The plan lists this as an open question but the implementation needs a
concrete answer.

### CONCERN-4: No revocation mechanism for API keys — ACCEPTED

> **Decision**: This is acceptable for v1. Document rotation workflow.

API keys have no expiration or revocation other than changing the env var
and restarting. For JWT, token expiration provides natural revocation.
For API keys, a leaked key requires a deployment to rotate. Consider
documenting a rotation workflow (deploy with both old and new keys in the
`keys` array, then remove the old key).

---

## What the Plan Gets Right

1. **Roles-only scoping**: Brilliant simplification. The `auth.api` schema
   stays unchanged. No per-endpoint auth config. Consistent with pages.

2. **Separation of authentication and authorization**: Clean architecture.
   Authentication (who) is resolved before authorization (can they) runs.
   The authorization layer doesn't change at all.

3. **Backwards compatibility**: Zero breaking changes. No strategies defined
   = everything works as before. Incremental adoption.

4. **`_secret` for key storage**: Reuses the existing secure secret
   management. No new secret mechanisms.

5. **Constant-time key comparison**: Correct security practice for API keys.

6. **JWT claim-to-role mapping**: Flexible. Supports Keycloak-style nested
   paths via `get()`. Static + claim roles merged with dedup.

7. **Minimal file changes**: `buildApiAuth`, `buildPageAuth`, `authorizeApiEndpoint`,
   `callEndpoint`, `callRequest` — all unchanged. The plan threads the
   needle of adding capability without disrupting existing flows.
