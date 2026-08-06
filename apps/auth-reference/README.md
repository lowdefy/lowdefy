# Auth reference app

The living definition of done for the auth upgrade. Phase 1 exercises the
BetterAuth engine: email/password signup with email verification, magic
link, OAuth, protected/public/role-gated pages, sign out, and session
revocation. Phase 2 adds auth hooks: `InternalApi` endpoints bound to
`user.create.before`, `session.create.after`, and `email.verified`. Phase 3
adds organizations: this app pins **org-a** with open signup; the sibling
apps `auth-reference-b` (pins **org-b**, invite-only) and
`auth-reference-tenant` (tenant policy) share the walkthrough below. Phase 4
adds API auth strategies: `apiKey` and `jwt` callers resolved at the API
rail. Phase 6
adds the admin steps: role-gated `Api` endpoints drive user and member
administration routines from `/users` and `/members`, and a `system: true`
step runs caller-less in the audit-login hook. Phase 9 adds the account
asks: the self-service action catalog (`/security`, the password
round-trip, 2FA, passkeys), the per-step step floor, `user.profile`
self-service, the `account-kit` local module contributing auth wiring from
its manifest, and the `_build.authConfig` build operator. The last section
covers per-organization authority: `_user.roles` and `_user.org_roles` as
separate fields, and the rule that an app role opens the admin UI while the
caller's member row in the **target** organization decides whether the
write lands. Each later phase grows this suite with a scenario.

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
  # Cloudflare Turnstile's documented always-pass TEST secret key - pairs
  # with the test site key in lowdefy.yaml; no Cloudflare account needed:
  LOWDEFY_SECRET_TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
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
   authoritative). Set `roles: [user-admin]` and `/admin` renders.
10. **Collections**: `mongosh auth-reference --eval 'db.getCollectionNames()'`
    shows the fixed names: `users`, `user-sessions`, `user-accounts`,
    `user-verifications`.

## Walkthrough (phase-2 gate - hooks)

The bindings live under `auth.hooks` in `lowdefy.yaml`; the hook bodies are
the `InternalApi` endpoints in `api/`. Hooks run in a system context: the
endpoints are unreachable over HTTP (`curl -X POST
http://localhost:3000/api/endpoints/audit-login` answers "does not exist"),
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
      `type: Api` endpoint.

    (Two entries binding the same `point` used to be a third failure; since
    phase 9 any number of bindings may share a point - they compose in tier
    order, and scenario 63 exercises exactly that.)

Every scenario above is manual in phases 1-2; automate with the repo's e2e
tooling as it grows.

## Walkthrough (phase-3 gate - organizations)

Organizations are always on. This app pins **org-a** with `signup: open`;
`auth-reference-b` pins **org-b** with the default invite-only signup;
`auth-reference-tenant` runs `policy: tenant`. App roles now resolve from
the active `member.app_roles` (a native array) onto `_user.roles`, the org
tier from `member.role` onto `_user.org_roles`, and `_user.attributes` is the
shallow merge of `user.attributes` and the active member's `attributes`
(member wins). Start with a fresh database (or drop
the old one) so pre-phase-3 users do not confuse the wall.

17. **Two organizations, seeded by slug**: start both pinned apps once, then
    `mongosh auth-reference --eval 'db["user-organizations"].find({}, {slug: 1}).toArray()'`
    shows `org-a` and `org-b` - each deployment ensured its org at startup
    (created if missing, untouched otherwise).
18. **Open signup auto-joins (org-a)**: sign up on `auth-reference`
    `/signup` with a fresh email. Before verifying, confirm the member row
    already exists but no session can be minted:
    `db["user-members"].find().toArray()` shows the row with
    `role: "member"` and **no** `app_roles`, while logging in still fails
    with EMAIL_NOT_VERIFIED. Verify via Mailpit, log in - `/dashboard`
    shows `roles: []` (app roles, `member.app_roles`) next to
    `org_roles: ["member"]` (the org tier, `member.role`). Role-gated pages
    (`/admin`, `/members`) still 404: they gate on the `user-admin` app
    role, and the org tier is not a gate source - `createAuthorize` reads
    only `roles`.
19. **The wall between deployments (org-b rejects an org-a member)**: with
    the user from 18, open `auth-reference-b`'s `/login` and sign in. The
    page renders the inline "You have not been granted access" message -
    the engine's `session.create` hook threw the distinct
    `MEMBERSHIP_REQUIRED` code (403) and **no session was minted**
    (`db["user-sessions"]` gained no row). Magic link: request one on
    org-b's login page; the rejection surfaces when the link is consumed.
    OAuth: with Google configured, the error carries through BetterAuth's
    OAuth error callback rather than an inline return.
20. **Bootstrap the walkthrough admin (dev seed - the phase-6 admin steps
    land later)**: one command writes both authorities into the member row,
    each on its own flag:
    ```sh
    AUTH_DATABASE_URI='mongodb://localhost:27017/auth-reference' \
      node scripts/set-member.mjs --email <you> --org org-a \
      --app-roles user-admin,auditor --org-role owner \
      --user-attributes '{"region":"global","branches":["hq"]}' \
      --member-attributes '{"branches":["a","b"]}'
    ```
    On `/dashboard`, press **Refresh session (UpdateSession)** - `roles`
    becomes `["user-admin", "auditor"]` and `org_roles` becomes `["owner"]`
    without a reload (the live member read; nothing is stamped on the
    session), and `attributes` shows the merged bag with the member's
    `branches` winning over the user's. `user-admin` is an ordinary app
    role: it is what `auth.pages.roles` and `auth.api.roles` gate on, so it
    opens `/users`, `/members` and the `admin-*` endpoints. `owner` is what
    makes the writes behind those pages land - every auth step is
    authorized against this member row. Seed `owner` rather than `admin`:
    the plugin's creator-protection and last-owner guards only bite while
    someone holds `owner`, so an organization with none has them all inert.
    `db["user-members"].find()` shows the two fields separately:
    `app_roles: ["user-admin", "auditor"]` and `role: "owner"`.
21. **App roles are an array, and unrecognised names are kept**: on
    `/members`, use **Update a member's app roles** on your own member id
    with `user-admin` and `auditor` selected - `/audit-reports` renders
    after a Refresh session. `db["user-members"].find()` shows
    `appRoles: ["user-admin", "auditor"]`, a native array - no CSV string
    anywhere - and `role` still `"owner"`, untouched by this control. Now
    select `not-a-role` as well: the save **succeeds**. Nothing validates
    submitted app roles against `auth.roles`, because an unrecognised name
    grants nothing - rejecting it would prevent no harmful outcome while
    failing an admin's whole save over a stale role they never touched.
    `/audit-reports` still renders; `not-a-role` opens nothing. Select
    nothing at all and save: `appRoles` is `[]` and `/audit-reports` 404s
    again.
22. **Member row deleted mid-session loses access on the next request**:
    while logged in, remove your member row:
    `node scripts/set-member.mjs --email <you> --org org-a --remove` -
    the next navigation treats you as logged out (no member row = the hard
    wall, not "logged in with no roles"). Re-add with
    `--app-roles user-admin,auditor --org-role owner`.
