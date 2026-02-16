# Systems Review: API Auth Strategies Plan

Independent critical review from a systems architecture perspective.
Every claim verified against actual source code.

---

## Overall Assessment

The core design — strategies grant roles, roles scope endpoints, `auth.api` unchanged
— is solid. The roles-only scoping is genuinely elegant and the right call for this
codebase. The plan also correctly identifies that `resolveAuthentication` should slot
in as a new step in `apiWrapper`, before `createApiContext`, without touching the
authorization layer at all.

That said, reading the plan against the actual code reveals several real issues:
architecture problems that would cause confusion during implementation, a security
flaw in the API key comparison, over-logging of auth failures, and a naming collision
that muddies the NextAuth config object. None are fatal, all are fixable, but they
need addressing before code is written.

---

## 1. Architecture Issues

### 1.1 NextAuth config object is being used as a general auth container

**Severity**: Medium — design smell that creates coupling.

The plan (section 6.4) adds `nextAuthConfig.strategies = authConfig.strategies ?? []`
to the object returned by `getNextAuthConfig`. This object is the **NextAuth options
object** — it gets passed directly to `NextAuth(req, res, context.authOptions)` in
`[...nextauth].js` (line 34).

NextAuth currently ignores unknown properties, but:
- Conceptually, the NextAuth config object shouldn't carry non-NextAuth concerns
- The plan already added `nextAuthConfig.originalRedirectCallback` — so there's
  precedent. But that's a NextAuth callback, not an entirely separate auth system
- For strategies-only configs (no providers), `getNextAuthConfig` initializes empty
  NextAuth infrastructure just to carry strategies
- If NextAuth ever validates its options (strict mode, new version), this breaks

**Recommendation**: Extract strategies separately. `getAuthOptions` already wraps
`getNextAuthConfig`. It could return `{ ...nextAuthConfig, strategies }` rather than
mutating the NextAuth config singleton. Or better: have `getAuthOptions` return
`{ nextAuth: nextAuthConfig, strategies: authConfig.strategies ?? [] }` and update
consumers. This keeps concerns separate.

Alternatively — since `getNextAuthConfig` already parses the full `authJson` — add
a separate export like `getResolvedAuthStrategies()` that reads from the same cached
parse result without polluting the NextAuth options object.

### 1.2 `getServerSession` calls NextAuth unconditionally for strategies-only configs

**Severity**: Medium — unnecessary async work on every request.

`getServerSession.js` (line 22) checks `authJson.configured === true`. For a
strategies-only config (no providers), `configured` is `true` (set in `buildAuth.js`
line 28 from `!type.isNone(components.auth)`). So every request calls NextAuth's
`getServerSession(req, res, authOptions)` with zero providers.

NextAuth with empty providers likely returns `null` session, but:
- It's wasted async work on every API request
- NextAuth's behavior with zero providers is undefined/undocumented
- It may log warnings or errors internally

**Recommendation**: Add a short-circuit. Either:
- Check `authOptions.providers?.length > 0` before calling NextAuth, or
- Add `authJson.hasProviders` as a build artifact flag, or
- Let `getServerSession` check `context.authStrategies.length > 0 && !context.authOptions.providers?.length` and skip the NextAuth call

This matters for production: if you're running a pure API-key service handling 1000
req/s, you don't want 1000 pointless NextAuth calls per second.

### 1.3 `resolveAuthentication` export path not addressed

**Severity**: Low — implementation detail, but will block the first PR.

The plan places `resolveAuthentication` in `packages/api/src/context/`. But
`apiWrapper.js` lives in `packages/servers/server/`. Currently `apiWrapper` imports
`createApiContext` from `@lowdefy/api`:

```javascript
import { createApiContext } from '@lowdefy/api';
```

`resolveAuthentication` needs to be exported from `@lowdefy/api`'s package entry
point. The plan doesn't mention updating `packages/api/src/index.js` (or wherever
the package exports are defined). Check how `createApiContext` is exported and mirror
that for `resolveAuthentication`.

### 1.4 `context.authStrategies` is never set in the `apiWrapper` code

**Severity**: Medium — the plan's own code won't work as written.

Section 7.2.5 shows the `apiWrapper` code calling `resolveAuthentication(context)`.
But `resolveAuthentication` (section 7.2.1) reads `context.authStrategies`:

```javascript
const strategies = context.authStrategies ?? [];
```

