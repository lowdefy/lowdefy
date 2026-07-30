# Auth Upgrade (BetterAuth)

This guide covers upgrading an app from the previous NextAuth-shaped `auth:` configuration to the BetterAuth-based auth system. The `auth:` block is restructured, sessions are database-backed, the session user shape changes, and roles move onto organization memberships. Every app with auth is affected.

API auth strategies (`auth.strategies`) are purely additive — an app with no strategies configured behaves exactly as before.

## Summary of breaking changes

| Change | Old | New |
|---|---|---|
| Database required | Optional (JWT-only possible) | `auth.database` required for any login method |
| Provider type names | `GoogleProvider`, `GitHubProvider`, ... | `Google`, `GitHub`, ... (`OpenIDConnectProvider` → `GenericOAuth`) |
| Callbacks / events | `auth.callbacks`, `auth.events` (JS plugins) | `auth.hooks` — bindings to `InternalApi` endpoints |
| Session strategy | `session.strategy: jwt` supported | Database sessions only; `maxAge` → `expiresIn` |
| Collection names | `users`, `accounts`, `sessions` | `user-*` convention, fixed by the adapter |
| `userFields` | Mapped provider claims onto the session | Removed — each mapped key has a new home (see below) |
| Secret | `NEXTAUTH_SECRET` env var | `auth.secret` with the `_secret` operator |
| Auth UI | NextAuth built-in pages, `auth.theme` | Removed — the app provides its own pages |
| Magic link | `EmailProvider` in `providers` | `auth.magicLink` + `auth.email` |
| `authPages` | `signIn`, `signOut`, `error`, `verifyRequest`, `newUser` | `signIn`, `signUp`, `error`, `forgotPassword`, `resetPassword`, `verifyEmail` |
| OIDC profile claims | ~20 claims copied onto the session user | Only `id`, `name`, `email`, `image`, `emailVerified` |
| `sub` | `_user.sub` = provider's OIDC subject | Removed — `_user.id` is the internal id (a different value) |
| Roles | On the user record via `userFields` | On the active membership (`member.role`) |
| Attributes | `_user.app_attributes`, `_user.global_attributes` | One merged `_user.attributes` bag |

## Upgrade steps

### 1. Restructure the `auth:` block

Rename provider types (drop the `Provider` suffix; `OpenIDConnectProvider` becomes `GenericOAuth` with `discoveryUrl` and a `scopes` array). Convert the session block — `strategy` is gone, `maxAge` becomes `expiresIn`:

```yaml
auth:
  session:
    expiresIn: 604800 # was maxAge
    updateAge: 86400
```

Remove `theme`, `debug`, `advanced`, and `userFields` — they have no successor keys. `theme` styled NextAuth's built-in pages, which no longer exist. Every `userFields` mapping has a new home — see [the session user shape](#the-session-user-shape) below.

### 2. Add `auth.secret`

The `NEXTAUTH_SECRET` / `AUTH_SECRET` environment variables are no longer read. Configure the secret explicitly:

```yaml
auth:
  secret:
    _secret: BETTER_AUTH_SECRET
```

Set `LOWDEFY_SECRET_BETTER_AUTH_SECRET` to a secure random string (`openssl rand -base64 32`). Reusing your old secret value is fine — sessions are invalidated by the upgrade anyway.

### 3. Pin the canonical URL with `BETTER_AUTH_URL`

Set the `BETTER_AUTH_URL` environment variable to your app's canonical origin (e.g. `https://app.example.com`). Auth builds password-reset, magic-link and email-verification links — and its CSRF origin allowlist — from this value. When it is pinned, those links and origins are fixed. When it is unset, the host is derived from each incoming request, so a spoofed `Host` / `X-Forwarded-Host` header can steer a reset email to an attacker-controlled link. Pinning it is strongly recommended for any production deployment. This replaces the old `NEXTAUTH_URL` variable.

### 4. Add `auth.database`

Sessions are database-backed, so every app with a login method needs an adapter — including apps that previously ran JWT-only with no adapter:

```yaml
auth:
  database:
    id: auth_db
    type: MongoDBAuthAdapter
    properties:
      uri:
        _secret: AUTH_DATABASE_URI
```

If you used the old `MongoDBAdapter`: the type is renamed, `databaseUri` becomes `uri`, and `options.databaseName` folds into the URI path. There is no `options.collections` mapping — collection names are fixed by the adapter.

### 5. Migrate MongoDB collections

The adapter uses the `user-*` naming convention, and the names are fixed — there is no rename escape hatch:

- `users` keeps its name.
- Rename `accounts` to `user-accounts`.
- Drop `sessions` and `verification_tokens` — the session format changes and users sign in again.

If you configured custom collection names via the old `options.collections`, rename those collections to the fixed names instead.

### 6. Migrate `EmailProvider` to `magicLink`

Magic-link login is a plugin with its own key, not a provider entry. `auth.email` no longer carries an inline SMTP transport — it references an `SMTP` connection by id. That one connection owns `from`, `replyTo`, the transport, and the delivery `filter`, and is shared by every email flow (magic links, verification, password reset, invitations):

```yaml
connections:
  - id: email
    type: SMTP
    properties:
      from: noreply@example.com
      host:
        _secret: SMTP_HOST
      port: 587
      auth:
        user:
          _secret: SMTP_USER
        pass:
          _secret: SMTP_PASS
auth:
  magicLink:
    enabled: true
    expiresIn: 300
  email:
    connectionId: email   # an SMTP connection in connections[]
```

The client signs in with the `Login` action: `params: { magicLink: true, email: ... }`.