23. **Invite → sign-up → accept (org-b, with contact link)**: on
    `auth-reference` `/contacts` create a contact for a fresh email and
    copy its contact id. Promote yourself in org-b
    (`--org org-b --org-role admin`), then on `auth-reference-b` `/members`
    invite that email with no app roles, org role `member`, and the contact
    id. Copy the
    invitation id from the response (or Mailpit - the stock template mails
    it since no `invitation.send` hook is bound in app B). As the invitee:
    sign up on org-b's `/signup`, verify, log in - the **pending
    invitation admits the session** (no MEMBERSHIP_REQUIRED), but
    `/dashboard` still treats you as logged out (no member row yet). Open
    `/accept-invitation?invitationId=<id>`, accept - membership exists,
    `/dashboard` renders, and `db.users.find({email: "<invitee>"})` shows
    the invitation's `profile.contactId` merged onto the user's profile bag.
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
    shows `profile.contactId` (written through the `UpdateUserProfile`
    step). For the OAuth path, create a contact for your Google address
    and "Continue with Google" - the signup arrives verified, so
    `user.create.before` returns the record with `profile.contactId`
    inline. An invited user whose accept merged a `profile.contactId`
    (scenario 23) skips the merge - the hook only matches users with no
    `profile.contactId`.
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
28. **Switching is a tenant affordance, not a pinned one**: this app is
    pinned, so the organization plugin's client HTTP surface is off and
    `SetActiveOrganization` cannot be wired here at all - author it on any
    page and the build fails: the action
    `is not allowed under the "pinned" organizations policy - the
per-organization client endpoints are disabled for a pinned deployment`.
    `auth-reference`'s `/organizations` is read-only for that reason: it
    reads the pinned organization through the `org-info` endpoint and shows
    your `activeOrganizationId`, `roles` and `org_roles` in it. To exercise
    switching, use `auth-reference-tenant`'s own copy of the page, where the
    endpoints are enabled - give a user membership in two tenant orgs
    (invite or `set-member.mjs`), switch by slug, and the page's roles line
    updates after the chained UpdateSession without a reload.

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
    roles, no `auth_method`/`strategy_id` fields) - the session branch is
    terminal, so the key is never consulted. Drop the Cookie header and the
    same call resolves the **strategy caller**
    (`id: "apiKey:partner-access:acme"`, `auth_method: "apiKey"`,
    `strategy_id: "partner-access"`, `roles: ["partner"]`,
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
    `auth_method: "jwt"`, `strategy_id: "service-jwt"`, and
    `roles: ["partner"]` derived from the token's `roles` claim (the
    strategy grants no static roles). The same token reaches
    `partner-data`.

## Walkthrough (phase-6 gate - admin steps)

The admin steps are the sanctioned writers for the auth-owned collections.
They execute with server authority inside the `admin-*` `Api` endpoints
behind the endpoint role gate (`auth.api.roles` in `lowdefy.yaml`). The
endpoint gate decides who reaches the routine; it decides nothing about the
write. Each step declares the authority it requires in `meta.authority` and
the engine checks it before the step runs, against the caller's member row
in the **target** organization (org-a here) - so a caller holding
`user-admin` and nothing in that row reaches every page and endpoint below
and is refused by every write. Steps marked `system: true` run caller-less
and are exempt. `/users` drives the user steps (`ListUsers`, `BanUser`,
`UnbanUser`, `RevokeUserSessions`, `DeleteUser`, `UpdateUserAttributes`,
`UpdateUserProfile`, `CreateOrganization`), `/members` the member steps
(`ListMembers`, `InviteMember`, `CancelInvitation`, `RemoveMember`,
`UpdateMemberRoles`, `UpdateMemberOrgRole`, `UpdateMemberAttributes`). Seed
yourself first (the `set-member.mjs` command from scenario 20); the
scenarios also use a couple of disposable signed-up-and-verified users.

33. **The endpoint role gate rejects opaquely, before the routine runs**:
    sign up and verify a fresh user (open signup makes them a plain
    `member`). Signed in as them, run in the browser console on
    `/dashboard`:

    ```js
    await (
      await fetch('/api/endpoints/admin-list-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: {} }),
      })
    ).json();
    ```

    The response is `API Endpoint "admin-list-users" does not exist.` - the
    same answer an unknown endpoint id gets, so forbidden and missing are
    indistinguishable, and the routine never ran. The `/users` and
    `/members` pages 404 for the same caller. As the admin from scenario
    20, the same fetch returns the user list.

34. **Invite through the step - with and without a contact**: as the admin
    on `/members`, invite a fresh email with no app roles, org role
    `member`, and no contact id - the response renders the pending
    invitation and the **stock template** lands in Mailpit ("You have been invited to org-a", carrying
    the invitation id): no `invitation.send` hook is bound by default, so
    `auth.email` sends. Then create a contact on `/contacts` for a second
    fresh email and invite it **with** the contact id - the response
    carries `profile.contactId`. As that invitee: sign up, verify, and
    accept on `/accept-invitation?invitationId=<id>` -
    `db.users.find({email: "<invitee>"})` shows the merged
    `profile.contactId` (the phase-3 accept hook, now fed by the step).
    Keep this invitee around: scenarios 39 and 42 act on them.

35. **The two authorities fail differently on an invitation**: the org tier
    is a closed set, so ask for one outside it - in the browser console,
    `call('admin-invite-member', { email: '<fresh>', orgRole: 'auditor' })`
    (`auditor` is an app role, never an org tier) shows BetterAuth's
    `ROLE_NOT_FOUND` failure ("Role not found"), and nothing happened: no
    Mailpit message and no new `user-invitations` row. App roles are open,
    so the same invitation with `not-a-role` selected under **App roles**
    (deliberately in the selector, absent from `auth.roles`) succeeds - the
    invitation row carries `appRoles: ["not-a-role"]`, the accept copies it
    onto the member row, and it opens nothing. Orphaned role names are
    first-class, and removable.

36. **A bound invitation.send hook owns dispatch**: uncomment the
    `invitation-send` entry under `auth.hooks` in `lowdefy.yaml` and
    restart. Invite a fresh email - Mailpit gets **nothing** (the bound
    hook replaces the stock template) and `db['hook-audit']` gains an
    `invitation.send` row with
    `payloadKeys: ['invitation', 'organization', 'inviter']` and the
    invitation id: the hook routine dispatched (`api/invitation-send.yaml`;
    a real module hook would send the email itself). The invite response
    still carries the invitation id for the accept flow. Re-comment the
    binding afterwards.

37. **Neither a binding nor auth.email - a clear error**: with the hook
    still unbound, comment out the whole `auth.email` block in
    `lowdefy.yaml` and restart. Invite any email - the page error reads
    `Cannot send the invitation email. Bind an "invitation.send" auth hook
or configure "auth.email".` Restore `auth.email` (verification emails
    need it too).

