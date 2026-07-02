# Auth reference app

The living definition of done for the auth upgrade. Phase 1 exercises the
BetterAuth engine: email/password signup with email verification, magic
link, OAuth, protected/public/role-gated pages, sign out, and session
revocation. Phase 2 adds auth hooks: `InternalApi` endpoints bound to
`user.create.before`, `session.create.after`, and `email.verified`. Phase 3
adds organizations: this app pins **org-a** with open signup; the sibling
apps `auth-reference-b` (pins **org-b**, invite-only) and
`auth-reference-tenant` (tenant policy) share the walkthrough below. Each
later phase grows this suite with a scenario.

## Prerequisites

- **MongoDB** running locally:

  ```sh
  docker run -d --name auth-ref-mongo -p 27017:27017 mongo:7
  ```

- **Mailpit** (local SMTP + web inbox) for verification and magic-link
  emails:

  ```sh
  docker run -d --name auth-ref-mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
  ```

  The inbox UI is at http://localhost:8025.

- **Environment** — create `apps/auth-reference/.env` (dotenv is read by the
  dev server manager):

  ```sh
  LOWDEFY_SECRET_AUTH_DATABASE_URI=mongodb://localhost:27017/auth-reference
  LOWDEFY_SECRET_BETTER_AUTH_SECRET=<openssl rand -base64 32>
  LOWDEFY_SECRET_SMTP_HOST=localhost
  # Only for apps/auth-reference-tenant (its own database - tenants do not
  # mix with the pinned apps):
  LOWDEFY_SECRET_TENANT_DATABASE_URI=mongodb://localhost:27017/auth-reference-tenant
  # Only needed for the phase-4 API strategy scenarios:
  LOWDEFY_SECRET_PARTNER_KEY_ACME=partner-key-acme-0123456789abcdef
  LOWDEFY_SECRET_JWT_SIGNING_SECRET=jwt-shared-secret-0123456789abcdef
  # The hook scenarios assert this exact value lands in the audit row:
  LOWDEFY_SECRET_HOOK_AUDIT_KEY=audit-secret-value
  # Only needed to exercise the OAuth scenario:
  LOWDEFY_SECRET_GOOGLE_CLIENT_ID=<from Google Cloud console>
  LOWDEFY_SECRET_GOOGLE_CLIENT_SECRET=<from Google Cloud console>
  ```

- **Indexes** — the server never creates indexes; the deployment provisions
  them ([mongodb design](../../../lowdefy-design/designs/auth-upgrade/mongodb/design.md) Decision 3):

  ```sh
  AUTH_DATABASE_URI='mongodb://localhost:27017/auth-reference' \
    node scripts/provision-indexes.mjs
  ```

## Run

From the repo root:

```sh
node scripts/dev.mjs --config-directory apps/auth-reference
```

The phase-3 scenarios run the sibling deployments side by side (each picks
its own port; note them from the startup output):

```sh
node scripts/dev.mjs --config-directory apps/auth-reference-b
node scripts/dev.mjs --config-directory apps/auth-reference-tenant
```

`auth-reference` and `auth-reference-b` share one auth database (two orgs,
one user pool); `auth-reference-tenant` uses its own. The `.env` files for
the sibling apps need the same secrets (copy `apps/auth-reference/.env`,
and add `LOWDEFY_SECRET_TENANT_DATABASE_URI` for the tenant app).

## Walkthrough (phase-1 gate)

1. **Public page**: open `/home` logged out - it renders. `/dashboard`
   redirects to `/login?callbackUrl=/dashboard`.
2. **Sign up (email/password)**: `/signup` → submit (the `SignUp` action,
   email/password only). The response carries **no session** (check the
   Mailpit inbox); you land on `/check-email`.
3. **Unverified sign-in refused**: `/login` with the same credentials →
   sign-in fails (403 EMAIL_NOT_VERIFIED) until the email is verified.
4. **Verify**: click the link in Mailpit → BetterAuth verifies and
   redirects. Log in - you land back on the `callbackUrl` page.
5. **Magic link**: log out, enter your email on `/login`, "Email me a
   sign-in link" → follow the link in Mailpit → signed in.
6. **OAuth**: "Continue with Google" (requires real Google credentials and
   an authorized redirect URI of
   `http://localhost:3000/api/auth/callback/google`).
