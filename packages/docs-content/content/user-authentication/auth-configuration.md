# Auth Configuration

The `auth` section configures user authentication. Lowdefy's auth is built on [BetterAuth](https://www.better-auth.com/): sessions are database-backed, the app owns its auth UI, and roles live on organization memberships. If you are moving from the previous NextAuth-shaped config, start with the [Auth Upgrade guide](/auth-upgrade) — several keys were renamed or removed.

The `_secret` operator is evaluated over the entire `auth` section, so any value can be a secret reference.

For a login method to work you must configure **at least one mechanism** (`emailAndPassword`, `magicLink`, `phoneNumber`, an OAuth `providers` entry, or an API `strategies` entry), a `secret`, and a `database`. An `auth` block with none of these fails the build.

## Secret

A required signing secret, given as a `_secret` reference:

```yaml
lowdefy: 5.5.1
auth:
  secret:
    _secret: BETTER_AUTH_SECRET
```

Also set the `BETTER_AUTH_URL` environment variable to the app's canonical origin — auth builds password-reset, magic-link and verification links, and its CSRF origin allowlist, from it. See the [migration guide](/auth-upgrade#3-pin-the-canonical-url-with-better-auth-url).

## Database

Sessions, users, accounts and organizations are stored through an adapter:

```yaml
lowdefy: 5.5.1
auth:
  database:
    id: auth_db
    type: MongoDBAuthAdapter
    properties:
      uri:
        _secret: AUTH_DATABASE_URI
```

See the [MongoDBAuthAdapter](/MongoDBAuthAdapter) reference. Collection names follow the `user-*` convention and are fixed by the adapter.

## Login mechanisms

- **Email & password** — `auth.emailAndPassword` (`enabled`, `requireEmailVerification`, `minPasswordLength` (default 8), `disableSignUp`).
- **Magic link** — `auth.magicLink` (`enabled`, `expiresIn` seconds (default 300), `disableSignUp`), which needs `auth.email` (below).
- **OAuth providers** — `auth.providers`; see [Providers](/auth-providers).
- **Phone number** — `auth.phoneNumber` (OTP sign-in); needs a `phone.otp.send` hook to deliver the SMS.
- **Passkeys** — `auth.passkey` (`enabled`, `rpId`, `rpName`).

```yaml
lowdefy: 5.5.1
auth:
  emailAndPassword:
    enabled: true
    requireEmailVerification: true
```

## Auth email

`auth.email` references an **SMTP connection** by id — the connection owns `from`, `replyTo`, the transport and the delivery filter, and is shared by every auth email flow. There is no inline transport shape. Optionally map individual flows to your own notification templates:

```yaml
lowdefy: 5.5.1
auth:
  email:
    connectionId: email   # an SMTP connection in connections[]
    templates:            # all optional; unset → branded stock template
      verifyEmail: verify-email-notification
      resetPassword: reset-password-notification
      magicLink: magic-link-notification
      invitation: invite-notification
```

## Auth pages

BetterAuth ships no UI — your app owns its auth pages, and `auth.authPages` points at them. All are Lowdefy page paths:

| Key | Default | When required |
| --- | ------- | ------------- |
| `signIn` | `/login` | |
| `signUp` | `/signup` | |
| `error` | `/auth/error` | receives `?error=` code |
| `forgotPassword` | `/forgot-password` | |
| `resetPassword` | `/reset-password` | |
| `verifyEmail` | `/verify-email` | |
| `twoFactor` | — | **required** when `twoFactor.enabled` |
| `twoFactorEnrol` | — | **required** when `twoFactor.required` |
| `acceptInvitation` | — | consumes an `?invitationId=` link |

```yaml
lowdefy: 5.5.1
auth:
  authPages:
    signIn: /login
    signUp: /signup
    error: /auth-error
```

See [Two-Factor Authentication](/two-factor) for the two-factor pages, and the [MCP Server & OAuth](/mcp-oauth) page for `oauthProvider.consentPage` and `postLoginPage`.

## Session

Database sessions. Length is `expiresIn` (seconds, default 604800 = 7 days); `updateAge` (default 86400) is how often an active session's expiry is refreshed:

```yaml
lowdefy: 5.5.1
auth:
  session:
    expiresIn: 43200 # 12 hours in seconds
    updateAge: 3600
```