38. **App roles and both attribute kinds through steps**: on `/members`,
    set your own member's app roles to `user-admin` and `auditor` (keep
    `user-admin` - dropping it locks you out of this page) and its
    attributes to `{"branches":["a","b"]}`; on `/users`, update your user
    attributes to `{"region":"emea","branches":["hq"]}`. On `/dashboard`,
    press Refresh session - `roles` is `["user-admin", "auditor"]`,
    `org_roles` is still `["owner"]` (nothing above touched `member.role`),
    and attributes show the merged bag with the member's `branches`
    winning. `UpdateMemberRoles` and the attributes steps write through the
    adapter's CRUD interface and fire **no** `user.update` or
    `member.update` hooks - documented behavior, not an oversight: these
    are admin-set authorization inputs, not user-driven edits.

39. **Ban revokes sessions and refuses sign-in; unban restores**: in a
    second browser, sign in as scenario 34's invitee and leave it on
    `/dashboard`. On `/users`, ban that user id with a reason - the list
    shows **banned** with the reason, and in the second browser the next
    navigation lands on the login page (`BanUser` revoked the sessions).
    Signing in again fails with "You have been banned from this
    application". Empty "expires in" means permanent; give it seconds to
    watch the ban lapse instead. Unban - sign-in succeeds and `/dashboard`
    shows the same roles and attributes as before the ban. (Banning
    yourself fails: BetterAuth's `YOU_CANNOT_BAN_YOURSELF`.)

40. **system: true runs caller-less; without it the step refuses**: log in
    as anyone - the newest `session.create.after` row on `/hook-audit`
    carries a numeric `systemStepUserTotal`, written by the `ListUsers`
    step running with `system: true` inside the caller-less hook routine.
    Delete the `system: true` line in `api/audit-login.yaml` - the next
    sign-in surfaces an operational error (`requires an authenticated
caller. Set system: true...`) while the session row still committed
    (the after-hook contract from scenario 15). Restore the line.

41. **Last-owner protection holds at the rail**: with the scenario-20 seed
    you are org-a's `owner`; make sure no other member holds it. On
    `/members`, use **Update a member's org role** on your own member id
    and pick `admin` - the update fails: "You cannot leave the organization
    without an owner." Remove your own member id - "You cannot leave the
    organization as the only owner". Promote a second member to `owner`
    through the same control and the demotion goes through. Note which
    control refuses: your app roles can be rewritten freely throughout -
    `member.appRoles` carries no invariant. Only the org tier does.

42. **DeleteUser cascades and leaves the contact untouched**: scenario 34's
    invitee has a user row, an org-a member row, a merged `profile.contactId`,
    and sessions; invite the same email once more so a **pending**
    invitation row also exists (re-inviting replaces any pending
    invitation and creates a fresh one - phase-8 semantics). Note the user
    id, then delete it on `/users` - the response lists the removed user,
    member rows, and pending invitations. Verify the cascade:

    ```sh
    mongosh auth-reference --eval '
      const email = "<invitee>"; const userId = "<deleted user id>";
      print("users:", db.users.countDocuments({ email }));
      print("members:", db["user-members"].countDocuments({ userId }));
      print("invitations:", db["user-invitations"].countDocuments({ email, status: "pending" }));
      print("sessions:", db["user-sessions"].countDocuments({ userId }));
      print("accounts:", db["user-accounts"].countDocuments({ userId }));
      print("contacts:", db["user-contacts"].countDocuments({ email }));'
    ```

    Everything is 0 - `removeUser` itself clears sessions and accounts
    (the phase-0 probe's answer), the step cascades members and pending
    invitations - except `contacts: 1`: the app-owned contact survives.

43. _Retired._ This number is deliberately left empty. The scenario it held
    walked through acting as another user, a capability the platform no
    longer has: nothing writes `user.role`, BetterAuth's admin HTTP surface
    is unmounted, and there are no client actions for it. The numbers after
    it are unchanged, because the walkthrough cross-references them.

44. **CreateOrganization runs as the system and names its owner**: on
    `/users`, create an organization with a fresh name and slug - the
    response shows the new org, and `db["user-members"]` gains an `owner`
    row for the user id the endpoint passed (yours). The step declares
    **system** scope: there is no organization to hold authority in before
    it runs, so no caller can satisfy it, and `api/admin-create-organization.yaml`
    marks it `system: true` and passes `userId` explicitly - the app takes
    that trust on its own `auth.api.roles` gate. Client-side org creation
    stays off (`allowUserToCreateOrganization: false`); the step is the
    sanctioned path. The new org is not this deployment's pinned one, and
    under `pinned` nothing here can act inside it.

Automation note: like phases 1-3 these stay manual - they need config
toggles with restarts, two browsers, and live email loops. Automate with
the repo's e2e tooling as it grows.

## Walkthrough (phase-8 gate - user-admin platform asks)

Phase 8 lands the platform asks the user-admin module design surfaced:
attributes stored as **native sub-documents** (the vendored MongoDB adapter
in `@lowdefy/connection-mongodb` enables `supportsJSON` and parses legacy
JSON-string rows on read), invite-time member attributes with
re-invite-replaces / resend-re-sends semantics
(`cancelPendingInvitationsOnReInvite`), org-scoped steps defaulting an
omitted `organizationId` to the **pinned** org, and the `_organization`
server operator reading the org the startup ensure resolved. Run as the
admin from scenario 20 unless a step says otherwise. The console fetches
follow scenario 33's shape:

```js
const call = async (endpoint, payload = {}) =>
  await (
    await fetch(`/api/endpoints/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    })
  ).json();
```

45. **Attributes land as sub-documents; a native aggregation filters on
    their contents**: on `/members`, set your member attributes to
    `{"region":"emea","branches":["a","b"]}` (and on `/users`, user
    attributes to `{"region":"apac"}`). Verify the storage shape is an
    object, not a JSON string:

             ```sh
             mongosh auth-reference --eval '
               const m = db["user-members"].findOne({ "attributes.region": "emea" });
               print("member attributes type:", typeof m.attributes, JSON.stringify(m.attributes));
               const u = db.users.findOne({ "attributes.region": "apac" });
               print("user attributes type:", typeof u.attributes);'
             ```

             Both print `object` - and the member query itself already filtered on
             attribute **contents**, which a JSON string cannot do. The rails read
             the same rows back as objects: `/dashboard` Refresh session shows the
             merged bag (`resolveAuthentication`), and `call('admin-list-members')`
             returns members whose `attributes` are objects (`ListMembers`). Now the
             read-only native aggregation over `user-members`
             (`api/admin-members-by-attribute.yaml`, `$match` on
             `attributes.region`): `call('admin-members-by-attribute', { region:

        'emea' })`returns your member row;`{ region: 'nowhere' }`returns

    `[]`.

46. **`_organization` resolves in a request and fails under tenant**:
    `call('org-info')` (public, no auth needed) returns
    `{ organization: { id, slug: "org-a", name: "org-a" } }` - the `id`
    matches `db["user-organizations"].findOne({ slug: "org-a" })`. The
    operator evaluates at request time inside the endpoint's routine; the
    same read works in any server config position (step properties,
    routine logic, connection requests). For the **auto-seeded default
    org**: comment out the whole `auth.organizations` block in
    `lowdefy.yaml` and restart - the build defaults the policy to `pinned`
    with slug `default`, the startup ensure seeds it, and `call('org-info')`
    now returns `slug: "default"`. Restore the block. For the **tenant
    error**: run the `auth-reference-tenant` app and call the same
    `org-info` there - the response is an operator error naming the
    policy: `_organization cannot resolve under the "tenant" organizations
