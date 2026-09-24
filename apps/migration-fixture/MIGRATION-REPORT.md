# Auth Migration Report — migration-fixture

Applied codemod prompts 01–06 in order to `lowdefy.yaml`, `pages/`, and `api/`.
Prompt 07 (`07-user-references-report.md`) is referenced by prompt 05 but was not part of this
run — the `_user` reads seeded in `pages/` and `api/` were intentionally left untouched.

---

## Prompt 01 — Provider type names

### Changes

| Provider `id` | Old `type` | New `type` | Property changes |
| --- | --- | --- | --- |
| `google` | `GoogleProvider` | `Google` | removed `allowDangerousEmailAccountLinking: true` (see flag below) |
| `gitlab` | `GitlabProvider` | `GitLab` | none |
| `corporate-idp` | `OpenIDConnectProvider` | `GenericOAuth` | `wellKnown` → `discoveryUrl`; `authorization.params.scope: "openid profile email"` → `scopes: [openid, profile, email]`; removed `idToken: true` and `checks: [pkce, state]` (derived from discovery) |
| `email` | `EmailProvider` | — | left in place for prompt 04 (extracted there) |

Provider `id` values are unchanged (`google`, `gitlab`, `corporate-idp`) — OAuth callback URLs
(`/api/auth/callback/<id>`) keep working.

### Flags

- **FLAG — `allowDangerousEmailAccountLinking: true` removed from the `google` provider.**
  There is no equivalent key. Configure account linking explicitly instead. Google verifies
  email ownership, so the equivalent is:

  ```yaml
  auth:
    account:
      accountLinking:
        trustedProviders:
          - google
  ```

  Add `emailAndPassword` (literal) to the list only if the email/password method is enabled.
  Only list providers that verify email ownership. This block was **not** added automatically —
  the prompt directs the codemod to remove the key and tell the developer to opt in explicitly.

### Verification

- `grep -rn "type: .*Provider"` over `lowdefy.yaml`, `pages/`, `api/` — **PASS at end of run**
  (no matches). Note: immediately after prompt 01 the `EmailProvider` entry still matched by
  design; it is removed by prompt 04.
- Every remaining `type` under `auth.providers` is a new name (`Google`, `GitLab`) or
  `GenericOAuth` — **PASS**.
- Provider `id` fields unchanged — **PASS** (diff shows only `type`/`properties` edits).

---

## Prompt 02 — Secret and database adapter

### Changes

- Added `auth.secret: { _secret: BETTER_AUTH_SECRET }`.
- Converted `auth.adapter` → `auth.database`:
  - `type: MongoDBAdapter` → `type: MongoDBAuthAdapter` (kept `id: auth_adapter`).
  - `properties.databaseUri` → `properties.uri` (the `_secret: MONGODB_URI` reference carried over).
  - Removed `properties.options.databaseName: fixture-app` — the database name must move into
    the URI path.
  - Removed `properties.options.collections` — see flag below.
  - Removed `properties.mongoDBClientOptions` — see flag below.

### Env-var instructions (ACTION REQUIRED)

- **Set `LOWDEFY_SECRET_BETTER_AUTH_SECRET`** to a secure random string:
  `openssl rand -base64 32`. Reusing the old NextAuth secret value is fine (all sessions are
  invalidated by this migration anyway).
- **Ensure `LOWDEFY_SECRET_MONGODB_URI` includes the database name in the URI path**, i.e.
  `mongodb://<host>/fixture-app`, because `options.databaseName: fixture-app` was removed and
  the new adapter takes the database from the URI.
  - **WARNING:** `MONGODB_URI` is shared with the `app_db` connection (`connections[0]`).
    Verify the `app_db` MongoDB connection still points at the intended database after adding
    `/fixture-app` to the URI path, or split the auth database out into its own secret
    (e.g. `LOWDEFY_SECRET_AUTH_DATABASE_URI`) if the two must diverge.
- **Dead env vars:** `NEXTAUTH_SECRET` and `AUTH_SECRET` are no longer read by anything —
  remove them from `.env` / deployment config. (No `.env` files exist in this app directory;
  check the deployment environment.)

### Flags