**Auth emails obey the connection's delivery filter.** Because auth email now sends through the same `SMTP` connection your app uses for notification and routine mail, that connection's `filter` (dev catch-all, sandbox allowlist/regex, none in production) governs auth email too. This closes the old footgun where auth emails bypassed the filter and shipped to real inboxes while everything else was caught in development.

**Branded HTML by default.** The four auth emails — verification, password reset, magic link, and invitation — render branded HTML from your `app.email` theme (logo, colour, layout), not the old plain-text link. There is no per-flow theme knob; one `app.email` brand covers them all.

**Overriding a flow.** Point any flow at one of your own `notifications:` entries to replace its email with a bespoke notification template (its own copy, subject, and per-notification `theme` merged over `app.email`):

```yaml
auth:
  email:
    connectionId: email
    templates:            # all optional; unset → branded stock template
      verifyEmail: verify-email-notification
      resetPassword: reset-password-notification
      magicLink: magic-link-notification
      invitation: invite-notification
```

Each value is a notification id from `notifications:`. These `templates` keys are an email-flow namespace, separate from the `authPages` roles despite the shared `resetPassword` / `verifyEmail` spelling. An override template **must surface the framework `url` behind its call-to-action** — the engine injects `url` (and, for invitations, the accept-page link). A verify email with no verify link is a dead end, so a template that ignores `url` is a mistake.

**`invitation.send` is removed.** The invitation email is now symmetric with the other three: branded stock `InvitationEmail` by default, an override notification when configured. The old `invitation.send` auth hook — whose only purpose was branding the invite before overrides existed — is gone. If you bound it, point `auth.email.templates.invitation` at a notification instead.

### 7. Rewrite callbacks and events as hooks

`auth.callbacks` and `auth.events` are replaced by `auth.hooks`. A hook is not a plugin — it binds an auth lifecycle point to an `InternalApi` endpoint, and the endpoint's routine does the work, reading the hook payload with the `_payload` operator:

```yaml
auth:
  hooks:
    - id: audit-login
      point: session.create.after
      endpointId: audit-login
```

Where old slots land:

| Old | New point |
|---|---|
| `createUser` event | `user.create.after` |
| `signIn` event | `session.create.after` |
| `signOut` event | `session.delete.after` |
| `linkAccount` event | `account.create.after` |
| `updateUser` event | `user.update.after` |
| `signIn` callback (allow / deny) | `session.create.before` — `:reject` vetoes the sign-in |
| `jwt` callback | None — database sessions carry no JWT; persist data via a create hook instead |
| `redirect` callback | None — post-login navigation is the `Login` action's `callbackUrl` |
| `session` callback | None — the session shape is fixed; store extra data in attributes or app collections |

Custom callback/event plugin logic moves into the endpoint's routine; anything a routine can't express goes in a custom request plugin called from the routine.

### 8. Build your auth pages

BetterAuth ships no UI. The app owns its sign-in, sign-up, and error pages, and `auth.authPages` points at them:

```yaml
auth:
  authPages:
    signIn: /login
    signUp: /signup
    error: /auth-error
```

The old `signOut`, `verifyRequest`, and `newUser` keys are removed. New optional keys for email flows: `signUp`, `forgotPassword`, `resetPassword`, `verifyEmail`.

Sign-in uses the `Login` action, which dispatches by parameter — `providerId` for OAuth, `magicLink: true`, or `email` + `password`. Email/password sign-up pages use the new `SignUp` action; social and magic-link "sign-up" pages use `Login`, since those methods create the account on first sign-in. Sign-in errors now surface inline (the `Login` action returns `error.code`) rather than as a `?error=` query parameter on the error page.

### 9. Run the user-model data migration

Roles move off the user record onto organization memberships, and fused user-contact records split into `contact` / `user` / `member` records. If your app is built on the `modules-mongodb` `user_contacts` convention, this migration ships from that module — not from the core upgrade. Apps not using that convention only need the collection renames from step 4.

### 10. Sign in again

Existing sessions are invalidated — the session format changed. There is nothing to migrate; users log in once after the upgrade.

## The session user shape

The session user now carries exactly: `id`, `name`, `email`, `image`, `emailVerified`, plus Lowdefy's resolved `roles` (from the active membership) and `attributes` (merged), `activeOrganizationId`, and `impersonatedBy` (present only during admin impersonation).

Where old `_user` reads land:

| Old read | New home |
|---|---|
| `_user.sub` | `_user.id` — a **different value**: the internal id, not the provider subject. The provider subject lives on the `user-accounts` collection (`accountId`). |
| `_user.picture` | `_user.image` |
| `_user.email_verified` | `_user.emailVerified` |
| `_user.roles` | Unchanged read — but roles now resolve from the active organization membership, granted via invitations and admin steps, not provider claims. |
| `_user.app_attributes.*` | `_user.attributes.*` — per-app values live on the membership (`member.attributes`). |
| `_user.global_attributes.*` | `_user.attributes.*` — global values live on the user (`user.attributes`); merged per key, member wins. |
| Other OIDC claims (`given_name`, `phone_number`, `address`, ...) | Not in the session. Persist what you need at signup via an endpoint hook — profile data onto your contact collection, authorization inputs into attributes — and read it from there. |

## What you don't need to change

- **Page and API authorization** — `auth.pages` and `auth.api` (`protected` / `public` / `roles`) keep their shape and semantics.
- **Page role lists** — existing role names keep working; roles are matched as strings exactly as before.
- **Provider ids** — OAuth callback URLs are still `/api/auth/callback/<id>`; keep your provider `id` values.
- **`dev.mockUser`** — still available in the dev server.
