# @lowdefy/plugin-better-auth

## 7.2.0

### Minor Changes

- 12bb05c: feat(api, plugin-better-auth): Suspend a member in one organization without banning their login

  Two new auth steps, `SuspendMember` and `UnsuspendMember` (`memberId`, and optionally `organizationId`), suspend and restore a membership. A suspended membership keeps its row, app roles, org tier and attributes, so the app's own queries still find the person, but Lowdefy treats it as no membership. The person resolves unauthenticated on every protected page, request and endpoint, their MCP tokens stop working, and a pinned app refuses their sign-in with `MEMBERSHIP_REQUIRED`. Under `tenant`, `ListOrganizations` leaves the organization out and the organization endpoints refuse it. `BanUser` covers every organization and app sharing the auth database, so use this when someone should lose access to only one of them.

  The membership row stores the flag as `suspended: true` in `user-members`; rows without it are not suspended. Both steps need the new `member: [suspend]` permission, which `owner` and `admin` hold. An `owner` cannot be suspended (change their org tier with `UpdateMemberOrgRole` first), and a suspended member cannot be made an `owner`.

### Patch Changes

- 9c044eb: fix(api, plugin-better-auth): CreateOrganization writes the owner's app roles in one write

  The `CreateOrganization` step now writes the organization and its creator's owner membership the same way a tenant signup does, with the `auth.organizations.creatorAppRoles` app roles on that membership from the start. It no longer creates the owner without app roles and adds them in a second write that had to be undone when it failed. If a run fails after writing the organization but before its owner, running the step again with the same creator and slug within ten minutes finishes it, instead of leaving an organization with no owner. Nothing is written until the database's unique indexes are in place.

  The step now checks its properties itself. It takes `name` and `slug` (non-empty strings, required), `logo` (string), `metadata` (object) and `userId` (string), and refuses any other property, so options such as `keepCurrentActiveOrganization` are no longer accepted. A creator that is not a user, or a slug another organization holds, is refused before anything is written. A missing `userId` now always means an organization with no members; it is no longer taken from the caller. The result still lists the owner under `members`.

- Updated dependencies [df6fa3c]
- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [7aec569]
- Updated dependencies [b1d42ca]
  - @lowdefy/errors@7.2.0
  - @lowdefy/helpers@7.2.0

## 7.1.0

### Patch Changes

- @lowdefy/errors@7.1.0
- @lowdefy/helpers@7.1.0

## 7.0.0

### Major Changes