The section 6.4 prose mentions `context.authStrategies = context.authOptions.strategies ?? []`
but the actual `apiWrapper` code block in section 7.2.5 never sets this. Someone
implementing from the code blocks would get zero strategies resolved.

**Fix**: Add the line to the `apiWrapper` code block, after `getAuthOptions` and
before `resolveAuthentication`:

```javascript
context.authOptions = getAuthOptions(context);
context.authStrategies = context.authOptions.strategies ?? [];
```

### 1.5 Phase 3 (external format + HTTP methods) should be a separate effort

**Severity**: Low — scope creep risk.

Supporting plain JSON bodies and configurable HTTP methods (section 7.3) are
independent features that don't require auth strategies. Bundling them:
- Increases the PR size and review burden
- Mixes auth concerns with request format concerns
- Means auth strategies can't ship without also shipping format changes

**Recommendation**: Phase 3 should be a follow-up. Auth strategies work fine with
the current POST-only, `{ blockId, payload, pageId }` format. External callers can
adopt that format. The format improvement is nice but not blocking.

---

## 2. Security Issues

### 2.1 API key length leak via timing

**Severity**: High — undermines the constant-time comparison.

The `resolveApiKeyStrategy` code (section 7.2.2) does:

```javascript
const keyBuffer = Buffer.from(key);
for (const configuredKey of properties.keys) {
  const configuredBuffer = Buffer.from(configuredKey);
  if (keyBuffer.length === configuredBuffer.length
      && crypto.timingSafeEqual(keyBuffer, configuredBuffer)) {
    return { authenticated: true, user: ... };
  }
}
```

The `keyBuffer.length === configuredBuffer.length` check is a fast-path rejection
that leaks key length via timing. An attacker can send keys of different lengths and
measure response time to determine the target key's length. `timingSafeEqual`
**requires** equal-length buffers (throws if they differ), which is why the check
exists. But the approach defeats the purpose.

**Fix**: Hash both values with SHA-256 first, then compare the hashes. Hashes are
always the same length (32 bytes), so `timingSafeEqual` always runs:

```javascript
import crypto from 'crypto';

function constantTimeKeyMatch(input, configured) {
  const inputHash = crypto.createHash('sha256').update(input).digest();
  const configuredHash = crypto.createHash('sha256').update(configured).digest();
  return crypto.timingSafeEqual(inputHash, configuredHash);
}
```

This is the standard pattern used by production API gateways.

### 2.2 No rate limiting mention for failed auth attempts

**Severity**: Medium — brute force vector.

Section 9.6 says "Not in scope." Fair for v1. But the plan should at minimum
recommend users put a reverse proxy with rate limiting in front of their Lowdefy
app, or note that strategy failures (invalid keys, expired JWTs) are logged at
debug level but NOT counted anywhere. An attacker could try millions of API keys
with no throttling.

---

## 3. Logging and Error Handling Issues

### 3.1 `AuthenticationError` triggers full error logging pipeline

**Severity**: Medium — log spam in production.

`logError.js` (line 38-133) processes every error with:
- Config location resolution (`resolveErrorConfigLocation`)
- Full structured logging (headers, user, URL, method)
- Sentry capture (`captureSentryError`)

`AuthenticationError` extends `Error` (not `LowdefyError` or `ServiceError`), so
`logError` will:
1. Call `resolveErrorConfigLocation` — `AuthenticationError` has no `configKey`,
   so this returns null. Wasted async work
2. Log a full structured error entry with all headers
3. Send to Sentry

For an external API receiving probing traffic, every unauthenticated request
generates a full error log + Sentry event. At scale, this floods logs and burns
Sentry quota.

**Recommendation**: Either:
- Make `logError` recognize `AuthenticationError` and log at `warn` level (no
  Sentry, no config resolution), or
- Handle `AuthenticationError` in `apiWrapper`'s catch block BEFORE calling
  `logError` — log a one-line warning and return 401, skip the full pipeline:

```javascript
catch (error) {
  if (error instanceof AuthenticationError) {
    context.logger.warn({ event: 'auth_required', url: req.url });
    return res.status(401).json({ name: error.name, message: error.message });
  }
  await logError({ error, context });
  res.status(500).json({ name: error.name, message: error.message });
}
```

### 3.2 `AuthenticationError` lacks `print()` and `serialize()`

**Severity**: Low — won't crash, but inconsistent with error hierarchy.