7. **Sessions list and revoke**: on `/sessions`, run the console snippets
   shown on the page. Revoke the current session token, then navigate -
   the next request is unauthenticated and redirects to the login page.
8. **Sign out**: the Log out button on `/dashboard` or `/home`; protected
   pages redirect to `/login` afterwards.
9. **Wrong roles stay opaque**: uncomment `dev.mockUser` in `lowdefy.yaml`
   (roles `[]`), restart - `/admin` redirects to `/404` while `/dashboard`
   renders (the mock caller substitutes for session resolution, roles
   authoritative). Set `roles: [admin]` and `/admin` renders.
10. **Collections**: `mongosh auth-reference --eval 'db.getCollectionNames()'`
    shows the fixed names: `users`, `user-sessions`, `user-accounts`,
    `user-verifications`.

## Walkthrough (phase-2 gate - hooks)

The bindings live under `auth.hooks` in `lowdefy.yaml`; the hook bodies are
the `InternalApi` endpoints in `api/`. Hooks run in a system context: the
endpoints are unreachable over HTTP (`curl -X POST
http://localhost:3000/api/endpoint/audit-login` answers "does not exist"),
`_user` is empty inside the routine, the subject is in `_payload`, and
`_secret` resolves.

11. **`:return` replaces the record (`user.create.before`)**: sign up on
    `/signup` with name `lower case name` and a fresh email. Verify via
    Mailpit and log in - `/dashboard` shows **name: LOWER CASE NAME**: the
    normalize-signup hook's `:return` replaced the record BetterAuth wrote.
    Confirm in the database:
    `mongosh auth-reference --eval 'db.users.find({}, {name: 1}).toArray()'`.
12. **`:reject` vetoes end to end (`user.create.before`)**: sign up as
    `anyone@blocked.example` - the signup fails with an error and **no row
    is written**:
    `mongosh auth-reference --eval 'db.users.countDocuments({email: "anyone@blocked.example"})'`
    returns 0.
13. **After hook fires with the catalog payload (`session.create.after`)**:
    log in as any verified user, then open `/hook-audit` (or
    `db['hook-audit'].find().toArray()`). The `session.create.after` row
    carries the catalog's payload shape (`payloadKeys: ['session', 'user']`),
    `sessionUserIsNone: true` (`_user` is empty in a hook routine), and
    `secretResolves: true` (`_secret` works).
14. **`email.verified` fires its synthetic point**: the signup from
    scenario 11 also produced an `email.verified` audit row
    (`payloadKeys: ['user']`) written when the Mailpit link was clicked -
    after the user write, which is why this hook reacts instead of
    returning a record.
15. **A throw in an after hook is an operational error, the write stands**:
    sign up and verify `after-throw@example.test`, then log in. The audit
    hook throws (deliberately, see `api/audit-login.yaml`) and the sign-in
    call surfaces an error - but the session row was already committed:
    `db['user-sessions'].find({}).sort({createdAt: -1}).limit(1)` shows it.
    This is why fallible after-hook work belongs in `:try` - the audit
    write itself is wrapped so an unreachable database never breaks login.
16. **Build validation**: each of these edits to `auth.hooks` in
    `lowdefy.yaml` fails the build (watch the dev server output):
    - an unknown point, e.g. `point: organization.create.before`;
    - an `endpointId` that does not exist, or one that points at a
      `type: Api` endpoint;
    - two entries binding the same `point`.

Every scenario above is manual in phases 1-2; automate with the repo's e2e
tooling as it grows.

## Walkthrough (phase-3 gate - organizations)

Organizations are always on. This app pins **org-a** with `signup: open`;
`auth-reference-b` pins **org-b** with the default invite-only signup;
`auth-reference-tenant` runs `policy: tenant`. Roles now resolve from the
active `member.role` (a CSV string, split per request), and
`_user.attributes` is the shallow merge of `user.attributes` and the active
member's `attributes` (member wins). Start with a fresh database (or drop
the old one) so pre-phase-3 users do not confuse the wall.