policy - there is no single pinned organization.`

47. **Org-scoped steps default `organizationId` to the pinned org;
    explicit wins; tenant omission errors**: `call('admin-list-members')`
    (no `organizationId` in the payload - see
    `api/admin-list-members.yaml`) returns **org-a**'s members: the step
    defaulted to the pinned org. Explicit wins:
    `call('admin-list-members', { organizationId: '<org-b id>' })` (id
    from `db["user-organizations"].findOne({ slug: "org-b" })`, shared
    auth database) returns org-b's members instead. Under tenant: in the
    `auth-reference-tenant` app, `call('list-members-no-org')` (a
    `system: true` step, so no login needed) fails with `ListMembers
requires an
"organizationId" property under the "tenant" organizations policy -
there is no pinned organization to default to. Set organizationId on
the step properties.`; the same call with
    `{ organizationId: '<your tenant org id>' }` succeeds.

48. **Invite with attributes - the member row carries them from the first
    session**: invite a fresh email with attributes:
    `call('admin-invite-member', { email: '<fresh>', orgRole: 'member',
attributes: { region: 'emea', plan: 'gold' } })` - the response
    carries the `attributes`, and
    `db["user-invitations"].findOne({ email: "<fresh>" })` shows them as a
    **sub-document** on the invitation row. As the invitee: sign up,
    verify, accept on `/accept-invitation?invitationId=<id>` - the accept
    hook copied the attributes onto the minted member row
    (`db["user-members"]`, an object again), and `/dashboard` immediately
    shows `region: emea, plan: gold` under attributes: the first session
    resolved them on `_user.attributes` with no admin edit in between.

49. **Re-invite replaces; resend re-sends unchanged**: invite a fresh
    email - `call('admin-invite-member', { email: '<fresh2>', orgRole:
'member', attributes: { region: 'emea' } })` - and note the invitation
    id and the Mailpit message. Re-invite with corrections:
    `call('admin-invite-member', { email: '<fresh2>', orgRole: 'admin', appRoles: ['auditor'], attributes: { region: 'apac' } })` - the response is a **new** invitation id carrying the new roles and
    attributes;
    `db["user-invitations"].findOne({ _id: <old id> })` shows
    `status: "canceled"`, and opening the old accept link fails (the old
    invitation is dead). Now resend:
    `call('admin-invite-member', { email: '<fresh2>', orgRole: 'member',
resend: true })` - the response is the **same** invitation id with
    `role` still `admin`, `appRoles` still `["auditor"]` and attributes
    still `apac` (only `expiresAt` refreshed): a resend re-sends what was
    invited, it never rewrites it. Corrections are re-invites.

Automation note: these stay manual for the same reasons as phases 1-6
(restarts, a second app, live email); the console `call` helper keeps each
scenario a copy-paste. Automate with the repo's e2e tooling as it grows.

## Walkthrough (phase-9 gate - account asks)

Phase 9 lands the self-service action catalog (`/security` plus the
password round-trip and the 2FA challenge pages), `user.profile`
self-service on `UpdateUserProfile`, the step floor that authorizes every
auth step per organization, module-contributed auth wiring (the local
`modules/account-kit` module), and the `_build.authConfig` build operator.
A module contributes hooks, pages and public entries - **never** a role
gate: `account-kit`'s pages are gated, if at all, by this app's own
`auth.pages.roles`, one entry per module page, which is why scenario 62's
contribution log has no role line in it. No new environment variables.
Scenarios 50-57 run as any signed-up-and-verified member; the admin
scenarios run as the scenario-20 admin (`user-admin` in `appRoles`, `owner`
in org-a) and use scenario 33's/48's console `call` helper. For passkeys use `http://localhost:<port>` (the
configured `rpId` is `localhost`; `127.0.0.1` will not work) and a browser
with a platform authenticator - or Chrome DevTools > WebAuthn > "Enable
virtual authenticator environment".

50. **ChangePassword, with revokeOtherSessions**: sign in as the same user
    in a second browser and leave it on `/dashboard`. In the first browser
    on `/security`, enter a wrong current password - the change fails with
    an inline error, nothing revoked. Enter the real current password, a
    new password, switch **Revoke other sessions** on, and change - in the
    second browser the next navigation lands on the login page (its
    session died with the change), while your own session survives. Log
    out and back in: only the new password works.

51. **Password reset round-trip**: log out, `/login` > "Forgot password?"
    lands on `/forgot-password` (`authPages.forgotPassword`). Submit your
    email - `RequestPasswordReset` is public (a locked-out user holds no
    session) and you land on `/check-email`. Mailpit has "Reset your
    password"; the link goes through BetterAuth's callback endpoint
    (`/api/auth/reset-password/<token>?callbackURL=/reset-password`),
    which redirects to `/reset-password?token=<valid token>` - the page
    reads the token off the query. Set a new password - "Password reset" -
    then log in with it; the old password now fails. Open the same emailed
    link again: the used token redirects with `?error=INVALID_TOKEN` and
    the page shows the invalid-link message instead of the form.

52. **SendVerificationEmail (public resend)**: sign up a fresh email and,
    on `/check-email`, delete the verification message in Mailpit (the
    lost-email case). Enter the email in the resend field - a fresh
    "Verify your email address" message lands in Mailpit; verifying
    through it logs you in as usual. The action is public: it works
    logged out, because an unverified user holds no session.