- 6b3a9bb: feat!: Replace the NextAuth-shaped auth system with BetterAuth.

  Lowdefy auth now runs on [BetterAuth](https://www.better-auth.com) 1.7.7 through the new `@lowdefy/plugin-better-auth` package; `@lowdefy/plugin-next-auth` and `@lowdefy/plugin-auth0` are removed. Every app with an `auth:` block is affected — follow the migration guide at `/migration/auth-upgrade` in the docs.

  Breaking changes:

  - **`auth.database` is required** for any login method; sessions are database-backed only (`session.maxAge` → `expiresIn`, no JWT strategy). Collections follow the `user-*` convention fixed by the adapter and auth columns are stored in snake_case.
  - **Provider type names change** — `GoogleProvider`, `GitHubProvider`, ... become `Google`, `GitHub`, ...; `OpenIDConnectProvider` → `GenericOAuth`. Provider `id`s and `/api/auth/callback/<id>` URLs are unchanged. Built-in and `GenericOAuth` providers share one id namespace, so the build fails when a `GenericOAuth` `id` is the key of a built-in provider the app also configures. `GenericOAuth` takes `trustEmail: true` to mark its users' emails verified, for an issuer that sends no `email_verified` claim. An invalid provider property fails startup with the provider id and its config location.
  - **`auth.callbacks` / `auth.events` JS plugins are replaced by `auth.hooks`** — bindings to `InternalApi` endpoints fired in a system context. Verification identifiers carry a `magic-link:` or `auth-state:` prefix, which a `verification.create.before` / `after` hook matching on the identifier must allow for.
  - **`NEXTAUTH_SECRET` / `AUTH_SECRET` env vars are replaced by `auth.secret`** (use the `_secret` operator); pin the canonical URL with `BETTER_AUTH_URL`, or the `url` of the current environment in `config.environments`. With `auth.email` configured, a production server refuses to start (`ConfigError`) until one of them is set, since every emailed link is built from it; without `auth.email` it logs a warning. While unpinned, auth trusts only the origin the request arrived on, so behind a proxy that ends TLS and forwards plain `http`, sign-in is refused until the URL is pinned. The dev server uses the request origin.
  - **Built-in auth UI and `auth.theme` are removed** — the app provides its own pages via `authPages` (`signIn`, `signUp`, `error`, `forgotPassword`, `resetPassword`, `verifyEmail`, `twoFactor`, `twoFactorEnrol`, `acceptInvitation`). The emailed verification link from `SignUp` / `SendVerificationEmail` without a `callbackUrl` lands on `verifyEmail` (default `/verify-email`), with `?error=INVALID_TOKEN` or `TOKEN_EXPIRED` when it fails. The reset link from `RequestPasswordReset` without a `redirectTo` lands on `resetPassword` (default `/reset-password`) with `?token=`, or `?error=INVALID_TOKEN`. The build warns when the app sends these emails (`auth.email` with `emailAndPassword`) and the page is missing.
  - **`EmailProvider` becomes `auth.magicLink` + `auth.email`**, with branded auth emails sent over an SMTP connection.
  - **The session user shape changes** — `userFields` is removed; `_user` carries `id`, `name`, `email`, `image`, `email_verified`, `active_organization_id`, `profile`, plus `roles` (app roles from the active membership's `appRoles`), `org_roles` (the `owner`/`admin`/`member` tier), `attributes` (merged global + per-organization bag), `two_factor_enrolled` and `auth_method`. `name` and `image` resolve per organization, from the member row `UpdateUserProfile` writes, falling back to the user row. A caller awaiting an organization carries `has_pending_invitation` and, when there is one, `pending_invitation_id`. `_user.sub` is gone — `_user.id` is the internal id.
  - **Organizations are always on** — roles live on organization memberships; `auth.organizations` configures `pinned` vs `tenant` policy, invitations, the role catalog and the tenant wall that scopes connections by `organization_id`. `invitationExpiresIn` sets how long an invitation stays acceptable (seconds, at least 60, default 48 hours); an expired or cancelled invitation fails with code `INVITATION_EXPIRED`. Accepting an invitation does not switch a session already active in another organization. Organizations have no practical member cap (default 1,000,000); `membershipLimit` sets one, and an unpaged `ListMembers` returns every member.
  - **Retired client actions** — `ImpersonateUser`, `StopImpersonating` (no replacement); `InviteMember`, `CancelInvitation`, `UpdateMemberRole`, `RemoveMember`, `UpdateOrganization` are now auth steps run from routines.
  - **Signed-out requests no longer reveal page or endpoint existence** — protected apps answer sign-in for every URL and `401` for missing or protected requests alike.

  New in this line: two-factor auth (TOTP, backup codes, passkeys, `twoFactor.required` enrolment; id token sign-ins are challenged too unless the provider sets `twoFactorTrusted: true`, and `Login` with an `idToken` then navigates to `authPages.twoFactor`), phone number and captcha sign-in, the app as an OAuth 2.1 authorization server for MCP clients (`auth.oauthProvider`, scoped MCP tools), the `_organization` server operator and the `_build.authConfig` projection, and a self-service auth action catalog (`SignUp`, `PasskeySignIn`, `PasskeyUpdate`, `TwoFactorGenerateBackupCodes`, `SetActiveOrganization`, `AcceptInvitation`, `LeaveOrganization`, ...). Auth rate limits (sign-in and sign-up: 3 attempts per 10 seconds per address), the session's recorded address and the captcha check use the client address the server resolves; behind a reverse proxy, list the proxy in `config.trustedProxies`.

### Minor Changes

- ce95773: feat(plugin-better-auth): New `LeaveOrganization` auth step

  An endpoint routine can now end the caller's own membership of an organization, so the leave and
  what depends on it (a check before it, an audit event after it) run in one request. The step takes
  `organizationId` (required) and calls the organization plugin's leave endpoint, so its checks run:
  a caller who is not a member, or is the only owner, is refused, and the refusal throws with the
  plugin's message for the routine to catch with `:try`. On success it returns the removed member
  row. It is `caller`-scoped: it needs a caller and no organization authority, and refuses
  `system: true`. The caller's session still names the left organization as active afterwards, so
  the page follows with `SetActiveOrganization` or `Logout`. The `LeaveOrganization` client action is
  unchanged; step and action types resolve separately, so the shared name is not ambiguous.

- b56bb7a: feat: Lowdefy apps as OAuth 2.1 authorization server for external MCP clients.

  The app's MCP endpoint gains an app-issued OAuth 2.1 envelope, so external MCP clients connect with app-issued bearer tokens.

  - One MCP address per deployment: `POST /api/mcp`, with RFC 9728 metadata at `/.well-known/oauth-protected-resource/api/mcp`. The resource URIs default to the current environment's `url` in `config.environments`. The organization a token acts in is chosen at authorization, not encoded in the address.
  - After login and before consent the authorization server sends the user to `auth.oauthProvider.postLoginPage` (required under the `tenant` organizations policy) to choose one of their organizations; the page runs `SetActiveOrganization` then the new `OAuthContinue` action. Consent is then per (client, user, organization), and every access token carries the choice as its `organization_id` claim — refresh grants keep it.
  - Scopes are `mcp:read`, `mcp:write` and `offline_access`, so clients get refresh tokens: access tokens last 1 hour, refresh tokens 30 days. A rotated refresh token is accepted again for two minutes, so several sessions sharing one sign-in can refresh together.
  - The `/api/mcp` route resolves the member from that claim, refuses a token whose grant no longer stands (consent deleted), and stamps `auth_method: 'mcp'` on the caller. A token whose user is no longer a member of its organization gets the `401` `WWW-Authenticate` challenge and cannot be refreshed, which sends the client back through authorization.
  - New `RevokeMcpGrant` auth step: an MCP tool built on it gives up the calling assistant's own grant, so the assistant's next call is challenged to reconnect — and to choose an organization again.
  - `mcp.endpoints` entries carry a `scope` (`mcp:read` | `mcp:write`); tools are listed and callable only when the caller's role gate and token scope both allow.

- 60fb714: feat: Member tokens for MCP scripts

  A script that runs on its own can now call an app's MCP tools with a long-lived **member token** instead of an OAuth grant, which a crashed refresh can sign out with no way back short of a person signing in again. A member creates a token for themselves from a signed-in session with the new `CreateMcpToken` auth step, choosing an expiry in days or none. The script sends it as `Authorization: Bearer ldf_mcp_…` to `/api/mcp` and is served as that member, with their roles and organization, exactly as an OAuth-connected assistant is (`_user.auth_method` is `'mcp'`).

  - Tokens are stored hashed in the new `user-mcp-tokens` auth collection, created only in apps that set `auth.oauthProvider`.
  - `RevokeMcpToken` switches off one of the caller's own tokens; `RevokeOrgMcpToken` lets owners and admins switch off any token in their organization. `RemoveMember`, `LeaveOrganization` and `DeleteUser` delete the member's tokens too.
  - A token stops working when its member leaves, is removed or is banned. A refused token gets a `401` whose `error_description` says why.
  - A banned user's OAuth access tokens are refused on `/api/mcp` too.

  See "Tokens for scripts" on the MCP Server & OAuth docs page.

### Patch Changes

- b226c43: fix: Classify expected outcomes and faults consistently across the v7 runtime and build.

  A sign-in the auth server rejects - a wrong password, an expired or already-used link, a stale
  OAuth authorization query - was reported as an `ActionError`: logged in the browser, posted to
  `/api/client-error`, and logged again on the server at error level against the action's config
  location, while BetterAuth itself logged every 4xx as `ERROR [Better Auth]`. These are expected
  outcomes of user interaction, not app faults. Auth client methods now throw a `UserError` for a
  4xx (with `metaData.code` / `metaData.status` for `catch` actions to branch on), and the server
  owns BetterAuth's API-error logging so a rejected attempt is one warn line.

  The same rule was applied across the code new in v7:

  - New `AuthorizationError` (403): an authenticated caller refused by a request, endpoint, agent,
    websocket or auth-step gate is one warn line and a 403, not a `ConfigError` logged at error
    level with a 500 and a Sentry event. The agent and websocket gates now also return 401 to an
    unauthenticated caller. All three servers handle `AuthenticationError`,
    `TwoFactorEnrolmentRequiredError` and `AuthorizationError` the same way; `server` no longer
    reports each fault to Sentry twice.
  - A wrong HTTP method on an API route is a 405, not an error-level log and a 500.
  - Routine `:throw`, schema validation failures and a nested `CallApi` that ended in `:throw` are
    `UserError`s logged at warn, not error.
  - Config faults that were plain `Error`s are `ConfigError`s (unconfigured auth, mock user without
    auth, missing `auth.email`, unknown block type, ambiguous link targets, strategy secrets,
    tenant-wall refusals, storage post-policy fields, `_organization` / `_build.authConfig`
    misuse); invariant violations are `LowdefyInternalError`s (write-phase artifact checks, invalid
    routine, auth adapter contract); upstream failures are `ServiceError`s (websocket transport,
    JWKS fetch, BetterAuth 5xx, tenant preflight probes, SMTP only when the network failed).
    `ServiceError.isServiceError` also recognises AWS SDK `$metadata.httpStatusCode` and numeric
    5xx codes.
  - Build: agents, MCP endpoints, notifications, websockets, `CallAgent` / `RenderNotification`
    step references and organization client-action references collect every error instead of
    stopping at the first; `websocket-refs`, `dynamic-endpoint-refs`, `callapi-refs`,
    `callapi-internal-refs` and `icons` are valid `~ignoreBuildChecks` slugs; a plugin module that
    resolves but fails to load is reported instead of surfacing later as an unknown type (a plugin
    without an optional subpath such as `schemas` is not a failure); the deprecated
    `public/styles.less` check runs as a validation step rather than failing the write phase.
  - Errors revived from the wire keep their class for the auth gate errors, and the dev client
    revives serialized Lowdefy errors instead of flattening them to their message.

- a9442cc: Production pages load only the plugin code they use.

  The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

  - The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
  - Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
  - Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
  - The build adds the types a page runs without naming them: the operators the `_js` accessors call, and the actions and operators a block runs for events it registers itself (such as `Request` in `Upload` or `SetLocale` in `PageHeaderMenu`), which blocks list in `meta.actions` and `meta.operators`. Plugin blocks that register their own events should list them the same way.
  - A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

  No config changes. The dev server is unchanged.

- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [4d08b55]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [d42f420]
- Updated dependencies [ebf95f8]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [09717e8]
- Updated dependencies [2baefc1]
- Updated dependencies [662eaa9]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [1766343]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
  - @lowdefy/helpers@7.0.0
  - @lowdefy/errors@7.0.0