17. **Two organizations, seeded by slug**: start both pinned apps once, then
    `mongosh auth-reference --eval 'db["user-organizations"].find({}, {slug: 1}).toArray()'`
    shows `org-a` and `org-b` - each deployment ensured its org at startup
    (created if missing, untouched otherwise).
18. **Open signup auto-joins (org-a)**: sign up on `auth-reference`
    `/signup` with a fresh email. Before verifying, confirm the member row
    already exists but no session can be minted:
    `db["user-members"].find().toArray()` shows the row with
    `role: "member"`, while logging in still fails with
    EMAIL_NOT_VERIFIED. Verify via Mailpit, log in - `/dashboard` shows
    `roles: ["member"]`. Role-gated pages (`/admin`, `/members`) still 404.
19. **The wall between deployments (org-b rejects an org-a member)**: with
    the user from 18, open `auth-reference-b`'s `/login` and sign in. The
    page renders the inline "You have not been granted access" message -
    the engine's `session.create` hook threw the distinct
    `MEMBERSHIP_REQUIRED` code (403) and **no session was minted**
    (`db["user-sessions"]` gained no row). Magic link: request one on
    org-b's login page; the rejection surfaces when the link is consumed.
    OAuth: with Google configured, the error carries through BetterAuth's
    OAuth error callback rather than an inline return.
20. **Promote an admin (dev seed - the phase-6 admin steps land later)**:
    ```sh
    AUTH_DATABASE_URI='mongodb://localhost:27017/auth-reference' \
      node scripts/set-member.mjs --email <you> --org org-a --roles admin \
      --user-attributes '{"region":"global","branches":["hq"]}' \
      --member-attributes '{"branches":["a","b"]}'
    ```
    On `/dashboard`, press **Refresh session (UpdateSession)** - roles
    become `["admin"]` without a reload (the live member read; nothing is
    stamped on the session), and `attributes` shows the merged bag with the
    member's `branches` winning over the user's.
21. **Multi-role CSV via the plugin's own API**: on `/members` (admin),
    update your own member row to `admin,auditor` - `updateMemberRole`
    accepts the array because the build registered the catalog roles
    (`auditor` comes from `auth.pages.roles`) in the plugin's access
    control with empty statements. Refresh session: roles are
    `["admin", "auditor"]` and `/audit-reports` renders.
    `db["user-members"].find()` shows `role: "admin,auditor"` - one CSV
    string. (The recorded limitation: a member holding only
    empty-statement catalog roles cannot call `inviteMember` itself - the
    AC check needs `invitation: ["create"]`, which owner/admin carry.)
22. **Member row deleted mid-session loses access on the next request**:
    while logged in, remove your member row:
    `node scripts/set-member.mjs --email <you> --org org-a --remove` -
    the next navigation treats you as logged out (no member row = the hard
    wall, not "logged in with no roles"). Re-add with `--roles admin`.
23. **Invite → sign-up → accept (org-b, with contact stamp)**: on
    `auth-reference` `/contacts` create a contact for a fresh email and
    copy its contact id. Promote yourself in org-b
    (`--org org-b --roles admin`), then on `auth-reference-b` `/members`
    invite that email with role `member` and the contact id. Copy the
    invitation id from the response (or Mailpit - the stock template mails
    it since no `invitation.send` hook is bound in app B). As the invitee:
    sign up on org-b's `/signup`, verify, log in - the **pending
    invitation admits the session** (no MEMBERSHIP_REQUIRED), but
    `/dashboard` still treats you as logged out (no member row yet). Open
    `/accept-invitation?invitationId=<id>`, accept - membership exists,
    `/dashboard` renders, and `db.users.find({email: "<invitee>"})` shows
    the invitation's `contactId` stamped onto the user.
24. **Expired invitation gets the normal rejection**: expire a pending
    invitation
    (`db["user-invitations"].updateOne({email: "<x>"}, {$set: {expiresAt: new Date(0)}})`),
    then sign in as that (member-less) user on org-b - inline
    MEMBERSHIP_REQUIRED; recovery is a re-invite.
