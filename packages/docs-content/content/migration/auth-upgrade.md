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
| OIDC profile claims | ~20 claims copied onto the session user | Only `id`, `name`, `email`, `image`, `email_verified` |
| `sub` | `_user.sub` = provider's OIDC subject | Removed — `_user.id` is the internal id (a different value) |
| Roles | On the user record via `userFields` | App roles on `member.appRoles` (`_user.roles`); the organization's `owner`/`admin`/`member` tier on `member.role` (`_user.org_roles`) |
| Attributes | `_user.app_attributes`, `_user.global_attributes` | One merged `_user.attributes` bag |
| Signed-out request to any URL | `/404` if the page is missing, sign-in if protected | Sign-in for every URL, in apps whose unlisted ids default to protected |
| Missing request / endpoint id, signed out (auth'd app) | `500` (missing) vs `401` (protected) | `401` for both |
| 404 page | Had to serve signed-out visitors refused a protected page | Only ever serves signed-in visitors, in a protected app |

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

The old `signOut`, `verifyRequest`, and `newUser` keys are removed. New optional keys for email flows: `signUp`, `forgotPassword`, `resetPassword`, `verifyEmail`. `twoFactor` is a further key, and unlike those it is **required** when `auth.twoFactor.enabled` is true — the build fails without it, because the engine routes the two-factor challenge to that page itself. See [Two-Factor Authentication](/two-factor).

`acceptInvitation` is a further key, naming the page that consumes an `?invitationId=` link. **Write its copy for the unauthenticated case.** Where one app sends another organization's invitations, the invitee accepts on the *sending* app, and `AcceptInvitation` sets the active organization inside its own transaction — so the accept page itself renders unauthenticated the moment the accept succeeds. That page must tell an already-signed-in invitee to sign in again **at the app they are on**, not at the app that sent the invitation: the active-organization policy runs at every session create and re-pins them here, while the production cookie prefix is shared across apps on one host, so signing in at the other app flips the shared session back the other way.

Sign-in uses the `Login` action, which dispatches by parameter — `providerId` for OAuth, `magicLink: true`, or `email` + `password`. Email/password sign-up pages use the new `SignUp` action; social and magic-link "sign-up" pages use `Login`, since those methods create the account on first sign-in. Sign-in errors now surface inline (the `Login` action returns `error.code`) rather than as a `?error=` query parameter on the error page.

### 9. Run the user-model data migration

Roles move off the user record onto organization memberships, and fused user-contact records split into `contact` / `user` / `member` records. If your app is built on the `modules-mongodb` `user_contacts` convention, this migration ships from that module — not from the core upgrade. Apps not using that convention only need the collection renames from step 4.

### 10. Sign in again

Existing sessions are invalidated — the session format changed. There is nothing to migrate; users log in once after the upgrade.

## The session user shape

The session user carries `id`, `name`, `email`, `image`, `email_verified`, `active_organization_id`, and the user record's own `profile` bag, plus three fields Lowdefy resolves from the caller's row in the active organization:

- **`roles`** — the app's own role names, read from the active membership's `appRoles` array. These are what page and endpoint `auth.roles` gates match, and the only thing they match.
- **`org_roles`** — the organization tier, from `member.role`: `owner`, `admin` or `member`. This is an administrative fact about the active organization, and it is **not a gate source** — `createAuthorize` reads only `roles`. An app that wants a page for organization administrators gates that page on one of its own app roles, and lets the write authority answer the administration question separately, at the step.
- **`attributes`** — the one merged bag of authorization inputs: `user.attributes` (global) under the active `member.attributes` (per-organization), merged per key, member wins.

**`_user.role` (singular) carries nothing.** It rides the session-user spread off the user record, and Lowdefy never writes it. It sits one character away from `roles`, so an app that gates on `_user.role` is gating on a constant — the gate either always passes or always fails, and never for the reason the author intended. Read `roles`.

There is no `impersonatedBy` field on the session user. Impersonation is not part of the platform.

Where old `_user` reads land:

| Old read | New home |
|---|---|
| `_user.sub` | `_user.id` — a **different value**: the internal id, not the provider subject. The provider subject lives on the `user-accounts` collection (`accountId`). |
| `_user.picture` | `_user.image` |
| `_user.email_verified` | `_user.email_verified` — unchanged; the pre-upgrade OIDC claim and the resolved caller field already share this name. |
| `_user.roles` | Unchanged read — but roles now resolve from the active organization membership's `appRoles`, granted via invitations and auth steps, not provider claims. |
| `_user.orgRoles` | `_user.org_roles` — the organization tier from `member.role` (`owner`, `admin`, `member`). |
| `_user.twoFactorEnrolled` | `_user.two_factor_enrolled` — whether the caller holds a factor satisfying `auth.twoFactor.required`. |
| `_user.authMethod` | `_user.auth_method` — the strategy that authenticated the caller, on strategy-resolved callers only. |
| `_user.app_attributes.*` | `_user.attributes.*` — per-app values live on the membership (`member.attributes`). |
| `_user.global_attributes.*` | `_user.attributes.*` — global values live on the user (`user.attributes`); merged per key, member wins. |
| Other OIDC claims (`given_name`, `phone_number`, `address`, ...) | Not in the session. Persist what you need at signup via an endpoint hook — profile data onto your contact collection, authorization inputs into attributes — and read it from there. |

## Page and API existence is no longer observable before you sign in

This is a behaviour change every app inherits, not a two-factor feature. It removes an enumeration asymmetry — a logged-out caller used to be able to tell a real-but-protected id apart from an absent one by the response they got back. That is an information leak the engine design had accepted as a documented cost of following web convention, not an access-control failure: no protected page or request was ever reachable without a session. Nothing about who can *reach* a surface changes here — only what a signed-out caller can *learn* about which surfaces exist.

**The rule.** When the caller is not authenticated, existence is never consulted. A protected app answers the sign-in page for any URL a logged-out visitor asks for — whether that URL is a real protected page or a typo that matches nothing. Existence is only resolved once there is a session to resolve it against.

**Which apps change, which don't.** Only apps whose *unlisted* page ids default to protected are affected. The `auth.pages.protected: [...]` shape (an explicit protected list, everything else public) is **untouched** — a logged-out visitor typing a wrong URL still gets `/404`, because unlisted ids there are public. Every other shape treats an unlisted id as protected, so a logged-out typo now lands on the sign-in page, then resolves to `/404` once the visitor authenticates — one extra hop for a wrong URL.

| Config | An unlisted page id is |
|---|---|
| `auth.pages.public: [...]` | protected |
| `auth.pages.protected: true` | protected |
| `auth.pages.protected: [...]` | public |
| neither | public |

**A known imprecision, so nobody files it as a bug.** The default the runtime reads for an unlisted id is a single build-resolved boolean, deliberately coarser than the glob-list config that produced it. In an app configured `auth.pages.public: ['docs/**']` (so unlisted ids default to protected), a signed-out visitor typing `docs/typo` gets the sign-in page rather than `/404`, even though the `docs/**` namespace was declared public. Every id that **is** in the build carries its own resolved decision, so no real page changes behaviour — only a URL matching nothing reads the coarse default. Shipping the pattern lists into the build artifact and re-matching globs per request was considered and rejected: the artifact exists precisely so the runtime reads a resolved decision and never re-derives access from patterns.

**What you can delete.** In a protected app the 404 page now answers one question — "does a page with this id exist for this signed-in caller?" — instead of three. The auth logic some apps hand-write onto their 404 page (a session check, a conditional "sign in" link for the logged-out case) is now dead code: a logged-out visitor never reaches the 404 page, so it only ever renders for someone already signed in. Delete it. The build still forces the `404` page id public, unchanged, so the page itself is always reachable.

**The API surface.** In an authenticated app a logged-out caller gets `401 Authentication required` for **every** request and endpoint id, present or absent. Two consequences for upgrading apps. A missing id used to surface as a `500`, so any error handling keyed on the status code will now see `401` where it previously saw `500`. And a typo'd `requestId` called from a logged-out browser now reads "Authentication required" rather than a not-found error — expected, given existence is no longer disclosed pre-auth. The **authenticated** case is unchanged: for a signed-in caller a missing id and a role-refused id both still surface as the same opaque "does not exist". A no-auth app is unchanged, and so is a system or routine context — the `401` rewrite is for a real session-less human on a protected surface, not for "no user" in general.

**Websockets are unchanged.** The websocket surface was already symmetric — a logged-out caller could never distinguish a present subscription id from an absent one — so it needed no change and got none. It is called out here only so a reader does not conclude the surface was overlooked.

## Administering organizations

Administering an organization means holding `admin` (or `owner`) in that organization — the `member.role` tier, on the caller's own member row there. There is no app-wide administering role, and no config key that grants administration across organizations: nothing to configure. Every auth step declares the authority it requires, and the step floor authorizes the caller against their member row in the organization the step names, so a caller who administers the team organization holds nothing in the customer organization. The steps that write the deployment-wide `user` row — `UpdateUserProfile`, `UpdateUserAttributes`, `BanUser`, `UnbanUser`, `DeleteUser`, `RevokeUserSessions` — additionally require the **target** to hold a member row in that organization, so an administrator can only reach people who are members of an organization they administer.

## Bootstrapping the first administrator

Nothing grants organization authority implicitly. On a fresh `policy: pinned` + `signup: invite-only` deployment that is a closed loop: nobody can be invited, because inviting needs `invitation: ['create']` authority that nobody holds, and nobody can sign up, because the admission gate admits only members and pending invitees. Breaking the loop is one document inserted into the `user-invitations` collection, by hand, outside the platform:

```js
{ _id: <uuid>, organizationId: 'team', email: 'admin@example.com',
  role: 'owner', appRoles: [], status: 'pending',
  inviterId: 'bootstrap', expiresAt: <future date>, createdAt: new Date() }
```

**`organizationId` is the configured slug.** Under `pinned` the organization's id *is* `auth.organizations.org`, so there is no id to look up and the same document works in every environment.

**The key is `_id`, not `id`.** The adapter maps the logical `id` to the physical `_id` inbound and back outbound, so every invitation the platform writes stores its id at `_id`. A document inserted literally as `{ id: … }` gets a driver-generated `ObjectId` `_id` plus a stray `id` field, after which the accept flow's invitation lookup never finds it — while the admission gate, which queries by email and status, happily admits the person to sign up. The result is a user who can log in, an invitation that cannot be accepted, and no error pointing at either. Use `_id`.

**The role is `owner`, not `admin`, and that is not cosmetic.** With no owner in the organization every membership guard is inert: `removeMember`'s creator protection engages only when the target holds the creator role, and `updateMemberRole`'s last-owner count only when the updater is the creator editing themselves. So a sole `admin` could demote themselves to `member`, or remove the last other `admin`, after which nobody anywhere holds `member: ['update']` or `invitation: ['create']` — and under `signup: invite-only` nobody can sign up to fix it. Seeding `owner` makes all three guards live, and costs nothing reachable: `owner`'s only statement beyond `admin`'s is `organization: ['delete']`, whose endpoint is disabled under `pinned` and has no step.

**Deliver the accept URL by hand.** The accept URL is built only inside the invitation email sender, which only the `InviteMember` step reaches, so a hand-inserted invitation sends no email. Give the nominated person this link:

```
{baseUrlOrigin}{basePath}{authPages.acceptInvitation}?invitationId=<the _id above>
```

**The pre-accept state looks like a failure and is not.** Under `invite-only`, an invitee holding only a pending invitation gets a session with **no** active organization, and a session with no active organization resolves unauthenticated. So the nominated person signs up successfully and lands logged out everywhere. That is the carve-out working: it admits them just far enough to accept. The link is the only way forward — the front door alone does not finish the bootstrap.

**Email verification is required before accepting.** Lowdefy sets a function-form `advanced.database.generateId`, which makes the organization plugin require a verified email for the accept-by-invitation-id action. Normal flow, not a workaround: verify the address, then open the link.

**Under `signup: open` this route does not work.** The auto-join hooks mint a `role: 'member'` member row before the accept, so accepting fails as already-a-member. There the single write is the other one: the person signs up normally, and the operator sets `member.role: 'owner'` on the row they already have. That one field is the whole grant — no second write and no denormalized copy to leave stale, because nothing writes `user.role`.

**Bootstrap is per-organization, not per-deployment.** An `admin` of the team organization holds no authority in the customer organization, so that organization's first `admin` needs its own inserted invitation. After the first one, each organization is self-sustaining: its owner can invite and promote from inside the app.

The field names above are the live camelCase names. If the `snake-case-data-fields` change has landed in your version, they are `organization_id`, `inviter_id`, `expires_at`, `created_at` and `app_roles`.

## Retired client actions

Seven client actions are gone. An app that authors one fails at build with the unknown-action-type error; each has a named replacement, except the two that do not:

| Retired action | Replacement |
|---|---|
| `ImpersonateUser` | **None.** The capability is retired. |
| `StopImpersonating` | **None.** The capability is retired. |
| `InviteMember` | The `InviteMember` step |
| `CancelInvitation` | The `CancelInvitation` step |
| `UpdateMemberRole` | The `UpdateMemberOrgRole` step (the `owner`/`admin`/`member` tier). App roles are the `UpdateMemberRoles` step. |
| `RemoveMember` | The `RemoveMember` step |
| `UpdateOrganization` | The `UpdateOrganization` step |

The rule that produced the list also tells you which actions will keep existing: **a client action is an operation that mutates the caller's own session, and nothing else.** So `SetActiveOrganization`, `AcceptInvitation` and `LeaveOrganization` remain — each acts on the caller. An app administering **other** people's memberships authors a routine instead, and that is what earns it the per-step authority floor, an explicitly named target organization, and both role tiers (`appRoles` and `orgRole`) rather than one fused `role`.

Two consequences. A `pinned` app never had these actions working in the first place — every organization route is disabled under `pinned` — so this reads as a removal only for `tenant` apps. And the step path is what makes cross-organization administration possible at all: a client action forwards no organization id, so it could only ever act on the session's active organization.

## What you don't need to change

- **Page and API authorization** — `auth.pages` and `auth.api` (`protected` / `public` / `roles`) keep their shape and semantics.
- **Page role lists** — existing role names keep working; roles are matched as strings exactly as before.
- **Provider ids** — OAuth callback URLs are still `/api/auth/callback/<id>`; keep your provider `id` values.
- **`dev.mockUser`** — still available in the dev server.