`session.cookieCache` (off by default) trades a short window of stale session reads for fewer database lookups — leave it off unless you understand the [revocation-latency trade](/two-factor#recovering-a-user-who-has-lost-their-factor).

## Roles, organizations, and API strategies

- **Roles** — declare app role names in `auth.roles` and gate pages/endpoints with `auth.pages.roles` / `auth.api.roles`. See [Roles](/roles).
- **Organizations** — `auth.organizations.policy` (`pinned` or `tenant`) decides the whole multi-tenancy model. See [Organizations & Multi-Tenancy](/organizations).
- **API strategies** — `auth.strategies` authenticates non-session callers (server-to-server) with an `apiKey` or a `jwt`:

```yaml
lowdefy: 5.5.1
auth:
  strategies:
    - id: service-key
      type: apiKey
      roles:
        - integrations
      properties:
        keys:
          - value:
              _secret: SERVICE_API_KEY
```

A strategy caller carries the configured `roles` and `attributes` and its `auth_method` is the strategy type. A `jwt` strategy needs exactly one of `properties.secret` or `properties.jwksUri`, and a non-empty `algorithms` allowlist (which blocks `alg: none` downgrades).

## Captcha

`auth.captcha` protects auth endpoints with Cloudflare Turnstile. The `siteKey` is public (a plain string, never a `_secret`); the `secretKey` is a `_secret` reference. See the [Captcha block](/Captcha) for the client side.

## Rate limiting and account linking

- `auth.rateLimit` — brute-force protection, on by default (`enabled`, `window` seconds, `max`).
- `auth.account.accountLinking` — link a new OAuth sign-in to an existing account by verified email. `trustedProviders` lists providers whose email claim you trust for linking. **This is unrelated to `provider.twoFactorTrusted`** — see [Two-Factor Authentication](/two-factor#trusting-an-oauth-provider).

## Mock User for Testing (Dev Server Only)

When developing and testing Lowdefy apps, you can bypass the login flow by signing the dev server in as a declared caller. This is useful for testing authenticated flows without going through OAuth login.

The browser's caller can be set in three ways:

### CLI Flag

Pass `--mock-user` to `lowdefy dev` to start the server as a mock user for that run. Supply a JSON user object to set the identity and roles, or use the bare flag for a default user with no roles:

```bash
lowdefy dev --mock-user '{"id":"test-user","email":"test@example.com","roles":["admin"]}'
```

The flag sets `LOWDEFY_DEV_USER` for the dev server process, so it takes precedence over `auth.dev.browserUser` in the config file.

### Environment Variable

Set the `LOWDEFY_DEV_USER` environment variable to a JSON string containing the mock user object:

```bash
LOWDEFY_DEV_USER='{"id":"test-user","email":"test@example.com","roles":["admin"]}'
```

### Config File

Declare the caller under [`auth.dev.users`](#named-dev-users-dev-server-only) and name it with `auth.dev.browserUser`:

###### Sign the dev browser in as a declared user
```yaml
lowdefy: 5.5.1

auth:
  providers:
    - id: google
      type: Google
      properties:
        clientId:
          _secret: GOOGLE_CLIENT_ID
        clientSecret:
          _secret: GOOGLE_CLIENT_SECRET
  dev:
    browserUser: test
    users:
      test:
        id: test-user
        email: test@example.com
        name: Test User
        roles:
          - admin
```

`browserUser` must name a declared `dev.users` entry — a name that is not declared fails the build listing the ones that are. One map declares every dev caller; the headless tools take an entry name as their `user`, and `browserUser` says which of them the browser is.

When a dev browser user is configured:
- The environment variable takes precedence over the config file if both are set
- A warning is logged at dev server startup: "Mock user active - login bypassed"
- The user is injected as a pre-resolved caller — its `roles` are authoritative
- The `_user` operator returns its values, on the server and in the browser client — the dev server serves the session to both
- Protected pages are accessible based on its roles
- The dev server's headless renderer (used by the AI-agent screenshot and state-inspection tools) renders as it, so it can capture pages with roles the default user lacks

> **Note:** This only works with the development server (`lowdefy dev`). The production server ignores it for security.

> **Note:** Bypassing login bypasses the auth engine rather than exercising it — a config whose only auth substance is a dev user still fails the "no auth mechanism" build check, and [auth steps](/auth-steps) (which need the running auth engine) are unavailable under it.

> **Deprecated:** `auth.dev.mockUser` declared an anonymous browser caller inline. It still works in v8 and warns at build (check slug `auth-dev-mock-user`); it is removed in v9. Move it into a `dev.users` entry and select it with `dev.browserUser`. Declaring both is a build error.

## Named Dev Users (Dev Server Only)

`auth.dev.users` declares named caller fixtures for the dev server's headless tools. Each key is a name, each value a user object:

###### Declare named dev users
```yaml
lowdefy: 5.5.1

auth:
  dev:
    users:
      admin:
        id: dev-admin
        roles:
          - admin
        organization_id: org_1
      member:
        id: dev-member
        roles:
          - member
        organization_id: org_1
```

Every dev tool that takes a `user` — `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator`, `lowdefy_load_state`, `lowdefy_run_request` and `lowdefy_run_endpoint`, and the matching `/lowdefy-docs` routes — accepts one of these names in place of an inline user object, so a caller is written once instead of repeated on every call:

```
GET /lowdefy-docs/screenshot/users?user=admin
```

A name that is not declared is refused with a `400` that lists the declared names. It never falls back to the default roleless caller, which would render an empty page that looks like a working one.

> **Note:** Declaring an entry does not bypass login. It names a caller a dev tool can act as — the developer's own browser still signs in normally. Select one with `dev.browserUser` above to bypass login for the whole dev server.

> **Note:** Named dev users only work with the development server (`lowdefy dev`). The production server ignores them.