53. **2FA enrolment renders its material once**: on `/security`, enter
    your password and press **Enable two-factor** - the page renders the
    `totpURI` and the single-use backup codes read from
    `_actions.enable_two_factor.response` in the same event chain (the
    action response is the only carrier - no side-channel state; copy the
    backup codes now). Add the secret to an authenticator app (the
    `secret` query param of the totpURI is the manual-entry key), enter
    the current TOTP code, and press **Verify code** - enrolment is
    confirmed (`TwoFactorVerify`'s enrolment role).
    `db.users.findOne({email: "<you>"}, {twoFactorEnabled: 1})` shows
    `true`, and `db["user-two-factors"]` has the secret row.

54. **The 2FA sign-in challenge**: log out and sign in with email and
    password. The response is a challenge, not a session - `Login`
    surfaces `{ twoFactorRedirect: true, twoFactorMethods: ["totp"] }` on
    its action response instead of navigating, and the login page routes
    to `/two-factor-challenge` (public - the pending state rides a
    BetterAuth cookie, so stay in the same browser). Enter a TOTP code -
    the verify completes the session itself and you land on `/dashboard`.
    Log out, sign in again, and this time use one of scenario 53's backup
    codes - it also passes, and it is single-use: the same code a second
    time fails. Optionally: sign out, sign in, and verify with **Trust
    this device** on - the next sign-in skips the challenge entirely.

55. **2FA disable restores plain sign-in**: on `/security`, enter your
    password and press **Disable two-factor** (password-gated, like
    enable). Log out and sign in - straight to the dashboard, no
    challenge, and `twoFactorEnabled` is back to `false`.

56. **Passkey lifecycle**: on `/security`, optionally name the passkey and
    press **Register a passkey** - `PasskeyRegister` runs the whole
    WebAuthn browser ceremony inside the action, and the list refreshes
    with the new passkey and its id (the list reads BetterAuth's own
    session-gated `/api/auth/passkey/list-user-passkeys`; a plain read
    needs no catalog action). `db["user-passkeys"]` shows the credential.
    Copy the passkey id into the delete field and press **Delete
    passkey** - the list empties and the row is gone.

57. **RevokeOtherSessions**: sign in as the same user in a second browser.
    On `/security` in the first, press **Revoke every session except this
    one** - the second browser's next navigation is logged out; your own
    session survives. (Per-session revoke is deliberately not an action -
    it would put session tokens in config reach; the console flow from
    scenario 7 remains the way to revoke a specific session.)

58. **AcceptInvitation through the action**: the accept-invitation page
    now runs the `AcceptInvitation` catalog action (it posted to
    `/api/auth/organization/accept-invitation` directly before) - one of
    the four public actions. Re-run scenario 34's invite-accept loop: the
    behavior is identical, including BetterAuth's own gate that the
    session email must match the invitation email (accept while signed in
    as a different user to see it refuse). All three apps share the
    converted page.

59. **`_user.profile` presentation**: as a fresh user with no profile
    writes (no contact match, no invitation merge, no display-name save),
    `/dashboard` shows `profile.contactId:` empty - `_user.profile` is
    undefined until something writes the bag; nothing invents an empty
    object. After any profile write it resolves on the next session
    re-sync: the scenario-25 merge and scenario-23/34 invitation merges
    show it landing via hooks (with the invitation-carried key winning -
    the merge hook skips a user whose `profile.contactId` is already
    set), and scenario 60 shows a direct write surfacing after
    `UpdateSession`. Re-invite replaces profile like everything else on
    the invitation (scenario 49's semantics):
    `call('admin-invite-member', { email: '<fresh>', orgRole: 'member',
contactId: 'contact-a' })`, then re-invite with `contactId:
'contact-b'` -
    `db["user-invitations"].findOne({email: "<fresh>", status: "pending"})`
    carries `profile.contactId: "contact-b"`, and accepting merges **b**
    onto the user.

60. **Display-name self-service - UpdateUserProfile without any authority**:
    as ANY plain member (no app roles, `member` in org-a), on `/security`
    set a display name and press **Save display name**. The
    `update-my-profile` endpoint is deliberately ungated and fixes `userId`
    to the caller's own id - `UpdateUserProfile` self-targeting is exempt
    from the step floor, so the save succeeds, and after the chained `UpdateSession` the page
    shows the new `name` and `profile.displayName`. Press **Clear display
    name** - the endpoint sends `profile: { displayName: null }` and the
    key is REMOVED from the bag (the per-key merge), not stored as null;
    `name` keeps its last value (the step writes only what it is given).

61. **Admin profile edit - the member row gates other-targeting**: as the
    scenario-20 admin on `/users`, pick a target user id (of another org-a
    member) and update its profile with
    `{"displayName":"Renamed","flag":true}` - the response shows the merged
    bag. Update again with `{"flag":null}` - the key is removed,
    `displayName` survives (merge per top-level key). Now seed a member who
    holds the app role but no authority
    (`node scripts/set-member.mjs --email <other> --org org-a --app-roles user-admin --org-role member`):
    signed in as them, the same call passes the `admin-*` endpoint gate
    (the pages and endpoints answer) but the STEP refuses -
    `Auth step "update_user_profile" refused - the caller does not hold
user: [update] in organization "org-a".` Only self-targeting is exempt,
    and this endpoint passes an arbitrary `userId`. Try a target user who is
    NOT an org-a member and the refusal names that instead
    (`user "<id>" is not a member of organization "org-a"`): a
    deployment-wide user row is only this organization's business for the
    people in it. This is also scenario 65's non-holder caller.

62. **Module manifest contributions - logged, merged, app wins**: restart
    the dev server and read the build output. The `account-kit` module
    (see `modules/account-kit/module.lowdefy.yaml`) contributes four
    entries, each logged with its origin and target key:

    - auth hook `account-kit/account-audit:session.create.after`
    - auth hook `account-kit/account-audit:email.verified`
    - `/account-kit/error` to `auth.authPages.error`
    - public page `account-kit/account-help` to `auth.pages.public`

    There is NO line for `signIn`: the app sets `auth.authPages.signIn`
    itself and the app wins per key. Inspect the merged result in
    `_server/dev/build/auth.json`: `authPages.signIn` is still `/login`,
    `authPages.error` is `/account-kit/error`, and the `hooks` array
    starts with the two module bindings followed by the app's own entries
    (array order IS the execution tier order). Behavior, logged out:
    `/account-kit/error` renders (a page holding an authPages role is
    public automatically, without being on any public list);
    `/account-kit/account-help` renders (manifest `public` list);
    `/account-kit/login` redirects to the login page - the ceded claim
    left it an ordinary protected module page.

63. **Many hooks, one point - module binding runs before the app's**:
    `session.create.after` and `email.verified` are each bound twice now
    (module + app), which phase 2 rejected as duplicates and phase 9
    composes in tier order. Log in as any verified user:
    `db["module-audit"].find().sort({at: -1})` gains a row with
    `payloadKeys: ["session", "user"]` (the module hook saw the same
    catalog payload), and `/hook-audit` still gains the app's
    `session.create.after` row - both ran, module first (compare the `at`
    timestamps; the app's audit-login also runs its ListUsers step before
    writing). Sign up and verify a fresh email: both `email.verified`
    bindings fire too - a `module-audit` row with `payloadKeys: ["user"]`
    next to the app's `hook-audit` row.

64. **`_build.authConfig` - the method-driven page**: open
    `/login-methods` (public, works logged out). It renders
    the six curated projection paths - `emailAndPassword.enabled`,
    `magicLink.enabled`, `twoFactor.enabled`, `passkey.enabled` (all
    `true` here), `providers` as `[{"id": "auth0", "type":
"GenericOAuth"}]`, and `organizations.signup: open` - baked in at
    build time; none of the auth block ships to the client. Set
    `auth.twoFactor.enabled: false` in `lowdefy.yaml` and restart - the
    page shows `false` (a build-time value, not a runtime read); restore
    it. Then edit the page's operator to an unknown path (e.g.
    `_build.authConfig: twoFactor.turned-on`) - the build FAILS naming
    the readable paths; a typo can never silently gate a login method
    off. Restore the page. (The page is app config on purpose: module
    content resolves before the projection pre-pass, so a module page
    cannot read `_build.authConfig` today - using it there fails the
    build.)

65. **The floor binds at the step, not the endpoint**:
    `list-members-ungated` has no `auth.api.roles` entry - any caller
    reaches its routine. Signed in as any member without authority in org-a
    (a plain scenario-33 member, or scenario 61's role-holding
    `member`-tier caller), run `call('list-members-ungated')` - the step
    refuses: `Auth step "list_members_ungated" refused - the caller does
not hold member: [list] in organization "org-a".` An app can no longer
    expose member data by forgetting an endpoint gate. As the scenario-20
    admin the same call returns the member list. The endpoint gate is
    unchanged on top: for the plain member,
    `call('admin-list-members')` still answers with scenario 33's opaque
    "does not exist" - the gate rejects before the floor is ever
    consulted.

66. _Retired._ This number is deliberately left empty, like 43. The
    scenario it held granted, exercised and revoked a deployment-wide
    administering capability through a denormalized `user.role`. There is
    no such field, no such capability, and no deployment-wide authority
    tier of any kind - authority is per organization, and scenarios 75-78
    walk through what replaced it. The numbers after it are unchanged.

67. **An invitation carries both authorities, and the first session has
    them**: invite a fresh email from `/members` with `user-admin` under
    **App roles** and `admin` as the **Org role**. As the invitee: sign
    up, verify, and accept on `/accept-invitation?invitationId=<id>` -
    immediately after the accept,
    `db["user-members"].findOne({ userId: "<invitee id>" })` shows
    `app_roles: ["user-admin"]` and `role: "admin"`: the accept path copied
    the app roles off the invitation and minted the org tier from its
    `role`, with no admin edit in between. The invitee's very first session
    resolves both - `/dashboard` shows `roles: ["user-admin"]` and
    `org_roles: ["admin"]`, `/members` opens (the app role), and
    `call('list-members-ungated')` returns the member list (the org tier).
    Invite a second address with `user-admin` and the default `member` org
    role and only the first of those two is true for them.

68. **The floor binds user-initiated calls only (auth-reference-b)**:
    signed in at app B as an org-b member (scenario 23's invitee, whose
    member row is `member`), run scenario 33's fetch against
    `list-members-step` (ungated, user-initiated `ListMembers`) - the step
    refuses: `Auth step "list_members" refused - the caller does not hold
member: [list] in organization "org-b".` The same step as a system
    routine still works: `call('list-members-system')` returns org-b's
    members (`system: true`, like the hook paths). Promote that member to
    `admin` in org-b (`--org org-b --org-role admin`) and the
    user-initiated call answers too - nothing else changed, and no app
    config was touched: the grant is the member row. (Run the refusal
    logged in - an anonymous caller fails earlier, with the step's
    authenticated-caller requirement.)

Automation note: manual like every phase before - passkey ceremonies,
authenticator codes, two browsers, restarts and live email loops. The
console `call` helper keeps the API scenarios copy-paste. Automate with
the repo's e2e tooling as it grows.

## Walkthrough (phone number and captcha)

Phone-based login (the BetterAuth `phoneNumber` plugin surfaced as
`auth.phoneNumber`) and bot protection on the spend endpoints (the `captcha`
plugin surfaced as `auth.captcha`). One new environment variable:
`LOWDEFY_SECRET_TURNSTILE_SECRET_KEY` set to Cloudflare Turnstile's
documented always-pass test secret (see Environment above) - the site key in
`lowdefy.yaml` is the matching test key, so the widget renders and always
passes without a Cloudflare account. There is no real SMS provider: the
`send-otp-sms` hook routine writes each code to the `sms-outbox` collection
in the auth database, this walkthrough's Mailpit-for-SMS. Re-run
`node scripts/provision-indexes.mjs` first - the phone flows add the
partial-unique `users { phoneNumber: 1 }` index.

69. **Phone OTP sign-up**: open `/phone-login` (linked from `/login`). Enter
    `+27831234567`, let the Turnstile test widget pass, and click _Send
    code_. Read the code from `sms-outbox` (e.g.
    `db['sms-outbox'].find().sort({at:-1}).limit(1)`), enter it, and click
    _Verify and sign in_ - you land on `/dashboard` with a session. Gates:
    the account was created on first verify (`signUpOnVerification`) with
    the synthetic email `27831234567@phone.auth-reference.test` in `users`;
    open signup auto-joined it to org-a (the membership wall passes); the
    `phone.verified` hook wrote an `event: phone.verified` row to
    `hook-audit`.

70. **E.164 is pinned at the wire**: send a code to `083 123 4567` or
    `+27 83 123 4567` - the call fails with the invalid-phone-number error
    before any send; no `sms-outbox` row appears. One phone, one identity:
    the spaced, local and canonical forms cannot mint three accounts.

71. **The captcha gate on the OTP send**: `/phone-number/send-otp` and
    `/sign-up/email` are in `auth.captcha.endpoints`. In the console, call
    the send endpoint without a token:
    `fetch('/api/auth/phone-number/send-otp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phoneNumber: '+27830000001' }) }).then((r) => r.json()).then(console.log)`

    - a 400 with the missing-captcha code, and no `sms-outbox` row. The
      page's send works because `PhoneNumberSendOtp` threads the block's
      token as the `x-captcha-response` header. Email login (`/login`) stays
      token-free - the explicit `endpoints` list scopes the gate; delete the
      list and restart to see the computed default set protect every enabled
      method's initiate endpoints (each login/signup/reset page then needs
      its own widget).