25. **Merge-on-signup (both bindings)**: create a contact on `/contacts`
    for `merge-pw@example.test`, then sign up with that email on org-a.
    At create time the user is unverified so `user.create.before` skips
    the match; after clicking the Mailpit link, the `email.verified`
    binding links it - `db.users.find({email: "merge-pw@example.test"})`
    shows `contactId` (written by explicit update). For the OAuth path,
    create a contact for your Google address and "Continue with Google" -
    the signup arrives verified, so `user.create.before` returns the
    record with `contactId` inline. An invited user whose accept stamped a
    `contactId` (scenario 23) skips the merge - the hook only matches
    users with no `contactId`.
26. **Tenant policy - lazy minting**: on `auth-reference-tenant`, sign up
    and verify a fresh user; the tenant database's `user-organizations`
    stays empty until the first login (no tenants for abandoned signups).
    Log in - a new org exists (slug `org-<userId>`), your member row is
    `role: "owner"`, and it is the session's active org. `/organizations`
    lists it.
27. **Tenant policy - an invited signup joins the inviter's tenant**: as
    the owner from 26, invite a fresh email from `/members`. As the
    invitee: sign up, verify, log in - **no org is minted** (the pending
    invitation short-circuits lazy creation); accept on
    `/accept-invitation?invitationId=<id>`; you are a member of the
    inviter's tenant, which becomes your active org.
28. **SetActiveOrganization + UpdateSession**: give a user membership in
    both org-a and org-b (invite or `set-member.mjs`) with different
    roles. On `auth-reference` `/organizations`, switch the active org by
    slug - the page's roles line updates after the chained UpdateSession
    without a reload.

Automation note: these scenarios are manual walkthroughs, like phases 1-2;
they need live email verification loops and three side-by-side dev servers.
Automate with the repo's e2e tooling as it grows.

## Walkthrough (phase-4 gate - API strategies)

The strategies-only scenarios (no database, JWKS, rejection matrix) live in
the [auth-strategies fixture app](../auth-strategies/README.md); this
section covers the scenarios that need a real login next to a strategy.
Endpoints are POST-only with a JSON body:

```sh
call() { curl -s -X POST -H 'content-type: application/json' -d '{}' "$@"; }
```

29. **API key authenticates against a full auth app**:
    `call -H "X-API-Key: partner-key-acme-0123456789abcdef"
    http://localhost:3000/api/endpoints/partner-data` returns
    `{"data":"partner-report","caller":"apiKey:partner-access:acme","branches":["north","east"]}`.
    Without the header the same call returns `401` with one
    `Unauthenticated request` warning line in the terminal - no structured
    error log. With a session user lacking the `partner` role (log in, call
    from the browser console with `credentials: 'include'`), it returns the
    opaque `does not exist` error.
30. **A logged-in session wins over a presented API key (no privilege
    swap)**: sign in as a member, copy the session cookie from the browser
    devtools, then present both credentials together:

    ```sh
    call -H "Cookie: <your lowdefy_auth-reference.session_token cookie>" \
      -H "X-API-Key: partner-key-acme-0123456789abcdef" \
      http://localhost:3000/api/endpoints/whoami
    ```

    The caller is the **session user** (your user id, member-resolved
    roles, no `authMethod`/`strategyId` fields) - the session branch is
    terminal, so the key is never consulted. Drop the Cookie header and the
    same call resolves the **strategy caller**
    (`id: "apiKey:partner-access:acme"`, `authMethod: "apiKey"`,
    `strategyId: "partner-access"`, `roles: ["partner"]`,
    `attributes: {"branches":["north","east"]}`).
31. **A walled-out session does not fall through to strategies**: remove
    your membership (`node scripts/set-member.mjs --email <you> --org org-a
    --remove`), then repeat the two-credential call from 30. The caller is
    `null` - the rejected session does not retry as an API caller, so a
    removed member cannot re-admit themselves with a key. (Re-add your
    membership afterwards.)
32. **HMAC JWT with claim-derived roles**: mint a token with the shared
    secret (`JWT_SIGNING_SECRET='jwt-shared-secret-0123456789abcdef'
    node ../auth-strategies/scripts/mint-jwt.mjs --aud auth-reference-api
    --roles partner` - note this app's audience) and present it as
    `Authorization: Bearer` on `whoami`: the caller shows
    `authMethod: "jwt"`, `strategyId: "service-jwt"`, and
    `roles: ["partner"]` derived from the token's `roles` claim (the
    strategy grants no static roles). The same token reaches
    `partner-data`.