All other error classes (`ConfigError`, `PluginError`, `ServiceError`, `LowdefyError`)
implement `print()` and `serialize()`. `AuthenticationError` extends plain `Error`
with no methods. `logError` falls back to `[AuthenticationError] message` format
(line 119), which works. But if `AuthenticationError` ever needs to cross a
serialization boundary (e.g., client-side logging), it won't round-trip.

**Recommendation**: Add `print()` at minimum. `serialize()`/`deserialize()` are
optional if the error is truly server-side only and handled before `logError`.

### 3.3 Plan contradicts itself on 403 status

**Severity**: Low — copy-paste artifact.

Section 7.3.3 shows:
```javascript
} else if (error.name === 'AuthorizationError') {
  res.status(403).json({ name: error.name, message: error.message });
}
```

But section 8.3 explicitly says "**No 403 status code.**" and explains why.
Section 7.3.3 is from an earlier plan version and wasn't updated.

**Fix**: Remove the `AuthorizationError` / 403 code from section 7.3.3.

---

## 4. Implementation Correctness

### 4.1 `null` → `undefined` user conversion is subtle but works

The flow for unauthenticated requests:

1. `resolveAuthentication` sets `context.user = null`
2. `createApiContext` checks `type.isNone(null)` → `true` → overwrites with
   `context?.session?.user` → `undefined`
3. `authorizeApiEndpoint` checks `type.isNone(undefined)` → `true` → throws
   `AuthenticationError`

Functionally correct. But `context.user` silently changes from `null` to
`undefined` between steps 1 and 2. Someone debugging will see `undefined` in
`authorizeApiEndpoint` and wonder why `resolveAuthentication` didn't set it.

**Recommendation**: Either have `resolveAuthentication` not set `context.user`
at all when no auth succeeds (let `createApiContext` handle it), or have
`createApiContext` check for `undefined` specifically instead of `isNone`:

```javascript
if (type.isUndefined(context.user)) {
  context.user = context?.session?.user;
}
```

This way, `resolveAuthentication`'s explicit `null` is preserved, and
`createApiContext` only acts when `resolveAuthentication` hasn't run at all
(the `serverSidePropsWrapper` case, where `context.user` is truly `undefined`).

### 4.2 JWT resolver only implements HMAC, but plan documents JWKS

Section 5.3 describes full JWKS support (option B with `jwksUri`). But the
implementation code in section 7.2.2 only handles `properties.secret`:

```javascript
const payload = jwt.verify(token, properties.secret, { ... });
```

No `jwks-rsa` import, no JWKS key fetching, no key caching.

**Recommendation**: Either implement JWKS in the initial code (it's ~20 lines
with `jwks-rsa`), or explicitly defer it and mark it as "v2" in both the config
docs and the implementation order. Currently the plan promises JWKS in the config
schema (section 5.3) but doesn't deliver it in the implementation (section 7.2.2).

### 4.3 Build-time validation misses important checks

The plan validates `id`, `type`, `keys` presence, `secret`/`jwksUri` mutual
exclusivity, and `roles` type. But doesn't validate:

- `algorithms` is required and non-empty for JWT strategies (without it,
  `jsonwebtoken` might accept `alg: none`)
- Role names in strategies match roles defined in `auth.api.roles` (a typo in
  `roles: [partnr]` silently grants a role that maps to zero endpoints)
- `headerName` is a valid HTTP header name (not empty, no spaces)
- Strategy IDs don't collide with future reserved words

The `algorithms` check is the security-critical one. If `algorithms` is missing,
`jwt.verify` falls back to accepting any algorithm the token claims — including
`none` if the library doesn't explicitly reject it.

**Recommendation**: Make `algorithms` required for JWT strategies. Validate at
build time. Default is dangerous for security-sensitive config.

### 4.4 `createAuthorize` test breakage

The plan changes `createAuthorize({ session })` to `createAuthorize(context)`.
Tests for `createAuthorize` likely pass `{ session: { user: { roles: [...] } } }`.
After the change, they need to pass `{ user: { roles: [...] } }` — the
destructuring path changes.

Not a code issue, but it's the kind of thing that wastes a day of debugging
when tests fail mysteriously. The plan's implementation order (step 11) should
explicitly call out test updates.

---

## 5. Missing Pieces

### 5.1 No guidance on testing NextAuth with zero providers