72. **Signup carries the same gate**: `/signup` now renders the widget
    (configured entirely from the `_build.authConfig` projection -
    `captcha.enabled`, `captcha.provider`, `captcha.siteKey`) and threads
    `captchaToken` through `SignUp`. Tokens are single-use: on a failed
    signup the catch chain calls the block's `reset` method, so the retry
    mints a fresh token instead of failing with a missing-response error.

73. **Password reset over SMS**: with a phone account from scenario 69, run
    `fetch('/api/auth/phone-number/request-password-reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phoneNumber: '+27831234567' }) }).then((r) => r.json()).then(console.log)`

    - a reset code lands in `sms-outbox` (the `phone.passwordReset.send`
      binding shares the `send-otp-sms` endpoint). Comment that binding out
      and restart: the same request fails loudly naming the missing
      `phone.passwordReset.send` binding - BetterAuth's silent
      `{ status: true }`-without-sending is closed by the engine.

74. **Phone + password sign-in**: after scenario 73 sets a password via
    `ResetPassword` (`phoneNumber` + `otp` + `newPassword` params - or use
    the reset code with a console call to
    `/api/auth/phone-number/reset-password`), `Login` with
    `{ phoneNumber, password }` params signs in through
    `/sign-in/phone-number`.

## Walkthrough (per-organization authority)

Two facts decide what a caller can do, and neither derives from the other:

- an **app role** on `member.app_roles` says "show me the admin UI". It
  reaches config as `_user.roles` and is the only thing `auth.pages.roles`
  and `auth.api.roles` match against.
- the **member row in the target organization** says "you may actually
  change things". `member.role` is BetterAuth's `owner`/`admin`/`member`
  tier, reaches config as `_user.org_roles`, and is what every auth step's
  declared authority is checked against - in the organization the step
  writes into, not the one the caller happens to be signed in to.

