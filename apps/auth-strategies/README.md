# Auth strategies reference app (strategies-only)

The phase-4 fixture for [api-strategies](../../../lowdefy-design/designs/auth-upgrade/api-strategies/design.md):
a pure API app with **no database and no login method**. External callers
authenticate with a static API key (`X-API-Key` header) or a Bearer JWT
(HMAC shared secret or JWKS). The BetterAuth instance runs stateless, so
`getSession` resolves null on every request and authentication falls through
to the strategies in config order.

The session-wins-over-API-key scenario needs a real login and lives in the
[auth-reference walkthrough](../auth-reference/README.md) (phase-4 section).

## Prerequisites

- **Secrets** — `.env` in this directory (no database URI - there is no
  database):

  ```sh
  LOWDEFY_SECRET_BETTER_AUTH_SECRET=use-a-long-random-string-of-32-chars
  LOWDEFY_SECRET_PARTNER_KEY_ACME=partner-key-acme-0123456789abcdef
  LOWDEFY_SECRET_PARTNER_KEY_GLOBEX=partner-key-globex-0123456789abcd
  LOWDEFY_SECRET_JWT_SIGNING_SECRET=jwt-shared-secret-0123456789abcdef
  ```

  Any values work; keys and secrets shorter than 32 characters log a startup
  warning (never a build failure - secrets are opaque at build time).

- **Mock IdP** — the `external-idp` (JWKS) scenarios need the bundled mock
  IdP running; it generates an RSA key pair at boot, serves the JWKS, and
  mints RS256 tokens:

  ```sh
  node scripts/jwks-server.mjs   # serves http://localhost:4100
  ```

## Run

From the repo root:

```sh
node scripts/dev.mjs --config-directory apps/auth-strategies
```

The app builds and serves with no database configured - the terminal shows
no adapter/connection activity, and the home page renders logged out.

All API calls below run against `http://localhost:3000`. Endpoints are
POST-only and expect a JSON body:

```sh
call() { curl -s -X POST -H 'content-type: application/json' -d '{}' "$@"; }
```

## Walkthrough (phase-4 gate - API strategies)

1. **Public endpoint needs no credentials**: `call http://localhost:3000/api/endpoints/health`
   returns `{"ok":true}` with no credentials presented.

2. **No credentials on a protected endpoint → 401, one warning line**:
   `call -i http://localhost:3000/api/endpoints/partner-data` returns
   `401` with `{"name":"AuthenticationError",...}`. The server terminal
   logs exactly **one warning line** (`Unauthenticated request: POST
   /api/endpoints/partner-data`) - no structured error log, no Sentry
   event, no stack trace.

3. **API key authenticates**: present a configured key and the role-gated
   endpoint answers:

   ```sh
   call -H "X-API-Key: partner-key-acme-0123456789abcdef" \
     http://localhost:3000/api/endpoints/partner-data
   ```

   returns `{"data":"partner-report","caller":"apiKey:partner-access:acme","branches":["north","east"]}` -
   the synthetic caller id carries the per-key audit identity (`acme`), and
   the strategy's static `attributes.branches` surfaced through `_user`.
   The terminal debug log records which strategy authenticated
   (`auth_strategy_authenticated`, visible with log level debug).

4. **Strategy caller shape on `_user`**:

   ```sh
   call -H "X-API-Key: partner-key-acme-0123456789abcdef" \
     http://localhost:3000/api/endpoints/caller
   ```

   returns the full resolved caller:
   `{"user":{"id":"apiKey:partner-access:acme","authMethod":"apiKey","strategyId":"partner-access","roles":["partner"],"attributes":{"branches":["north","east"]}}}`.

5. **Valid credentials, wrong roles → opaque "does not exist"**: the same
   partner key on the `api-user`-gated endpoint:

   ```sh
   call -i -H "X-API-Key: partner-key-acme-0123456789abcdef" \
     http://localhost:3000/api/endpoints/service-data
   ```

   returns the opaque `API Endpoint "service-data" does not exist.` error
   (a 500-shaped config error, not a 403) - authorization failures never
   reveal which endpoints exist.

6. **Wrong API key → 401**: an unconfigured key value on `partner-data`
   returns `401` like step 2 - a failed match is not a caller.

7. **JWT (HMAC) authenticates**: mint a token with the shared secret and
   call the `api-user`-gated endpoint:

   ```sh
   TOKEN=$(JWT_SIGNING_SECRET='jwt-shared-secret-0123456789abcdef' \
     node scripts/mint-jwt.mjs --email svc@example.test --roles reporting)
   call -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/endpoints/service-data
   ```

   returns `{"data":"service-report","caller":"service-1"}` - `_user.id` is
   the token's `sub` claim. On `/api/endpoints/caller` the same token shows
   `authMethod: jwt`, `strategyId: service-jwt`, and
   `roles: ["api-user","reporting"]` - the strategy's static `api-user`
   unioned with the claim-derived `reporting`.

8. **JWT rejections** - each of these returns `401` (one warning line, as
   in step 2), because the token fails verification and no other strategy
   matches:

   ```sh
   node scripts/mint-jwt.mjs --bad exp    # expired
   node scripts/mint-jwt.mjs --bad alg    # HS384, allowlist is [HS256]
   node scripts/mint-jwt.mjs --bad iss    # wrong issuer
   node scripts/mint-jwt.mjs --bad aud    # wrong audience
   ```

   (each with `JWT_SIGNING_SECRET` set, used as `Authorization: Bearer` on
   `service-data`).

9. **JWT (JWKS) authenticates**: with the mock IdP from Prerequisites
   running:

   ```sh
   TOKEN=$(curl -s 'http://localhost:4100/token?roles=api-user&branches=west')
   call -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/endpoints/caller
   ```

   returns `authMethod: jwt`, `strategyId: external-idp`,
   `roles: ["api-user"]` (claim-derived via the nested
   `realm_access.roles` path - the strategy grants no static roles), and
   `attributes: {"branches":["west"]}` (claim-mapped via
   `attributes.branches`). That token also reaches `service-data`.

10. **JWKS rejections**: `curl -s 'http://localhost:4100/token?bad=key'`
    (signed by a rogue key), `?bad=exp`, `?bad=iss`, and `?bad=aud` all
    return `401` when presented as Bearer tokens.

11. **Strategy order and header separation**: present both a valid API key
    and a valid Bearer token on `/api/endpoints/caller` - the caller is the
    API key's (`strategyId: partner-access`), because strategies resolve in
    config order and `partner-access` is listed first. The two credentials
    never compete for one header: `apiKey` reads `X-API-Key`, `jwt` reads
    `Authorization`.

## Notes

- **Brute-force surface**: strategy endpoints have no built-in rate
  limiting (BetterAuth's rate limiter covers `/api/auth/*` session routes,
  which a strategies-only app never exercises). Put a reverse proxy with
  per-IP rate limiting in front of a deployment that exposes API keys -
  per-key rate limiting arrives with the future `dynamicApiKey` strategy.
- Every scenario above is manual; automate with the repo's e2e tooling as
  it grows.