- **WARNING — custom collection names found in the removed `options.collections` mapping.**
  The new adapter has fixed collection names; the data-migration step must handle each:
  - `Users: users` — already matches the fixed name `users`; no rename needed.
  - `Accounts: fixture_accounts` — **rename collection `fixture_accounts` → `user-accounts`**
    during data migration.
  - `Sessions: fixture_sessions` — **dropped**; sessions are not migrated, users re-login.
  - `VerificationTokens: fixture_verification_tokens` — **dropped**; verification tokens are
    not migrated.
- **FLAG — `mongoDBClientOptions` (`connectTimeoutMS: 2000`) removed.** Not part of the new
  adapter surface; there is no replacement key. If the timeout matters, encode it as a URI
  option (`?connectTimeoutMS=2000`) in the connection string, subject to verification against
  the new adapter's driver behaviour.

### Verification

- `auth.secret` exists and uses `_secret` — **PASS**.
- No `auth.adapter` key remains; `grep -rn "MongoDBAdapter\b"` in config returns nothing — **PASS**.
- `auth.database.properties` contains only `uri` — **PASS**.
- Env vars to set (`LOWDEFY_SECRET_BETTER_AUTH_SECRET`, and the URI note above) and dead vars
  (`NEXTAUTH_SECRET`, `AUTH_SECRET`) are documented in this section — **PASS**.

---

## Prompt 03 — Session config and authPages

### Changes

- `auth.session`:
  - `strategy: jwt` — removed (see flag).
  - `maxAge: 43200` → `expiresIn: 43200`.
  - `updateAge: 3600` — kept unchanged.
- `auth.authPages`:
  - `signIn: /login` — kept.
  - `error: /auth-error` — kept.
  - `signOut: /goodbye` — removed (sign-out is the `Logout` action, not a page).
  - `verifyRequest: /check-email` — removed (the "check your email" page is app-owned; no
    config key points at it).
  - `newUser: /welcome` — removed (first-login redirects are app logic, e.g. a
    `session.create.after` hook or the page itself).

### Flags

- **FLAG — `strategy: jwt` removed.** The app previously used stateless JWT sessions with no
  database. Sessions are now database-backed only; `auth.database` is configured (prompt 02),
  so session storage lands in MongoDB. All users will need to log in again after deploy.
- **NOTE — removed page paths stay as ordinary pages.** `/goodbye`, `/check-email`, `/welcome`
  are no longer wired to auth config. They remain in `auth.pages.public` and can be kept as
  ordinary pages if the app links to them itself (e.g. navigate to `/check-email` after
  triggering a magic-link login, navigate to `/goodbye` after `Logout`).
- **FLAG (loud) — the error page contract changed.** None of the old `authPages` values pointed
  at NextAuth built-in paths (all are app pages), so the app does not depend on NextAuth's UI.
  **However**, `pages/login.yaml` (block `auth_error`) parses the NextAuth `?error=` query
  parameter. BetterAuth surfaces sign-in failures inline — the `Login` action's email path
  returns `error.code`, and OAuth failures land on the error-callback URL — so this
  `_url_query: error` handling must be reworked. The same applies to `/auth-error`
  (`authPages.error`) if that page parses `?error=` (no `auth-error` page file exists in this
  fixture to check).

### Verification

- `auth.session` contains only `expiresIn`, `updateAge` — **PASS** (subset of the allowed set
  `expiresIn`, `updateAge`, `cookieCache`, `crossSubDomainCookies`).
- `auth.authPages` contains only `signIn`, `error` — **PASS** (subset of the allowed set).
- No `strategy:` remains under `auth` — **PASS** (`grep -rn "strategy:"` returns nothing).

---

## Prompt 04 — EmailProvider → magicLink + email

### Changes