The platform makes no attempt to keep them in agreement, and neither
mismatch is a privilege leak. Run these as the scenario-20 admin unless a
step says otherwise, with scenario 33's/48's console `call` helper.

75. **The two facts, both directions**: seed a second member who holds the
    app role and no authority:

             ```sh
             AUTH_DATABASE_URI='mongodb://localhost:27017/auth-reference' \
               node scripts/set-member.mjs --email <other> --org org-a \
               --app-roles user-admin --org-role member
             ```

             Signed in as them, `/members` **renders** - the app role is what the
             page gate reads, and the member list loads (`ListMembers` needs
             `member: [list]`... which they do not hold, so the list is empty and the
             page's error line carries `Auth step "list_members" refused - the caller

        does not hold member: [list] in organization "org-a".`). Press **Send

    invitation** on any address: refused the same way, naming
    `invitation: [create]`. The page loaded; nothing it offers works. Now
    the other direction: reseed them with authority and no app role
    (`--app-roles "" --org-role admin`- or select nothing under **Update a
    member's app roles** from your own admin session).`/members`now
    **404s\*\* for them: no UI offers the writes they are entitled to, and
    `db["user-members"]` shows exactly the row that entitles them. Neither
    state is a leak - one is a UI that refuses, the other is authority with
    no button.

76. **UpdateMemberOrgRole grants and revokes, and the last-owner guard
    holds**: as the scenario-20 admin (`owner` in org-a), copy scenario
    75's member id from the member list. Under **Update a member's org
    role** pick `admin` and save - the row reloads with `role: "admin"`, and
    signed in as them their admin writes now land while their `app_roles` are
    untouched (`/dashboard` shows `org_roles: ["admin"]` next to whatever
    `roles` they hold). Save `member` for the same member id - revoked;
    their next write is refused again. `member` is the revoked value: there
    is no fourth one, and `''` is not accepted. Then try the guard: with
    yourself the only `owner`, set your **own** member id to `admin` - the
    endpoint refuses with "You cannot leave the organization without an
    owner." Promote the other member to `owner` first and the same demotion
    succeeds. The guard lives in the organization plugin's endpoint, which
    is why this step goes through it rather than writing the field
    directly.

77. **`_user.roles` and `_user.org_roles` are separate, and only one is a
    gate source**: as the scenario-20 admin, set your app roles to
    `user-admin` alone and your org role to `admin`. `/home` and
    `/dashboard` both show the pair: `roles: ["user-admin"]`,
    `org_roles: ["admin"]`. Now try to gate a page on the org tier - set
    `auth.pages.roles` in `lowdefy.yaml` to `admin: [audit-reports]` and
    restart: the **build fails** with
    `Auth gate references role "admin", which is not declared in auth.roles`,
    and the message says why - the organization tier is not a gate source, it
    reaches apps as `_user.org_roles`. Declare `owner` in `auth.roles` to get past that and
    gate `audit-reports` on it instead: the build passes and the page
    **never opens**, for anybody, no matter what the org tier says.
    `createAuthorize` reads `roles` and nothing else. Restore the gate to
    `auditor`.

78. **A foreign active organization resolves unauthenticated**: sign in at
    `auth-reference`, confirm `/dashboard` renders, then point your session
    at the other pinned deployment's organization:

    ```sh
    mongosh auth-reference --eval '
      db["user-sessions"].updateOne(
        { userId: "<your user id>" },
        { $set: { activeOrganizationId: "org-b" } }
      );'
    ```

    Reload `/dashboard` - you land on the **sign-in page**. That is the
    whole symptom: the caller resolved unauthenticated, because under
    `pinned` the active organization must be this app's, member row there or
    not (the organization's id IS its configured slug, so the check costs no
    database read). Log in again **at `auth-reference`** and you are back -
    `applyPinnedPolicy` runs at every `session.create` and re-pins the
    session to org-a. Do **not** fix it by signing in at `auth-reference-b`:
    outside dev both apps share the `lowdefy` cookie prefix
    (`resolveCookiePrefix` derives a per-app prefix in dev only, which is
    why the mongosh nudge above is needed to see this locally), so signing
    in there flips the shared session the other way and breaks the app you
    came from. In production this is what an invitee hits after accepting an
    invitation for another organization - which is why
    `/accept-invitation` tells them to sign in again at this app.

Automation note: manual like every phase before - two deployments, a
database nudge and live sessions. Automate with the repo's e2e tooling as it
grows.

## Walkthrough (two-factor-lifecycle gate)

This phase turns two-factor into a **floor**. `auth.twoFactor.required: true`
(with `authPages.twoFactorEnrol: /two-factor-enrol`) means a member who has
not enrolled a second factor cannot use the app until they do: every page
redirects them to `/two-factor-enrol`, and every request, endpoint and
websocket is refused with a `TwoFactorEnrolmentRequiredError` - a **403, not a
401**. A caller satisfies the floor with **either** a TOTP enrolment **or** a
registered passkey. `/two-factor-enrol` is the one **protected** auth page
(its sibling `/two-factor-challenge` is public - opposite public-ness, on
purpose) and it calls **no** Lowdefy request or endpoint, because an unenrolled
caller would be refused at all of them; it runs entirely on the client auth
actions `TwoFactorEnable`, `TwoFactorVerify` and `PasskeyRegister`. Recovery is
two admin steps from `/users`: `ResetUserTwoFactor` (paired **mandatorily**
with `RevokeUserSessions`) and `RevokeUserPasskeys`.

Run the admin steps as the scenario-20 admin (`user-admin` in `appRoles`,
`owner` in org-a) with scenario 48's console `call` helper; the floor scenarios
use a few disposable signed-up-and-verified users. **Enrol the admin's own
factor first** - turning `required` on sends the admin to `/two-factor-enrol`
too, and a locked-out sole admin has no in-app way back. Re-run
`node scripts/provision-indexes.mjs` before starting: this phase adds the
platform-owned `user-passkeys { userId: 1 }` index (read per request for every
unenrolled caller) and the unique `user-two-factors { userId: 1 }` index.

79. **The enrolment floor redirects on a page**: sign up and verify a fresh
    user (open signup makes them a plain `member`; they hold no factor). Signed
    in as them, open any protected page, e.g. `/dashboard` - you are
    redirected to `/two-factor-enrol?callbackUrl=%2Fdashboard`. The page
    renders the TOTP and passkey options and calls no endpoint. (If it lands on
    `/404` instead, the `renderPage` enrol branch is missing.)
80. **The floor redirects on a client-side navigation too**: from
    `/two-factor-enrol`, client-side navigate to another protected page (any
    in-app link, e.g. back to `/dashboard`). The SPA follows the JSON page
    route's `403 { redirect }` and returns you to `/two-factor-enrol`. (If the
    client keyed on `401` only, this would silently do nothing and leave you on
    a page you cannot use.)
81. **Enrol TOTP clears the floor**: on `/two-factor-enrol`, enter your
    password, press **Enable authenticator** - the `totpURI` and single-use
    backup codes render once (copy them). Add the secret to an authenticator
    app, enter the current code, press **Verify code and finish enrolment**.
    You are returned to the `callbackUrl` page (`/dashboard`) and it now
    renders. `_user.two_factor_enrolled` reads `true` (the `/dashboard` block
    that prints `_user` shows it), and
    `db.users.findOne({email: "<you>"}, {twoFactorEnabled: 1})` is `true`.
82. **Passwordless enrol, and a passkey satisfies the floor**: sign in as a
    SECOND unenrolled user who is **passwordless** (an OAuth or magic-link
    account that never set a password) and enrol TOTP on `/two-factor-enrol`
    with the password field left empty - it is admitted, because Lowdefy sets
    `allowPasswordless: true`. Then, as a THIRD unenrolled user, register a
    **passkey** instead of TOTP (use `http://localhost:<port>`; `127.0.0.1`
    will not work) - the passkey alone clears the floor and you reach
    `/dashboard`. `db["user-passkeys"]` shows the credential. Keep this passkey
    user for scenario 88.
