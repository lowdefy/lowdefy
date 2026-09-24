# migration-fixture — codemod validation app

The auth-upgrade codemod's fixture app **after migration**. The pre-migration original — a synthetic app in the old NextAuth-shaped `auth:` config, exercising every config breaking change — lives in the design repo (`../lowdefy-design/designs/auth-upgrade/codemod/fixture/`), alongside the codemod prompt files (`codemod/prompts/01`–`07`).

This directory is the validation artifact for the phase-7 gate:

- **Conversion** — a context-blind agent, given only prompt files 01–06 and the old-shape config, produced this app's `auth:` block. Its per-prompt flags, mapping tables, and env-var instructions are in [MIGRATION-REPORT.md](./MIGRATION-REPORT.md).
- **Detection** — a second context-blind agent ran prompt 07 and produced [USER-REFERENCES-REPORT.md](./USER-REFERENCES-REPORT.md): all 19 seeded dropped-claim / `sub` / old-attribute reads, each with its new home, and nothing else (matches [expected-report.md](./expected-report.md)).
- **Build** — `node lowdefy/build.mjs --configDirectory apps/migration-fixture` (from `packages/servers/server`, with a scratch `--serverDirectory`) passes with zero errors.
- **Runtime** — the live walkthrough below ran end to end against a fresh database.

One deliberate deviation from raw codemod output, noted in the config: `dev.mockUser` is commented out, because an active mock disables the real auth engine in server-dev. (The hook endpoint stubs' audit writes to the `records` collection are the conversion agent's own scaffolding, following prompt 06's example — they make hook firing observable in the walkthrough.)

## Running the walkthrough

Prerequisites: MongoDB on `127.0.0.1:27017` and an SMTP sink on `127.0.0.1:1025` with an HTTP API on `:8025` (e.g. Mailpit). Create `apps/migration-fixture/.env` (gitignored):

```
LOWDEFY_SECRET_MONGODB_URI=mongodb://127.0.0.1:27017/fixture-app
LOWDEFY_SECRET_BETTER_AUTH_SECRET=<openssl rand -base64 32>
LOWDEFY_SECRET_SMTP_HOST=127.0.0.1
LOWDEFY_SECRET_SMTP_USER=fixture
LOWDEFY_SECRET_SMTP_PASS=fixture
LOWDEFY_SECRET_GOOGLE_CLIENT_ID=dummy          # OAuth providers configured but
LOWDEFY_SECRET_GOOGLE_CLIENT_SECRET=dummy      # not exercised (no live IdP)
LOWDEFY_SECRET_GITLAB_CLIENT_ID=dummy
LOWDEFY_SECRET_GITLAB_CLIENT_SECRET=dummy
LOWDEFY_SECRET_CORP_CLIENT_ID=dummy
LOWDEFY_SECRET_CORP_CLIENT_SECRET=dummy
```

Provision the documented index requirements, then start the app:

```bash
AUTH_DATABASE_URI='mongodb://127.0.0.1:27017/fixture-app' \
  node apps/auth-reference/scripts/provision-indexes.mjs
node scripts/dev.mjs --config-directory apps/migration-fixture
```

### Scenario — signup wall, membership, roles, hooks, sign-out

The app has no `auth.organizations` block, so it runs as a single-org app: one org (slug `default`) auto-seeded at startup, pinned, **invite-only**.

1. **Magic-link signup hits the wall.** `POST /api/auth/sign-in/magic-link` with `{"email":"admin@fixture.example.com","callbackURL":"/"}`; open the emailed link. Expected: HTTP 403 — the `users` row is created (and the `user.create.after` hook writes a `user_created` audit record to `records`), but no `user-sessions` row exists: a non-member cannot mint a session.
2. **Seed membership** (walkthrough bootstrap, same standing as the data migration):
   ```bash
   AUTH_DATABASE_URI='mongodb://127.0.0.1:27017/fixture-app' \
     node apps/auth-reference/scripts/set-member.mjs \
     --email admin@fixture.example.com --org default --roles admin \
     --member-attributes '{"branch":"north"}' --user-attributes '{"tier":"gold"}'
   ```
3. **Sign in.** Request a new magic link, open it (keep cookies). Expected: 200 with a session cookie; the `session.create.before` hook (check-email-domain) admits it and `session.create.after` writes a `login` audit record.
4. **Resolved identity.** `GET /api/user` with the cookie: `roles: ["admin"]` (from the member row), `attributes: {"tier":"gold","branch":"north"}` (user + member merged, member wins), `activeOrganizationId` set.
5. **Page and API authorization.** `GET /api/page/admin` → 200 with the admin role, 401 without a session. `POST /api/endpoints/whoami` without a session → opaque `API Endpoint "whoami" does not exist.`
6. **Dropped `_user` paths are really gone.** `POST /api/endpoints/whoami` with the session: `subject` (reads `_user: sub`) and `tier` (reads `_user: global_attributes.tier`) are `null`; `email` resolves. Exactly the reads USER-REFERENCES-REPORT.md flags with their new homes.
7. **Sign out.** `POST /api/auth/sign-out` with an `Origin: http://localhost:3000` header → `{"success":true}`; the `user-sessions` row is deleted and the `session.delete.after` hook writes a `logout` audit record: `records` now holds `user_created`, `login`, `logout`.

### Stays manual / out of this fixture's scope

OAuth sign-in (Google/GitLab/GenericOAuth are configured to validate the conversion but need live IdP credentials), email/password flows (the old app had no credentials method, so the migrated app has none), and the admin-step/impersonation/organization scenarios — those are the reference suite's gates (`apps/auth-reference*`), which this migration does not change.