- Removed the `id: email, type: EmailProvider` entry from `auth.providers`.
- Added `auth.magicLink`:
  - `enabled: true`
  - `expiresIn: 600` (carried from the old provider's `maxAge: 600`).
- Added `auth.email` from the old transport config:
  - `from: noreply@fixture.example.com` (carried over).
  - `provider.type: smtp` with `properties.host` (`_secret: SMTP_HOST`), `properties.port: 587`,
    `properties.auth.user` (`_secret: SMTP_USER`), `properties.auth.pass` (`_secret: SMTP_PASS`).
  - All `_secret` references carried over as-is, not inlined.

### Flags

- **FLAG — sign-in page must switch to the magic-link `Login` call.** In `pages/login.yaml`,
  the `email_login` button calls `Login` with `params: { providerId: email, email: ... }`
  (the old provider-id convention). It must become the `Login` action with `magicLink: true`
  and an `email` parameter. The "check your email" page (`/check-email`) is app-owned — the
  page should navigate to it itself after triggering the magic link (see prompt 03's
  `verifyRequest` removal). The page YAML was **not** auto-edited; the prompt only mandates
  flagging.
- **NOTE — sign-up semantics:** magic link creates the account on first sign-in. If email
  login was meant to be invite-only, set `magicLink.disableSignUp: true`; membership is
  additionally governed by `auth.organizations.signup` (invite-only is the default).

### Verification

- No `EmailProvider` entry remains under `auth.providers` — **PASS**.
- `auth.magicLink.enabled: true` and a single `auth.email` block exist — **PASS**.
- `_secret` references (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) carried over, not inlined — **PASS**.

---

## Prompt 05 — Removed keys: userFields, theme, debug, advanced

### Changes

- Deleted `auth.theme` (`colorScheme`, `brandColor`, `logo`).
- Deleted `auth.debug: true`.
- Deleted `auth.advanced` (`cookies.sessionToken.name: fixture-session`).
- Deleted `auth.userFields` (7 mappings — table below).

### Flags

- **`theme`:** no built-in auth UI exists to theme. `/login` and the other auth pages are
  ordinary Lowdefy pages — style them like any page. The `theme.logo`
  (`https://fixture.example.com/logo.png`) and brand color carry over only as page design on
  the app's own auth pages; nothing mechanical to migrate.
- **`debug: true`:** auth logging is wired to Lowdefy's logging — use the server's log level
  (`--log-level debug`).
- **FLAG — `advanced.cookies.sessionToken.name: fixture-session` has no replacement surface.**
  Cookie names and attributes are now fixed by Lowdefy (secure in production, relaxed in dev).
  This was a custom cookie *name*, not cross-subdomain sharing, so the supported replacement
  (`session.crossSubDomainCookies: { enabled: true, domain: ... }`) does not apply. Anything
  depending on the `fixture-session` cookie name (external monitoring, load-balancer affinity
  rules, etc.) must be updated to the fixed cookie name.

### `userFields` mapping report (every key that existed)

| Old `userFields` mapping | New home |
| --- | --- |
| `id: user.id` | `_user.id` — automatic. **The value changes** to BetterAuth's internal id; the provider subject now lives on the `user-accounts` collection as `accountId`. Anything keyed on the old id (e.g. Mongo records storing user ids) needs a data-migration mapping. |
| `roles: profile.fixture_roles` | `_user.roles` — automatic, resolved from the active membership's `member.role`. Roles are granted via member records (admin steps / invitations), **not** provider claims. If IdP-driven role sync from `fixture_roles` is still wanted, implement it as an endpoint hook writing member records. |
| `app_attributes: profile.fixture_app_attributes` | `_user.attributes` — per-app values now live on `member.attributes`, written via the `UpdateMemberAttributes` admin step (or an endpoint hook at signup). Read as `_user.attributes.<key>`. |
| `global_attributes: profile.fixture_global_attributes` | `_user.attributes` — global values now live on `user.attributes`, written via `UpdateUserAttributes`. Member and user attributes merge shallowly per key; member wins. |
| `phone: profile.phone_number` | Profile data — persist onto the `contact` record via a `user.create.before` / `user.create.after` hook; read from the contact collection, not `_user`. |
| `idp_groups: profile.https://idp.example.com/groups` | Custom namespaced provider claim — no session projection exists. As an authorization input it belongs in attributes (member/user), persisted by an endpoint hook at signup/login that reads the provider claims; otherwise persist to `contact`. Either way an endpoint hook is required; the session never carries raw provider claims. |
| `profile: profile` | Whole-profile dump — no equivalent; the session never carries raw provider objects. `_user.name` / `_user.email` / `_user.image` cover display; anything deeper belongs on the `contact` record, persisted by an endpoint hook at signup (see prompt 06) and read like any app data. |

**Follow-up:** every page/API read of these projected fields (e.g. `_user: idp_groups` and
`_user: profile.company` in `pages/profile.yaml`, `_user: app_attributes.branch` /
`_user: global_attributes.tier` in `pages/admin.yaml`, `api/whoami.yaml`,
`api/admin-report.yaml`) is detected and reported by prompt `07-user-references-report.md` —
run it after this. Those reads were left untouched here.

### Verification

- `grep -n "userFields:\|theme:\|debug:\|advanced:" lowdefy.yaml` returns nothing inside the
  `auth:` block — **PASS** (no matches anywhere in the file).
- A mapping report was produced for every `userFields` key that existed (7 of 7) — **PASS**.

---

## Prompt 06 — callbacks and events → auth.hooks

The old plugin JS files do not exist in this app directory (they were local plugins in the
original repo); each plugin's slot was inferred from the inline `meta.type` YAML comments.

### Per-entry report (all 6 old entries)

**Mapped — bound in `auth.hooks` with a scaffolded `InternalApi` endpoint stub:**

| Old entry | Old slot | New point | Endpoint | Notes |
| --- | --- | --- | --- | --- |
| `check-email-domain` (`CheckEmailDomainCallback`) | `signIn` callback | `session.create.before` | `api/auth/check-email-domain.yaml` (`id: auth/check-email-domain`) | Allow/deny: `:reject` vetoes the sign-in (surfaces as an error on the login page). The old plugin `properties` (`allowedDomains: [fixture.example.com]`) have no home on the hook binding — they are recorded in the endpoint stub for the developer to inline into the routine. TODO left: implement the domain test on `_payload: user.email`. |
| `welcome-new-user` (`WelcomeNewUserEvent`) | `createUser` event | `user.create.after` | `api/auth/welcome-new-user.yaml` (`id: auth/welcome-new-user`) | Observe-only, fire-and-forget; stub wraps a placeholder step in `:try`. Port the plugin body (presumably welcome email / user seeding) into the routine. |
| `audit-login` (`AuditLoginEvent`) | `signIn` event | `session.create.after` | `api/auth/audit-login.yaml` (`id: auth/audit-login`) | Observe-only; stub records `{ event: login, userId: _payload user.id, at: now }` via `MongoDBInsertOne` on `app_db` inside `:try` — verify collection/shape against the old plugin. |
| `audit-logout` (`AuditLogoutEvent`) | `signOut` event | `session.delete.after` | `api/auth/audit-logout.yaml` (`id: auth/audit-logout`) | Observe-only; same stub shape as audit-login. |

Hook routines read the payload with `_payload` (`_user` is empty inside a hook).
One hook per point: the four bindings use four distinct points — no merge was needed.

**Unmappable — removed with no hook binding (developer action pointers):**

- **`enrich-token` (`EnrichTokenCallback`, `jwt` callback): no new point.** Database sessions
  carry no JWT, so there is nothing to enrich at session time. Token enrichment usually becomes
  a `user.create.before` / `account.create.after` hook persisting the data onto
  `user.attributes` / `member.attributes` / `contact`, where the session and app read it. If
  the enrichment only projected provider claims onto the token for `userFields` to pick up, it
  is redundant with prompt 05's mapping (the data belongs in attributes or `contact`) — no
  endpoint was scaffolded for a likely no-op; scaffold one at the chosen point if the plugin
  body turns out to do real work.
- **`logout-redirect` (`IdpLogoutRedirectCallback`, `redirect` callback): no new point.** There
  is no redirect hook; post-login navigation is the `Login` action's `callbackUrl`, and logout
  is the `Logout` action. An IdP logout redirect (RP-initiated logout at the corporate IdP) has
  no auth-config surface — if still required, implement it as app logic around the `Logout`
  action (e.g. navigate to the IdP's end-session URL afterwards).

The old plugin JS files (local `plugins/` in the original repo) are left for the developer to
port into the endpoint routines and then delete.

### Changes

- Replaced `auth.callbacks` (3 entries) and `auth.events` (3 entries) with `auth.hooks`
  (4 bindings, listed above).
- Created 4 endpoint stubs under `api/auth/` and registered them in the app's `api:` list via
  `_ref` in `lowdefy.yaml`.

### Verification

- No `callbacks:` or `events:` key remains under `auth:` — **PASS** (`grep -n "callbacks:\|events:" lowdefy.yaml` returns nothing; the `events:` keys in `pages/login.yaml` are block events, out of scope).
- Every `auth.hooks` entry's `endpointId` resolves to an existing `type: InternalApi` endpoint
  (`auth/check-email-domain`, `auth/welcome-new-user`, `auth/audit-login`, `auth/audit-logout`,
  each with a matching `id` in its file, all `_ref`'d from `api:`) — **PASS**.
- No two `auth.hooks` entries share a `point` — **PASS**.
- A per-entry report exists covering all 6 old callbacks/events, including the 2 unmappable
  ones — **PASS**.

---

## Prompt ambiguities and gaps found during this run

Recorded as feedback on the prompts themselves:

1. **Prompt 01, `allowDangerousEmailAccountLinking`:** "remove it and tell the developer to
   configure linking explicitly" — unclear whether the codemod should *add*
   `auth.account.accountLinking.trustedProviders` itself when the provider obviously verifies
   email (Google), or only report it. This run removed the key and reported the exact YAML to
   add. The prompt should say which.
2. **Prompt 01 verification vs prompt 04 ordering:** prompt 01's verification ("no
   `type: *Provider` entries") cannot pass until prompt 04 removes `EmailProvider`, even though
   prompt 01 explicitly says to leave it. The verification should carve out `EmailProvider`.
3. **Prompt 02, URI secret naming:** the What-to-Do table says keep `databaseUri`'s value under
   `uri`, but the Before/After example silently renames the secret `MONGODB_URI` →
   `AUTH_DATABASE_URI`, and the edge case says "don't silently invent a URI secret name".
   Contradictory. This run kept `_secret: MONGODB_URI` (table + edge case win over the example)
   and flagged the shared-secret implication for the `app_db` connection.
4. **Prompt 02, `mongoDBClientOptions`:** "remove and flag" gives no pointer for where client
   options go (URI query options? unsupported?). This run suggested URI options with a caveat.
5. **Prompt 02, database name in a secret URI:** "put the database name in the URI path" is an
   env-var change, not a config change, when the URI is a `_secret` — worth stating explicitly
   that this becomes a developer instruction, and warning about secrets shared with app
   connections (as here, where `MONGODB_URI` also feeds a `MongoDB` connection).
6. **Prompt 03/05 overlap on `authPages` pages list:** removed pages (`/goodbye`,
   `/check-email`, `/welcome`) remain listed under `auth.pages.public`. No prompt says whether
   to prune `auth.pages.public` entries for pages that are no longer part of auth flows. This
   run left `auth.pages` untouched (it is declared "unchanged surface").
7. **Prompt 04, `Login` params rework:** the prompt says to *flag* sign-in pages, but it is
   ambiguous whether the codemod should also rewrite the obvious mechanical case
   (`providerId: email` → `magicLink: true`). This run flagged only, leaving
   `pages/login.yaml` unedited.
8. **Prompt 06, old entry `properties`:** the hook binding shape is `{ id, point, endpointId }`
   — the prompt never says what happens to `properties` on old callback/event entries
   (e.g. `allowedDomains`). This run recorded them in the endpoint stub as comments/TODO.
   The prompt should state that plugin properties become routine config.
9. **Prompt 06, endpoint `id` vs file path:** the example binds `endpointId: auth/audit-login`
   and shows a stub whose `id: audit-login` — inconsistent. Verification requires the
   `endpointId` to "resolve", so this run set each stub's `id` equal to the `endpointId`
   (`auth/...`) and placed files at `api/auth/<name>.yaml`. The prompt should pin the id/path
   convention.
10. **Prompt 06, stub content without plugin source:** payload shape per point (`user`,
    `session`, `changes`, …) is only hinted at (`_payload: user.id` in one example), and
    `:reject` / `:try` syntax is not specified. Stubs here use `- :reject: <message>` and
    `- :try: [steps]` on best effort — the prompt needs a payload/point reference and control-key
    syntax examples for stubs to be reliable.
11. **Prompt 05 → 07 dependency:** prompt 05 instructs "run 07 after this", but 07 was not in
    this run's scope; noting so the seeded `_user` reads aren't mistaken for missed work.