83. **Every non-page surface is refused at 403, not 401**: as an unenrolled
    session (a fresh member from scenario 79 before enrolling), in the browser
    console run `call('admin-list-users')` and a page request against any
    protected page's JSON route - both are refused with a
    `TwoFactorEnrolmentRequiredError` at **403** (not 401: a 401 would read as
    a dead session and bounce to sign-in, the loop the floor avoids). A
    websocket subscription from the same session is refused the same way.
84. **The enrolment check runs AFTER the role check**: still as the unenrolled
    caller, request a protected page whose **role you lack**, e.g. `/admin`
    (needs `user-admin`) - you get the opaque `/404`, **byte-identical** to a
    page that does not exist, NOT the enrol redirect. This is the ordering
    assertion: an enrol redirect here would be a page-enumeration oracle,
    revealing that `/admin` exists to someone never authorised for it.
85. **Sessionless callers are untouched (Decision 10)**: with `required: true`
    still on, the API-strategy path still works -
    `call -H "X-API-Key: partner-key-acme-0123456789abcdef"
http://localhost:3000/api/endpoints/partner-data` returns its report, not a
    403. Uncomment `dev.mockUser` (`roles: [user-admin]`) and restart - the
    pre-resolved dev caller reaches `/dashboard` and `/users` with no
    enrolment. Both carry no session, so the floor does not apply. (A
    redirect/403 for either means something tested `!two_factor_enrolled`
    instead of `=== false`.) Re-comment `dev.mockUser`.
86. **Admin reset recovers the TOTP user - and revokes their sessions**: as
    the scenario-20 admin on `/users`, in a second browser leave the scenario
    81 TOTP user signed in on `/dashboard`. Enter their user id and press
    **Reset two-factor** - confirm the dialog (it enumerates the reach: clears
    the factor in **every** organization the person belongs to and revokes
    their sessions). Verify:

    ```sh
    mongosh auth-reference --eval '
      const userId = "<that user id>";
      print("two-factors:", db["user-two-factors"].countDocuments({ userId }));
      print("twoFactorEnabled:", db.users.findOne({ _id: userId }).twoFactorEnabled);
      print("sessions:", db["user-sessions"].countDocuments({ userId }));
      print("trust-device:", db["user-verifications"].countDocuments({ value: userId, identifier: /^trust-device-/ }));
      print("2fa (unrelated):", db["user-verifications"].countDocuments({ value: userId, identifier: /^2fa-/ }));'
    ```

    `two-factors: 0`, `twoFactorEnabled: false`, `sessions: 0`, and
    `trust-device: 0` - while any unrelated in-flight `2fa-*` verification
    rows for the same user **survive** (the reset deletes only the
    `trust-device-` records, by the identifier prefix). In the second browser,
    the user's next navigation lands on the login page (sessions revoked).
87. **A reset user is routed straight back to enrolment**: sign in as the
    scenario 86 user - because they now hold no factor under `required`, the
    first protected page redirects to `/two-factor-enrol`. Recovery is
    re-enrolment, exactly like a new member.
88. **Revoke passkeys, all and one**: as the admin on `/users`, act on the
    scenario 82 passkey user. First register a second passkey for them (as
    that user, on `/security` or `/two-factor-enrol`) so there are two. Use
    **Revoke one passkey** with a specific `passkeyId` (from
    `db["user-passkeys"].find({userId: "<id>"})`) - only that row is deleted.
    Then **Revoke all passkeys** (no `passkeyId`) - the rest are gone.
    Confirm `db["user-passkeys"].countDocuments({userId: "<id>"})` is `0`; on
    the user's next request they are routed to `/two-factor-enrol` (no factor
    left). This routine revokes **no** sessions - passkey revocation is
    surgical, and ending sessions is the separate **Revoke sessions** control's
    job.
89. **A member cannot run either routine**: signed in as a plain member (no
    `user-admin` app role), `/users` `404`s and
    `call('admin-reset-user-two-factor', { userId: '<x>' })` /
    `call('admin-revoke-user-passkeys', { userId: '<x>' })` both return the
    opaque `does not exist` - the `admin-*` endpoint gate rejects before the
    routine runs.
90. **The target-user bound blocks a cross-org reset**: `auth-reference-b`
    shares this auth database. As an **org-b** admin there, try to reset a user
    who holds a member row in org-a but **none in org-b** -
    `call('admin-reset-user-two-factor', { userId: '<org-a-only user id>' })`
    is refused naming the bound (`user "<id>" is not a member of organization
"org-b"`). `ResetUserTwoFactor`'s reach is suite-wide, so the membership bound
    is the only thing stopping any org's admin from resetting any user; it
    governs **who** you may reset, not how far the reset reaches.
91. **Signed-out existence fork - protected-by-default hides non-existence**:
    log out. Request a **nonexistent** page path in this app - because
    `auth.pages.protected: true` here, a logged-out caller gets the **sign-in
    page** (with a `callbackUrl`), **not** `/404`. A missing page and a
    protected page are indistinguishable to an anonymous caller, so nothing
    reveals which pages exist. (Contrast: an app configured with an explicit
    `auth.pages.protected: [...]` allow-list still returns `/404` for a
    nonexistent page - the opaque behaviour is specific to protected-by-default.)
92. **Signed-out missing ids are 401, not 500**: still logged out, POST a
    **nonexistent** `requestId` and a nonexistent `endpointId`
    (`curl -s -X POST -H 'content-type: application/json' -d '{}'
http://localhost:3000/api/request/<page>/no-such-request` and
    `.../api/endpoints/no-such-endpoint`) - both answer **401**, the same as an
    existing protected one would to an anonymous caller. (Before this phase a
    missing id was a `500`.)
93. **Signed-in missing requestId stays opaque and unchanged**: sign in, then
    call a nonexistent `requestId` from a page you can reach - you get today's
    opaque "does not exist" answer, unchanged by this phase. A signed-in caller
    already passed identity, so there is nothing to hide from them here.

Automation note: manual like every phase before - authenticator codes, passkey
ceremonies, two browsers, a second deployment, restarts and live sessions. The
console `call` helper keeps the API scenarios copy-paste. Automate with the
repo's e2e tooling as it grows.