GAP-3 (strategies-without-providers) was "confirmed valid" in the plan. But
the confirmation is theoretical — based on reading code flow, not actual
testing. NextAuth's `getServerSession` with zero providers is an edge case
that the NextAuth team probably never tested either.

**Recommendation**: Before implementing, write a minimal test that calls
`getServerSession(req, res, { providers: [], callbacks: {} })` and verify
the return value. If it throws, the plan needs a `getServerSession` change.

### 5.2 No consideration of server restart for key rotation

The plan notes that API keys are resolved at startup and cached. If you
rotate a key (change the env var), the old key stays valid until server
restart. For JWT secrets, same issue.

This is fine and matches the existing `_secret` behavior. But the plan
should mention that `getNextAuthConfig`'s `initialized` flag means a server
restart is required for any auth config changes to take effect. This is
already true for NextAuth config — strategies just add to the list of things
that need restart.

### 5.3 No audit trail for which key was used

When multiple API keys are configured under one strategy, there's no way to
tell which specific key authenticated a request. The user object gets
`sub: 'apiKey:partner-keys'` for all three partner keys.

For audit/compliance purposes, consider including a key index or hash prefix:
`sub: 'apiKey:partner-keys:0'` or `sub: 'apiKey:partner-keys:sha256:a1b2c3...'`.
Not critical for v1, but worth noting.

---

## 6. Naming: "Strategies" Alternatives

The term "strategies" comes from Passport.js. It's technically accurate but carries
framework baggage and feels implementation-oriented. In Lowdefy's config-first,
YAML-author-friendly world, simpler language reads better.

### Candidates

| Term | Config | Pros | Cons |
|------|--------|------|------|
| **methods** | `auth.methods` | Short, clear, RFC 7235 uses "authentication method". Natural language: "which auth method?" | Could be confused with HTTP methods (GET/POST) — but in `auth.methods` context it's unambiguous |
| **schemes** | `auth.schemes` | RFC 7235 spec term ("authentication scheme"). Technically precise | Academic, unfamiliar to most developers |
| **credentials** | `auth.credentials` | Familiar | Too narrow — implies username/password, not API keys or JWTs |
| **authenticators** | `auth.authenticators` | Clear | Verbose, Java-esque |
| **tokens** | `auth.tokens` | Simple | Too narrow — API keys aren't tokens |
| **sources** | `auth.sources` | As in "identity source" | Ambiguous — could mean data sources |

### Recommendation: `methods`

```yaml
auth:
  methods:
    - id: partner-key
      type: apiKey
      properties:
        keys:
          - _secret: PARTNER_KEY
      roles:
        - partner
```

**Why `methods` works best:**

1. **Natural language**: "What auth methods does your API support?" is how people
   actually talk about this. Nobody says "what auth strategies do you support?"
   outside of Passport.js documentation.

2. **Consistent with HTTP spec**: RFC 7235 defines "authentication scheme" but
   the industry commonly says "authentication method." AWS docs say "API
   authentication methods." Google Cloud says "authentication methods."

3. **Distinct from `providers`**: `providers` = NextAuth identity providers
   (Google, GitHub). `methods` = how external callers authenticate with your API.
   Clear semantic distinction.

4. **Config readability**: `auth.methods` scans faster than `auth.strategies`
   in YAML. "Methods" is a shorter, more common English word.

5. **No framework baggage**: "Strategies" immediately signals "this was inspired
   by Passport.js" to Node.js developers. "Methods" is framework-neutral.

The only concern (HTTP methods confusion) is eliminated by context — `auth.methods`
is unambiguous. Nobody would think `auth.methods` configures GET/POST.

---

## Summary: Priority Fixes

| # | Issue | Severity | Section |
|---|-------|----------|---------|
| 1 | API key timing leak (hash before compare) | **High** | 2.1 |
| 2 | NextAuth config pollution with strategies | Medium | 1.1 |
| 3 | Unnecessary NextAuth calls for strategies-only | Medium | 1.2 |
| 4 | `context.authStrategies` never set in apiWrapper code | Medium | 1.4 |
| 5 | Auth failures flood logs + Sentry | Medium | 3.1 |
| 6 | `algorithms` not required for JWT strategies | Medium | 4.3 |
| 7 | JWKS promised but not implemented | Low | 4.2 |
| 8 | 403 code contradicts "No 403" statement | Low | 3.3 |
| 9 | Phase 3 bundled unnecessarily | Low | 1.5 |
| 10 | Zero-provider NextAuth behavior untested | Low | 5.1 |
