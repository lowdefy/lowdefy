# Auth reference app

The living definition of done for the auth upgrade. Phase 1 exercises the
BetterAuth engine: email/password signup with email verification, magic
link, OAuth, protected/public/role-gated pages, sign out, and session
revocation. Phase 2 adds auth hooks: `InternalApi` endpoints bound to
`user.create.before`, `session.create.after`, and `email.verified`. Each
later phase grows this app with a scenario.

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

## Walkthrough (phase-1 gate)

1. **Public page**: open `/home` logged out - it renders. `/dashboard`
   redirects to `/login?callbackUrl=/dashboard`.
2. **Sign up (email/password)**: `/signup` → submit. The response carries
   **no session** (check the Mailpit inbox); you land on `/check-email`.
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
