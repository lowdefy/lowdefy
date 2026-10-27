# Change Log

## 7.2.0

### Minor Changes

- 3080390: feat(cli): `lowdefy dev --ios`, `--android` and `--lan` put the app on a phone

  `lowdefy dev --ios` boots an iPhone simulator (or uses a booted one), installs Lowdefy Dev and opens the dev server in it. `--android` does the same on a connected phone or a running emulator, or starts the first Android virtual device, and connects it through `adb reverse`. Both reach the dev server on `localhost`, so nothing is exposed on the network. Until Lowdefy Dev builds are released, the build to install comes from `LOWDEFY_DEV_APP_IOS` (a simulator `.app`) or `LOWDEFY_DEV_APP_ANDROID` (an `.apk`). A missing `xcrun simctl` or `adb` stops the command with the install step to take.

  `lowdefy dev --lan [interface]` lets a phone on the local network connect. The server also listens on the first private network address, or on the interface you name, and prints that interface with a QR code of a `lowdefy-dev://connect` link. The link carries a pairing token that lasts for the dev session. A request or websocket from another machine without the token is answered 401, and even with it the dev tools (`/lowdefy-docs` and its MCP endpoint, `/api/dev-inspect`, `/api/dev-recording`, `/api/dev-tools`, `/lowdefy-feedback`) refuse it and the headless-user cookie is ignored.

  The dev mail sink prints the sign-in code of each email it catches (`code for ada@example.com: 482913`), which `lowdefy_dev_logs` also shows. `/api/client-error` in dev accepts requests with no Origin header, so errors from a simulator, a USB phone or a paired phone reach `lowdefy_build_status` like browser errors.

- 7e24234: feat(cli): Journey runs wait for a run slot and exit 75 when the machine stays busy

  `lowdefy test`, `lowdefy journeys harden` and `lowdefy journeys variants` now take two slots before they start or attach to a dev server, and hold them until the last journey ends: one run per worktree, and at most two journey runs on the machine (one while memory pressure is critical; set `LOWDEFY_JOURNEY_RUN_SLOTS` to change the count). A run that has to wait prints which runs hold the slots every 30 seconds. After 20 minutes of waiting it prints "The machine is busy running other journeys. Try again later; do not start your own dev server." and exits with code 75, having started nothing.

  `acquireMachineSlot` takes three new optional options: `describe` (extra fields for the slot file), `onWait` with `onWaitIntervalMs` (called while waiting, with the live holders), and its timeout error now carries `code: 'MACHINE_SLOT_TIMEOUT'`, the slot `name` and the `limit`.

- e030f96: feat(cli): Test runs wait for a starting dev server, report their server's resources, and cap the data store's cache

  - `lowdefy test`, `lowdefy journeys harden` and `lowdefy journeys variants` wait up to 5 minutes for a dev server in the worktree that is still starting (for example after `lowdefy hub start .`), instead of booting a second one. A starting server whose `<basePath>/api/ping` answers counts as ready. If it never becomes ready, the run fails with `The dev server in this worktree did not become ready. See: lowdefy hub logs <dir>`.
  - When a run uses a running dev server, it warns about `--ref-resolver`, `--port`, `--dev-directory` or `--server-directory`, which that server ignores.
  - A run that started its own server ends with `Resources (approximate): server peak 0.71 GB, CPU 94 s, including data store and browsers.`, measured with `ps` every 5 seconds over the server's process tree (not on Windows). A run on a shared dev server says `Resources: not measured (shared dev server).`
  - The journey data store's MongoDB starts with a 0.25 GB WiredTiger cache, so it no longer grows toward half the machine's memory.

- aa6f63d: feat(cli): Add `lowdefy mobile build` and `lowdefy mobile submit`

  `lowdefy mobile build --shell <id> --env <environment>` writes the shell project, then raises the store version: it reads the latest finished EAS build on the environment's channel per store and uses the next patch of the shell's `version` (`major.minor`), or `<major>.<minor>.0` for a new `major.minor` or a first build. Both stores get the higher of the two. Then it runs `eas build --profile <environment>`, interactive by default so the first build can sign in to Apple and Google. `--non-interactive` queues the build for CI without waiting, `--platform ios|android|all` picks the stores, `--local` builds on this machine and `--profile development` builds a development client of the shell's dev variant with no store version.

  `lowdefy mobile submit` uploads the latest build to TestFlight and Google Play internal testing (`eas submit --latest`); review and promotion stay with a person.

  EAS commands now run with `LOWDEFY_SHELL_CONFIG` pointing at the project's `shell.json`, so eas reads the shell's own app config on this machine.

- e3ba32e: feat(cli): Add `lowdefy mobile checklist` and document `lowdefy mobile`

  `lowdefy mobile checklist --shell <id>` prints, filled in with the shell's own ids, the steps the stores still need a person for: the store records, the first interactive build and submission, making a `private` app private, copying the Play app signing key into `android.sha256` (marked done once it is set), the App Store privacy labels and Play data safety answers for the shell's capability profile (with the background-location declaration for `field-tracking`), and review and promotion of each native release for `private` and `store` shells. It runs no EAS command.

  The CLI docs describe every `lowdefy mobile` command, its flags, the generated `.lowdefy/mobile/<shell>/project` folder and the `EXPO_TOKEN` and `SENTRY_AUTH_TOKEN` variables.

- 5e17a61: feat(cli): Add the `lowdefy mobile` command group and `lowdefy mobile config`

  `lowdefy mobile config --shell <id> --env <environment>` builds the app, then writes the shell's Expo project to `.lowdefy/mobile/<shell>/project`: a copy of the published `@lowdefy/shell` at the app's Lowdefy version, `shell.json` for the chosen environment, `eas.json` with a build and submit profile per environment and a `development` profile, and the icon. The folder is its own pnpm workspace with its own lockfile, so it installs the same way inside an app's pnpm monorepo. It prints the shell's runtime version. `--dry-run` writes the project but skips the install and prints it.

  Every EAS call runs through one runner, `npx --yes eas-cli@<pinned version>` in the project folder with `EAS_NO_VCS=1`, passing `EXPO_TOKEN` and `SENTRY_AUTH_TOKEN` through from the environment. `build`, `submit`, `update`, `release` and `checklist` are listed and not available yet.

- 4e717c0: feat(cli): Add `lowdefy mobile update` and `lowdefy mobile release`

  `lowdefy mobile update` sends the shell's JavaScript over the air to the environment's EAS channel (`eas update`), with a message in a fixed form, `lowdefy-shell@<version> profile=<profile> runtime=<runtime version>`. `--rollout <percent>` sends it to a share of devices, `--promote` rolls the latest update for this runtime version out to every device (`eas update:edit --rollout-percentage 100`), and `--rollback` republishes the update before it (`eas update:republish --group`).

  `lowdefy mobile release` is what CI runs. Per store it reads the latest finished build on the channel: when there is none, or its runtime version differs from the shell's, it raises the store version, builds and submits; when the runtime matches and the latest update carries another shell version (or none), it sends an update; otherwise it does nothing. It prints one line per store saying which and why. It always runs EAS without prompts; `--no-wait --auto-submit` queues builds and lets EAS submit them. `--dry-run` prints the reads and both paths per store, with the condition that picks each, and runs nothing.

- 2ce6fa5: feat(mobile): Share out from every shell, share in with the `share` extension

  The `Share` action opens the share sheet with text, a link, a file on the phone, an https file the shell downloads first, or `base64` content with a `name` (a PDF made on the page). `mobile.shells[].extensions: [share]` adds expo-sharing's share extension: text, links, images, videos and files shared into the app open `mobile.share.pageId` with the payload in the `shared` query key and fire the `onShare` app event. Shell extensions are a new opt-in list (`share`, `widgets`, `contacts`, `calendar`) on top of the profile, written into shell.json by `lowdefy mobile config` and named in the runtime version.

### Patch Changes

- 88e8151: fix(cli): Agent rules say what to do when the Lowdefy tools are missing

  The rules `lowdefy agent-setup` writes told agents never to run `lowdefy dev`, but not what to do when their session has no `lowdefy_` tools, which happens when an agent client does not start the MCP server or drops it when a session resumes. Agents then started dev servers by hand on ports they picked, outside the hub's start limits and idle shutdown. The rules now say to run `npx lowdefy@<version> hub start <app>`, `hub logs` and `hub stop` instead, for apps in the agent's own checkout, to read build status from the dev server's `/lowdefy-docs/build-status` route, to tell the developer that `lowdefy agent-setup --user` registers the tools for every session, and to point a browser or preview pane at the server's URL rather than configure the pane to start a second server. Rerun `lowdefy agent-setup` to update a project's rules.

- afeec0b: feat(server-dev): Agent tools take a device

  - `lowdefy_screenshot_page` and `lowdefy_run_journey` take `device`, a phone's tab id from the new `lowdefy_device list`. Steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot` and `expect` with `state`) run on the phone in Lowdefy Dev by block id. A screenshot is taken with `xcrun simctl io` on a simulator, `adb exec-out screencap` on an Android device, or by Lowdefy Dev from its own view on a paired phone, and says which.
  - `lowdefy_inspect_state`, `lowdefy_snapshot_state` and `lowdefy_load_state` take `device` and read the phone's live state, or load a checkpoint into it.
  - New `lowdefy_device` tool: `list` the connected phones, booted simulators and Android devices; `start` Lowdefy Dev on a simulator or emulator, as `lowdefy dev --ios` or `--android` does; `inject` a phone's next scan, photo, NFC read, location, permission answer, push or network state. On an iOS simulator a location and permission are also set with `simctl`, and a push is delivered with `simctl push`.
  - `lowdefy_list_types` takes `target: web | mobile`; with `mobile` it lists the blocks, actions and client operators a native shell carries, which dev builds now write to `plugins/availableTypesMobile.json`.
  - Client errors in `lowdefy_build_status` carry `surface` (`web` or `mobile`, with the phone's shell version).
  - Lowdefy Dev names its platform and app id when it joins the dev server, and answers state checkpoint loads.
  - The simulator and emulator helpers of `lowdefy dev --ios` and `--android` move to `@lowdefy/node-utils`, shared with the dev server.

- 848848b: fix(cli): One Ctrl+C stops `lowdefy dev`

  Pressing Ctrl+C once left `lowdefy dev` showing "Shutting down server..." indefinitely, and a second Ctrl+C was needed to get the terminal back. The dev server's last message starts that spinner, then the server exits, so nothing ever stopped the spinner and its timer kept the CLI running. The CLI now ends the spinner with "Development server stopped." once the dev server exits, and returns to the prompt.

- 9419d09: Cap the dev tab's event and call histories (dev only), close idle headless browsers after 45 s and keep at most 10 rendered instances per page in the tab list.
- 5d27806: An idle dev server now stops its Vite web server after 3 minutes with no use and no open tab, freeing several hundred megabytes, and starts it again on the next page request, tool call or journey. Status reads and reconnecting streams get a quick "idle" answer instead of waking it, and edits made meanwhile are built but wait for that request. `lowdefy_dev_status` reports such a server as `idle`.
- b596ef3: perf(server-dev): A fresh dev server answers after one config build, not two

  On a fresh checkout, the dev server's first config build cannot check plugins that are not installed yet. It installs them and builds again to run their checks, and that second build ran before the server started, so a large app took two full config builds to answer. The server now starts after the first build, and the second runs once it answers: `lowdefy_build_status` with `wait: true` waits for it, and open pages are not reloaded, since the checks change nothing they show. The checks it runs and the warnings it gives are unchanged.

- df6fa3c: fix(build, cli, errors, server-dev): Dev tools and build errors keep their cause and location

  `@lowdefy/errors` exports `isExpectedError`, the one test for an expected outcome (a `UserError` or an auth refusal) versus a fault. The dev server's agent error feed uses it, so an auth refusal is no longer reported to an agent as an app error.

  When the server explains a browser error with a plugin schema error ("property title must be type string"), the agent feed records that error instead of the original "Error rendering block". Feed entries from the browser and the server carry the same fields, including `hint` and `configKey`.

  A dev tool (an MCP tool, a journey run, `run_endpoint`, the mutants route) that fails with an error of its own is logged with its stack, and the agent is told the tool failed rather than its app. Bad tool arguments are answered as `UserError`s. `run_endpoint` logs the caller's id instead of the whole user object.

  A plugin that fails to import gives its reason (a syntax error, a missing dependency) in the build error, and the build status keeps the cause and stack of an internal fault. Module entry and module var errors point at their line in `lowdefy.yaml`, and an invalid `config` or `theme` is a located `ConfigError`. The dev server's warnings are no longer printed as `ERROR` lines, and a crash in the dev server is printed whole rather than in fragments. A build artifact that is there but unreadable is reported instead of read as empty, and an `_js` map that fails to load is logged.

  The CLI's error telemetry sends the error name, a message cut to 300 characters and the stack frames, with the home directory replaced by `~`.

- 3f4c3f8: fix(cli): `lowdefy mobile config` writes an `eas.json` that builds and submits without hand edits

  Each build profile pins `pnpm` to the version that installed the shell project, so EAS no longer installs with its newest pnpm, which refuses packages published the same day. Each build profile sets its EAS `environment`: `production` for an environment named `prod` or `production`, `preview` for the rest. A shell's new `ios.ascAppId` (the App Store Connect app id) is written to every submit profile, so `submit --non-interactive` and `release --auto-submit` find the app. Environments without a `url` get no build or submit profile.

- 023c4e1: fix(server-dev): Editing a block in a local plugin no longer restarts the dev server

  A local plugin with any server-side type (a connection, request, server operator, auth or agent type) restarted the dev server on every change to any of its files, blocks included. The restart drops page loads, screenshots and tool calls in flight until the new server answers, although Vite hot-replaces block code by itself. The dev server now restarts only when a changed file is one the server imports: it follows the imports of the build's server-side plugin import files through the local plugins' files, resolving package `exports` and `#` subpath `imports` the way the server does. This also restarts the server for code it imports that did not restart it before: a plugin that only holds steps, or a helper a connection imports from another local plugin. A changed `package.json` of a plugin the server imports from restarts it, and where the dev server cannot be sure (an import it cannot resolve, a dynamic import of a computed path), any change to that plugin restarts it as before. Every change still rebuilds the config.

- 0d53174: feat(server-dev): Remove the in-page annotation overlay

  The dev server no longer has the Cmd/Ctrl+/ annotation overlay or its `POST /lowdefy-feedback` route. Point a coding agent at the page instead: it can take screenshots and read live state through the dev server's MCP tools. Option/Alt+click to open a block's yaml in VS Code stays. The dev server's start-up notice now names Option/Alt+click for it, where it said Cmd/Ctrl+click. `lowdefy agent-setup` no longer writes the visual feedback section into AGENTS.md and the skill.

- a461f7c: fix(deps): Update dependencies for security advisories

  - vite 8.0.16 -> 8.1.6: the dev server no longer serves files outside `server.fs.allow` when a project path matches a system path, and launch-editor's command handling is fixed.
  - @modelcontextprotocol/sdk 1.31.0 -> 1.32.2: bounds request validation memory, ties experimental tasks to their session, checks a bearer token's audience and stops forwarding headers on cross-origin redirects.
  - hono 4.13.7 -> 4.13.14: `serveStatic` no longer decodes the path a second time, which let a request bypass middleware.
  - dompurify 3.4.16 -> 3.4.17: fixes three sanitizer bypasses, one critical.
  - markdown-it 14.3.1 -> 14.3.3, nodemailer 10.0.13 -> 10.1.7 and undici 7.30.0 -> 7.30.1.

- 3af2019: fix(api, servers, connection-mongodb): Server errors are classified, located and logged the same way everywhere

  Every server site that tells an expected outcome from a fault now asks `isExpectedError`, so an auth refusal or a `UserError` is one warn line on every path: a nested `CallApi`, a websocket frame, a background run, an optional Dynamic block, an MCP tool call and the server error handlers. Faults reach a `handleError` sink instead of a raw `logger.error`: a background, detached or forwarded-cron run that fails, an optional Dynamic block that falls back, an unwalled connection that reaches walled data, an MCP `afterToolCall` hook that fails before its routine runs, an auth email send, and an auth engine error, which goes to a system context's sink. A detached `CallApi` whose dispatch `/api/detached` does not accept is now a fault rather than a completed dispatch. The request context is set before authentication runs, so a fault there is logged with the request id.

  The prod log and Sentry no longer carry `received`, an operator's or control's evaluated input. BetterAuth's own log lines carry an error under `err` and name other values by type only. A connection error that is already typed leaves a request with the step's ids and its cause summarised, and a websocket source's failure is wrapped like a request's, without its evaluated properties. An auth hook that returns a non-object names its type, not the record.

  A MongoDB error that refuses the request (a duplicate key, a malformed pipeline, a missing permission or collection) is now a `RequestError` with the same `code` and `hint`; only a time or memory limit stays a `ServiceError`. A failed unique index build at auth startup names the index and code instead of quoting the duplicate values.

  Config faults carry their config location: endpoint control errors (`:for`, `:while`, `:if`, `:switch`, `:parallel_for`, `:log`) are `ConfigError`s at the control, and the detached `CRON_SECRET` check, cron forwarding, the auth secret, the invitation sender and the auth email connection name theirs. An auth hook's `:throw` now refuses the write with a 400 instead of a 500.

  On the server, `_log` writes an info line through the request's logger instead of `console.log`, so secrets and values marked with `_credential` are removed from it like from every other log line. In the browser it still logs to the console.

- d8f2f6d: feat(server-dev): A smaller dev server agent surface, so an agent session starts on about half the tokens.

  Removed dev tools: `lowdefy_list_plugins`, `lowdefy_get_plugin_doc`, `lowdefy_overview`, `lowdefy_scaffold_page`, `lowdefy_checkpoint`, `lowdefy_revert_checkpoint`, `lowdefy_snapshot_state`, `lowdefy_load_state`, `lowdefy_list_state_checkpoints` and `lowdefy_checkpoint_to_mocks`. The config and state checkpoint stores, the `?_checkpoint=` URL and the dev mock registry go with them. Use git for config checkpoints, `list_types` for a type's package, and `get_doc` or `search_docs` for plugin docs. `lowdefy_restart` stays, hidden.

  Merged: `lowdefy_eval_operator` is now the optional `expression` argument of `lowdefy_inspect_state`. It takes the same `pageId`, `pathParams`, `source`, `user` and `data` arguments, and returns `{ value, errors, source, reads }`, where `reads` names the paths the expression read. A dev server older than this release answers `expression` with plain state and no value.

  Removed HTTP routes under `/lowdefy-docs` that only mirrored a tool: `app-map`, `checkpoints*`, `state-checkpoints*`, `eval-operator`, `run-request`, `run-endpoint`, `inspect-state`, `screenshot`, `plugins`, `schema`, `examples`, `search`, `icons`, `plugin-doc`, `content` and `:kind`. `build-status`, `journey`, `mutants`, `page-config`, `find`, `events`, `restart`, `mcp` and `GET /lowdefy-docs` stay.

  The MCP instructions shrink from 7,000 to at most 2,500 characters, and the dev server's `tools/list` to at most 25,000. The journey step grammar is served only by `lowdefy_get_schema` with `kind: "journey-step"`. Tool results are compact JSON, and `lowdefy_get_page_config` now answers `{ page }`, or `{ block }` with the new optional `blockId` for one block's subtree, writing a page over 40,000 characters to `pageFile` instead. `GET /lowdefy-docs/page-config` still returns the full page.

  fix(cli): `lowdefy mcp` logs each tool call to `tool-calls.jsonl` in the Lowdefy home: the tool, the app, the time, the duration and whether it worked, with no arguments or results. The file stays on your machine and rolls over at 1 MB. `lowdefy agent-setup` no longer repeats the dev server rules between AGENTS.md and the `lowdefy-config` skill. Tests hold the shim's `tools/list` for a current server to 40,000 characters.

- Updated dependencies [afeec0b]
- Updated dependencies [09dbbee]
- Updated dependencies [df6fa3c]
- Updated dependencies [7e24234]
- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [a461f7c]
- Updated dependencies [7aec569]
- Updated dependencies [b1d42ca]
  - @lowdefy/node-utils@7.2.0
  - @lowdefy/ajv@7.2.0
  - @lowdefy/errors@7.2.0
  - @lowdefy/helpers@7.2.0
  - @lowdefy/logger@7.2.0

## 7.1.0

### Patch Changes

- d197cb4: fix(server-dev): Build status no longer says ok while a page fails to build

  The dev server builds each page when it is first requested, after the config build. `lowdefy_build_status` and `GET /lowdefy-docs/build-status` took their top-level `build.status` from the config build alone, so it read `ok` while a page failed, and the failure showed only in `pages.failed` further down. Agents that read the top line moved on with a broken page.

  `build.status` now reads `pages_failed` when the config builds but a page failed its latest build and has not changed since, and `build.failedPages` names those pages. A failed page that changed after that build is not counted until it is rebuilt, since its failure may already be fixed. Each page's errors stay under `pages.failed`. `error` still means the config build itself failed and the dev server is serving the previous build; it names no failed pages. `build.configStatus` is the config build's own status, and `lowdefy journeys harden`, which waits for a successful config build after an edit, reads it. `lowdefy_dev_status` reports the number of failed pages as `failedPageCount`.

- e8bf1e4: fix(cli): A dev server that crashes while starting on Windows is reported as exited, not stopped

  When a dev server the hub started (through `lowdefy mcp` and `lowdefy_dev_start`) crashed while starting on Windows, the hub could answer that it was `stopped`, as if another session had stopped it, with no exit code to show why. Windows reports the process as gone a moment before Node tells the hub it exited, and a status read in that moment found neither a running server nor a recorded exit.

  The hub now waits for that exit to be recorded, so it answers `exited` with the exit code.

- 3408010: fix: `lowdefy build` no longer warns `Plugin checks for <package> did not run: package not installed.` for plugins that have nothing to check.

  A clean build warned for every plugin the server had not installed yet, including connection plugins like `@lowdefy/connection-mongodb` that ship no build check rules. The warning now names only plugins that own a block, action or operator type, and `lowdefy build` gives it only from the build after it installs the app's plugins, so it shows a plugin that is still missing rather than one it was about to install. `lowdefy dev` does the same when it starts. Journeys and dev page builds still warn for a missing block, action or operator plugin. `--skip-plugin-checks` no longer gives this warning.

  - @lowdefy/ajv@7.1.0
  - @lowdefy/errors@7.1.0
  - @lowdefy/helpers@7.1.0
  - @lowdefy/logger@7.1.0
  - @lowdefy/node-utils@7.1.0

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

- 3a28594: chore!: Node.js 24 is now the minimum supported version.

  **Breaking:** Lowdefy no longer supports Node.js 22. Upgrade to Node.js 24 or newer before
  upgrading Lowdefy.

  - The CLI and the servers declare `"node": ">=24"` in `engines`, and the CLI refuses to start on
    a Node.js version below 24.
  - `lowdefy init-docker` generates a Dockerfile on `node:24-slim`. Apps with a Dockerfile generated
    by an earlier version should change their `FROM node:22-slim` lines to `node:24-slim`.
  - The Vercel build output declares the `nodejs24.x` function runtime, and the README that
    `lowdefy init-vercel` writes lists the Node.js 24 project setting the install and build steps need.

### Minor Changes

- 14c4764: Coding agents now get their Lowdefy tools from `lowdefy mcp`, a stdio MCP server the agent client starts itself, instead of a dev server URL with a port in it. One checked-in `.mcp.json` entry works in every git worktree, the tools are there from the first moment of a session whether or not a dev server is running, and each call reaches the dev server of the app and worktree the agent is working in — pass `directory` when a repository holds several apps or a subagent works in another worktree. Every result starts with the app and checkout it came from.

  `lowdefy mcp` acts only on apps in the checkout the agent session started in and in the git worktrees of that repository. A `directory` anywhere else is refused with a message naming the session's checkout; when the agent client supports MCP elicitation, `lowdefy mcp` asks you first instead, and your answer holds for the session.

  Agents no longer run `lowdefy dev`, pick ports or kill processes. `lowdefy mcp` starts dev servers through the Lowdefy hub, a small per-user background process whose socket only your user can read and write: it gives each app its own port (4100 and up, kept across restarts), runs the app's own dev script so wrappers such as a secrets manager still apply, reports when the server is ready, and restarts it fully (clearing local plugin code) with `lowdefy_dev_start({ restart: true })`. It only ever stops servers it started — a `lowdefy dev` you run in a terminal is used by agents but never stopped by them. New tools: `lowdefy_dev_start`, `lowdefy_dev_stop`, `lowdefy_dev_status`, `lowdefy_dev_logs` (at most 1000 lines), `lowdefy_dev_list`; new commands: `lowdefy mcp`, `lowdefy hub status|start|stop|logs`. When several `package.json` scripts run `lowdefy dev`, set `cli.devScript` in `lowdefy.yaml` to the one the hub should use.

  The hub keeps few servers running, even when agents hand work to helper agents:

  - **Idle by last use.** The hub stops a server it started once nobody has used it for 15 minutes (any request through its port, or a build; status polls and long-lived event streams do not count) and no browser tab has it open, or once its worktree is removed. A stopped server starts again on the next `lowdefy_` call.
  - **Memory pressure.** When the operating system reports memory pressure (macOS and Linux), the idle limit drops to 5 minutes, or 2 at critical pressure, and a start that would take the hub past four servers first stops the idle ones.
  - **Start slots.** At most two dev servers launch at once across the machine (one at critical pressure); the rest queue in order. A start still queued after two minutes answers `queued` with its place, and calling `lowdefy_dev_start` again keeps it.
  - **Browser slots.** At most three headless browser operations (journeys, screenshots, state inspections, operator evaluations, state loads) run at once across the machine, whichever way they were called.
  - **Agents are told.** The `lowdefy mcp` instructions, and the AGENTS.md and skill that `lowdefy agent-setup` writes, tell an agent to stop the dev server of a git worktree it created when it finishes there, and that a server left running stops after 15 idle minutes.

  Rerun `lowdefy agent-setup` to switch a project over: it replaces the `lowdefy-docs` entry (`http://localhost:<port>/lowdefy-docs/mcp`) and other per-port entries such as `lowdefy-3010` in `.mcp.json` with one `lowdefy` server, and updates the skill and `AGENTS.md` section it wrote before. The `--port` option of `agent-setup` is gone; nothing it writes names a port any more.

  `lowdefy dev` changes:

  - A running dev server records itself in `.lowdefy/instance.json`. A second `lowdefy dev` for the same app exits before it touches `.lowdefy/dev`. A record copied into another git worktree, or left by a killed dev server whose process id has been reused, is ignored. `lowdefy test` runs against an already running dev server.
  - A port you set — `--port`, `PORT` or `cli.port` — is used or the command fails. It no longer moves to the next free port and hands you a server on a port you did not expect; only the default port 3000 still does.
  - `/lowdefy-docs/*` and `/api/dev-inspect/*` refuse requests a browser makes on behalf of another website, so a page you visit can no longer drive the dev tools (run requests and endpoints, load state checkpoints) on your machine. Agents, curl and the dev app's own pages are unaffected.

  Also fixed: CLI error reports were sent to Lowdefy even with `--disable-telemetry` or `cli.disableTelemetry` set. They now respect the opt-out.

- 90e80ef: feat(cli): `lowdefy agent-setup` writes Lowdefy's skills for every coding agent

  - Each skill is written to both `.agents/skills/<name>/SKILL.md`, which Codex, Cursor, Copilot, Gemini, Amp and opencode read, and `.claude/skills/<name>/SKILL.md`, which Claude Code reads. They are plain copies, not symlinks.
  - The two copies are one unit: a rerun refreshes both, and recreates a missing one, while neither was edited. Editing either copy freezes both, and agent-setup names the edited copy and its twin so you can copy the edit across, or delete both and rerun.
  - `lowdefy-config` now carries a `lowdefy-skill-hash` and is refreshed on every run like the journeys skills. A `lowdefy-config` skill from an earlier agent-setup, which has no hash, counts as edited and is left: delete it and rerun to get the current one.
  - Skills Lowdefy no longer ships are removed when unedited (their folder only when nothing else is in it); an edited one is left with a note that Lowdefy no longer maintains it. Skills without a `lowdefy-skill-hash` are never touched.

- 50e466e: feat(cli): `lowdefy agent-setup` writes the same agent files from every app in a repository

  The Lowdefy guidance and skills that `agent-setup` writes no longer name the app they were set up from. They drop the app's path, the `cd <app> &&` prefixes and the "Developers start it themselves with …" line, so running `agent-setup` from a second app in the same repository no longer rewrites them for that app.

  Instead the guidance states how agents pick the app: a Lowdefy app is a folder containing `lowdefy.yaml`; `lowdefy_` tools use the app folder the session started in, else the repository's only app, and otherwise fail and list the apps. Agents pass the folder as `directory` when the developer named an app or a call listed several, and shell commands such as `lowdefy test` and `lowdefy journeys …` take it as `--config-directory <app>`. The journeys autopilot, which runs unattended, stops and lists the app folders instead of guessing when a repository holds several apps.

- 3d85151: feat(cli): `lowdefy agent-setup` keeps Lowdefy's guidance as a versioned block and makes Claude Code read AGENTS.md

  - The guidance is written between `<!-- BEGIN:lowdefy-agent-rules version=<version> -->` and `<!-- END:lowdefy-agent-rules -->`, stamped with the version of the CLI that wrote it, and the whole block is rewritten on every run. Text outside the markers is never touched.
  - An existing block is replaced where it is, in `AGENTS.md` or `CLAUDE.md`. Otherwise the block is appended to `AGENTS.md` when it exists, else to `CLAUDE.md` when that is all the project has (no `AGENTS.md` is created), else to a new `AGENTS.md`.
  - When the block is in `AGENTS.md`, the root `CLAUDE.md` imports it: agent-setup creates a `CLAUDE.md` holding `@AGENTS.md` when there is none, and adds the line to the top of one that lacks it, since Claude Code otherwise skips `AGENTS.md`. `.claude/CLAUDE.md` and `CLAUDE.local.md` are never edited.
  - When the CLI's version differs from the app's `lowdefy.yaml` version, agent-setup still writes and warns with the command that matches them, for example `npx lowdefy@7.0.0 agent-setup`.
  - Apps on `lowdefy: local` are not supported: agent-setup stops with an error and writes nothing.
  - An unmarked `## Lowdefy` section written by an earlier agent-setup is no longer updated; the block is appended after it. Delete the old section by hand.

- 24383b5: Add `lowdefy test`, which runs an app's config tests: the journeys committed in `tests/journeys/*.yaml`. Each journey names a page, an optional inline user object and a list of declarative steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`, `expect`). The command boots the development server headless on a free port (or targets a running one with `--url`), runs every journey through `POST /lowdefy-docs/journey`, prints `PASS`/`FAIL` per journey with the failing step's index, `expected` and `actual`, and exits `1` when any journey fails. `--filter <name>` narrows the run. Journey files are validated against a schema; an invalid file is reported as a failed journey without aborting the run.

  - **Journeys fail at the step that causes an app error**: an action that fails with an error that is not a user error, an uncaught exception or an error the page reports, a request or endpoint that throws on the server, or a 5xx from one. Errors raised while the first page opens (its `onInit` and `onMount` requests) fail the journey on open. `lowdefy test` prints the step and each error's kind, message and config file and line; the journey route's result carries them as `failure.errors`, each with a stable finding key. Only errors a journey's own browsers cause count, and they are reported in its result, not in the dev server's build status or event stream. Expected outcomes never fail a journey: a failed `Validate`, a `Throw` action or any other user error, and 401 or 403 refusals. Where an error is the outcome the app means, assert it with `expect: { error: <text> }` straight after the interaction that raises it: it claims that interaction's errors whose message contains the text, and fails when none does.
  - **Every reference is checked before its step runs.** A blockId, request, endpoint or `goto` page the step names that is not in the app's build, or an `as` name that is not a data set user, fails the step naming the unknown id.
  - **`wait: { request }` waits for a fresh call**: one started since the last interaction (or since the page opened, before the first). `wait: 3000` is shorthand for `wait: { ms: 3000 }`.
  - **The step grammar is a JSON schema**: `GET /lowdefy-docs/schema/journey-step/all` returns every step and `/lowdefy-docs/schema/journey-step/wait` one step, the `lowdefy_get_schema` MCP tool takes `kind: "journey-step"`, and `@lowdefy/node-utils` exports it as `journeyStepSchema`.

- 6d6fa5f: `lowdefy test --journeys-directory <path>` reads journeys from another directory instead of `tests/journeys`. Journeys that write (sign-ups, organizations, invitations) and need their own database, mail sink and server can live there, where a plain `lowdefy test` and the `lowdefy_run_tests` agent tool never read them, and run only from a script that sets up what they need. A named directory that holds no journeys fails the run.
- ef2b0c7: feat(server-dev): The dev server checks Lowdefy's agent instructions and reports what it finds apart from build warnings

  The dev server reads the `lowdefy-agent-rules` block that `lowdefy agent-setup` writes into `AGENTS.md` or `CLAUDE.md`, and reports a notice when the block comes from a different Lowdefy minor version than the app runs, when the block is in `AGENTS.md` but the root `CLAUDE.md` does not import it with `@AGENTS.md`, or when the block is missing from a project whose `.mcp.json` names the `lowdefy` server. Notices appear in build status's new `agentFiles` field (`lowdefy_build_status` and `GET /lowdefy-docs/build-status`), never among the build's warnings, and are checked again on every read, so a fix shows at once. The dev server also logs them once when it starts. `lowdefy mcp` passes each notice to the agent once per session for each app, and again only when its text changes, so it does not repeat after every edit; `GET /lowdefy-docs/build-status` reports them on every read. Each notice tells the agent to pass the fix to the developer rather than run agent-setup itself. The check only reads files, and apps on `lowdefy: local` get no version or missing-block notice.

- f9e483f: feat: The dev server records journeys

  `lowdefy dev` now records how you use your app in the browser, locally, so an agent can turn what you tried into journeys. Recordings stay in `.lowdefy/traces/` on your machine, are kept for 7 days or 200 MB, and never include password fields. Set `LOWDEFY_DEV_RECORD=false` to turn recording off. `lowdefy agent-setup` now also installs a `journeys-from-dev` skill.

- 73642f1: feat(dev): Screenshot viewport and colour scheme, smaller journey results, and Back, title and segmented-control steps for journeys.

  **Screenshots (`lowdefy_screenshot_page`)**

  - New `width`, `height` and `colorScheme: 'light' | 'dark'` options check a phone layout or dark mode, e.g. `{ "width": 390, "colorScheme": "dark" }`. The REST route takes them as `?viewportWidth=390&viewportHeight=844&colorScheme=dark`, since `width` and `height` there already name the clip.

  **Journeys (`lowdefy_run_journey`, `POST /lowdefy-docs/journey`, `lowdefy test`)**

  - A final page state over 10000 characters is no longer returned whole: the result carries `stateOmitted` with its size and each top-level key's size. A new `state` option picks what comes back: an array of state paths, `true` for the whole state, or `false` for none.
  - New `{ "back": true }` step presses the browser's Back button, and `{ "expect": { "title": { "equals" | "contains" } } }` checks the document title.
  - Segmented controls, radio groups and checkboxes are reached through their labels, so `click` by text and `select` by value work on a `SegmentedSelector`, `RadioSelector` or `ButtonSelector` option; before, the runner found the option's hidden input and timed out.

- 36f864c: feat!: Lucide icons replace react-icons, with icon settings and icon-set plugins.

  Lowdefy icons are now [Lucide](https://lucide.dev) icons rendered by `lucide-react`. react-icons names such as `AiOutlineUser` no longer resolve. Run `lowdefy upgrade` to rewrite them, or follow the migration guide at `/v6-to-v7` in the docs.

  Breaking changes:

  - **Icon names.** Use a semantic name (`edit`, `delete`, `chevron-down`, …), a Lucide name in PascalCase (`Pencil`, `Trash`), or a set-qualified name (`lucide:Pencil`). An unknown name at an icon property fails the build with a suggestion; old react-icons and Ant Design names get a migration message.
  - **Block and Ant Design icons are Lucide.** Every icon a block chooses (validation marks, date picker calendar, menu and sidebar toggles, dark-mode switch, upload lists, pagination arrows, …) and Ant Design's own close, status, expand and loading icons now render through semantic names, so they follow the app's icon set and `theme.icons.aliases`.
  - **`theme.icons.aliases` targets lose the `Lu` prefix** (`LuPencil` → `Pencil`), and several semantic names now point at Lucide 1.x names (`delete` → `Trash`, `filter` → `Funnel`, `help` → `CircleQuestionMark`, `history` → `RotateCcwClock`).
  - **Icon hover titles** are generated from the new names ("Pencil", "Arrow left right").

  New:

  - **Icon settings.** `theme.icons.size` (default `1em`), `theme.icons.strokeWidth` (default `2`) and `theme.icons.nonScalingStroke` set app-wide defaults; every icon accepts `strokeWidth` and `nonScalingStroke`.
  - **Icon-set plugins.** A plugin declares `iconSets` in `types.js` and exports icon data from `./iconSets`. Sets are layered in plugin order - the last plugin wins per icon name, and a partial set falls through - so a plugin can add a single icon to `lucide` or replace one. `theme.icons.set` picks the default set for PascalCase names and can re-skin semantic names.
  - **`@lowdefy/icons-react-icons`** holds every react-icons 5.6.0 icon under its old name. Install it and set `theme.icons.set: react-icons` to keep old names, for example icon names stored in a database.
  - **`lowdefy upgrade`** gains a `7.0.0` phase that rewrites react-icons names to semantic or Lucide names from a table covering every Ant Design, Lucide and commonly used react-icons name.

  Fixes: the header locale selector and the AgGrid row menu icons now bundle in production builds, and the dev server reports unknown icon names on pages written inline in `lowdefy.yaml`.

- c744e40: fix(cli): Generated servers install as their own pnpm workspace inside a parent workspace

  An app inside a pnpm workspace had to list its `.lowdefy/*` server directories as workspace members, so the servers picked up workspace plugins and the root's overrides and patches. Those directories are gitignored, so the committed root `pnpm-lock.yaml` depended on which servers happened to exist, and churned by thousands of lines between `lowdefy dev`, `lowdefy build` and a fresh clone.

  `lowdefy dev`, `lowdefy build`, `lowdefy emails` and `lowdefy test` now give the server its own `pnpm-workspace.yaml`, with a lockfile inside the gitignored server directory, even when the app sits in a parent workspace:

  - Every setting in the parent's `pnpm-workspace.yaml` except `packages` is carried over (`overrides`, `patchedDependencies`, `supportedArchitectures`, `minimumReleaseAge`, `nodeLinker` and the rest). When pnpm 10 installs the server (the parent's `devEngines.packageManager` or `packageManager` pin, or the `pnpm` on the path), the root `package.json` `pnpm` field and `resolutions` are carried too, over the yaml as pnpm 10 applies them; pnpm 11 ignores them, so they are left out. Paths are rebased so they point at the same files: patches, `link:` and `file:` specs in `overrides`, catalogs and `packageExtensions`, `pnpmfile` (a `.pnpmfile.cjs` or `.pnpmfile.mjs` at the parent root is used too, unless pnpm 10 takes `pnpmfile` from the parent's `.npmrc`), `onlyBuiltDependenciesFile`, and `storeDir`, `cacheDir`, `stateDir`, `globalDir`, `globalBinDir` and `globalPnpmfile`, so a parent `storeDir: .pnpm-store` keeps one store. `$name` overrides are resolved against the parent's root `package.json`: a `workspace:` version becomes a `link:` to the workspace package and a `catalog:` version takes the catalog entry. The file is rewritten on every run, keeping the `minimumReleaseAgeExclude` entries pnpm 11 adds when it installs a release younger than its default `minimumReleaseAge` (so a second `lowdefy build` or `lowdefy dev` on a new Lowdefy release no longer fails with "The lockfile contains entries that the active policies reject"), so build allowlists for plugin dependencies belong in the parent's `pnpm-workspace.yaml`.
  - The parent's `.npmrc` (scoped registries, auth) is copied into the server's `.npmrc`, ahead of the server package's own lines, with relative paths (`store-dir`, `pnpmfile`, `cafile`, `certfile`, `keyfile` and the like) rebased. Credentials that reference an environment variable (`${NPM_TOKEN}`) stay references; a credential written out in the file is not copied, and the CLI warns which key it left out.
  - Plugins with a `workspace:` version are installed as `link:` paths to their package in the parent workspace, including plugins a `lowdefy dev` rebuild adds while the server runs.
  - The parent's pnpm pin (`packageManager` and `devEngines.packageManager`) is set on the server's `package.json`, and removed from it when the parent drops it.
  - The server reinstalls when its `pnpm-workspace.yaml` or `.npmrc` changes, not only its `package.json`.
  - `lowdefy docker-output` and `lowdefy vercel-output` still trace from the parent workspace root, so linked plugins are included.

  Server installs no longer fail on pnpm 11 with `ERR_PNPM_IGNORED_BUILDS` for `@sentry/cli`, in standalone apps too: the generated `pnpm-workspace.yaml` skips its install script, which only downloads a binary the platform optional dependency already provides.

  To stop the lockfile churn, remove the `.lowdefy/*` globs from the parent's `pnpm-workspace.yaml` `packages`. If the parent's patches only apply to the servers, set `allowUnusedPatches: true` in the parent too.

- 4cc0f36: feat: Journeys run on named data sets

  Journeys can run on named data sets. Declare one in `tests/data/<name>.yaml` with committed fixtures and named users. A journey with `data:` runs against a fresh in-memory MongoDB database of its own, on the running dev server, and your own browser tabs keep using your real database. `user:` and `as:` can name a data set user.

  Under a data set no request reaches your real data: every connection reads the run's database, is sunk, or fails the journey. Connection plugins gain a `meta.dataSet` declaration:

  - `'redirect'`: the run's database URI and name are merged in (core `MongoDBCollection`).
  - `'walled'`: a type that holds no database URI and reaches MongoDB only through the walled client (`walled(connectionId)` with `getWalledCollection` from `@lowdefy/connection-mongodb/walled`) passes unchanged, and the walled connections it names take the run's database.
  - `'external'`: an outside service (core `AxiosHttp`, `SendGridMail`, `SMTP`, `Stripe`, the AI providers, `Mcp`, `TregConnection`, `AwsS3Bucket`, `AzureBlobContainer` and `GoogleCloudStorageBucket`). Its requests are still validated and checked, then recorded and answered with `null`, never sent. The run's result lists them as `sunk`, with the connection, request and evaluated request properties (secrets scrubbed). Mail sent to the dev server's mail capture still reaches it, so the `email` step works. A request resolver can declare `meta.dataSet: 'external'` itself, so a connection that holds database access sinks only that request type and runs the rest against the run's database.

  A connection whose type declares nothing, such as `Knex`, `Redis`, `Elasticsearch` or `GoogleSheet`, or a redirected connection whose whole `properties` is an operator, fails the journey with an error naming the connection. A data set journey's browser that reaches the dev server on another host fails the step instead of reading your real database. The in-memory store binds a free port from 49152 up, stops with its files removed when the dev server stops, and is replaced after its `mongod` dies.

- ef64856: feat: Seeded `generate` for journey data sets

  A journey data set can generate documents from a small spec beside its fixtures, the same on every machine:

  ```yaml
  generate:
    seed: 7
    invoices_db:
      count: 400
      fields:
        _id: { sequence: { prefix: inv-, start: 1 } }
        status: { oneOf: [draft, sent, paid], weights: [1, 2, 5] }
        amount: { number: { min: 10, max: 5000, decimals: 2 } }
        issued: { date: { from: 2026-01-01, to: 2026-09-30 } }
        customerId: { ref: customers_db }
  ```

  Field kinds are a literal, `oneOf` with optional weights, `number`, `date`, `text`, `name`, `email` (at reserved example domains), `company`, `sequence` and `ref` (an `_id` from another connection's fixtures or generated documents). A generated `_id` that a fixture or another connection naming the same collection also holds is refused. A connection that loads more than 1,000 documents gets a warning, never a refusal. `lowdefy test`, `lowdefy data list` and the `lowdefy_run_journey` result report the documents a data set loads. The format is in the dev server's docs endpoint, so a coding agent can write a generator from a short description.

- cb0acad: feat: Journey data set files and `lowdefy data list`

  Declare a journey data set in `tests/data/<name>.yaml`: committed `fixtures` keyed by connection id, named `users` (injected callers, no credentials), optional `indexes` in the `listIndexes()` shape, and an optional seeded `generate` block for background documents. Everything a data set loads is committed, so it is the same on every machine. `lowdefy data list` prints each data set with the documents it loads and the users it names.

  A data set can extend others with a top-level `extends: [<data set name>, ...]`. The named data sets' fixtures, indexes and users load first, in the order listed, then the file's own. A later fixture with an `_id`, an index with the same `key` or a user of the same name replaces the earlier one. `generate` stays per file: only the named data set's own `generate` runs, and its refs and `_id` checks see the extended fixtures. A set reached twice loads once, and a cycle or an undeclared name is refused.

  Journeys accept `data: <name>` and a data set user name as `user:`, and `lowdefy test` prints the data set a run used once, with its document count.

- 0205b5a: The journey grammar accepts `from: recorded | shape`; the runner refuses placeholder values.

  `fill`, `select` and `expect.state` take an optional `from`. `from: recorded` marks a value observed in a recorded trace; the step runs as usual. `from: shape` marks a placeholder, `value: null`, that a trace could not hold (a value typed in production, or a password the dev recorder did not keep). The dev server's journey runner and `lowdefy test` refuse a journey holding one before a browser opens, naming the step: fill it from a data set or the journey's user, then remove `from`. A `fill` or `select` with `value: null` and no `from: shape` is a grammar error.

  The step grammar lives in `@lowdefy/node-utils` and `lowdefy test` checks it before starting a dev server, so a malformed step, or an unknown key on any step or target, is reported as an invalid journey file with its step number. `lowdefy test` also accepts the `open` step.

- 3a8c8e9: feat: Lint and vary journeys on data sets, and the journeys-harden skill

  - **`lowdefy test --lint` checks data set users (L5)**: a journey names a user from its data set, or `user: none`. An inline user object, or no `user`, is a warning until the journey moves onto a data set. Users are read from the data set file, with no server.
  - **`lowdefy journeys variants` writes the data-set kinds**: `role` (each other role set as a data set user who holds it, and a user the page refuses landing on `/404`), `tenant` (a user of another organization sees their own rows and none of yours), and `empty` and `volume` on the data sets `--empty-data` and `--volume-data` name. A kind whose input is missing is listed with what to add to the data set.
  - **`journeys variants` names each file for its journey file and journey**: `tests/journeys/_candidates/variants/<source>/<journey>-<kind>.yaml`, so the journeys of one file, and same-named files in different folders, never overwrite each other's variants. A rerun keeps a variant you edited, such as a filled-in placeholder, instead of overwriting it, removes unedited variants the journey no longer gives, and reports `CONFLICT` instead of touching a file another journey owns. The negative, interrupt and double-submit variants count the write of the page the submit click is on, so two pages sharing a request id are told apart.
  - **`lowdefy agent-setup` installs a `journeys-harden` skill**: it replays and lints journeys, sizes and runs `lowdefy journeys harden`, takes each surviving mutant to you with the assertion that would catch it, writes variants for the journeys you pick, and reports what it found. It never deletes a journey or suggests deleting one, and commits nothing.

- 316f5be: feat: Harden journeys with lints, config mutants and edge-case variants

  `lowdefy test` can repeat journeys (`--repeat 3`) and lint them (`--lint`). `lowdefy journeys harden` breaks your config on purpose, one change at a time and only in the test's own browser, and reports each change no journey noticed with its source line. `lowdefy journeys variants` writes edge-case journeys (bad input, reload, double click).

  - **`lowdefy test --lint [paths...]`** checks journeys without running them: no placeholders (L1), every action that ran an event followed by an assertion (L2), no fixed waits (L3), journeys that write declare `data:` (L4), a final assertion (L6), and no `as` step that names the person already acting (L7).
  - **`lowdefy journeys harden`** hardens journeys that run on a data set (`data:`); a journey without one is left out with an error naming it, and with none left harden exits 1. It runs each journey once, lists the mutants on what it exercised, runs each against the journeys that reached it, and writes `.lowdefy/test/mutation.json` with each journey's kills. `--list` estimates the run, `--mutant <id>` confirms one kill, `--max` and `--seed` sample, and `--page` limits the mutants to those pages and the baseline to journeys whose last measured run touched them. It prints progress while the baseline and mutants run (`Baseline 37/412 journeys (2 failed)`, `Mutants 12/45 run (3 survived)`), and carries its verdicts over config edits made while it runs.
  - **`lowdefy journeys variants <file>`** writes `negative`, `interrupt` and `double-submit` candidates to `tests/journeys/_candidates/variants/` with a `variant: { of, kind, detail }` key, and replays each three times.
  - **Journey results report the events that ran and the blocks shown** (`exercised.events`, `exercised.rendered`), measured from inside the journey's own browsers only.

- ba86509: feat(cli): Journey production evidence builds up by calendar month

  A journey's `evidence.production` holds one entry per UTC calendar month (`month`, `days`, `sessions`, `persons`, `orgs`, `failures`), so counts build up across pulls and machines without double counting:

  - `lowdefy journeys evidence --refresh` reads every final day of the production cache, gaps included. Today and yesterday count once a later pull marks them final. A routine refresh reads only the current month.
  - A month is rewritten only when the cache holds more final days of it than the committed entry. Refreshing twice changes nothing, a fuller pull from a colleague wins, and a cache that never held a month, or pruned it, leaves that month as committed.
  - A session counts in the month it started, once, even when it crosses midnight. A month read with no backing session is written with `sessions: 0`.
  - A renamed click label keeps its history: clicks resolve to any click text a committed flow already holds.

  Each journey's production evidence also records the flow it was counted for (`sequence`, `pageId` and `flow`). When an edit changes what the journey matches in production (a click's text or block, the step order, a `goto`, or an `expect.url` path that moves later steps), the next refresh moves the counted months to a `deprecated` flow and counts the new flow from the cache. A deprecated flow is never run and is still counted on every refresh, so you can see whether users keep following the old way. Undoing the edit makes it live again. Waits, other expectations, typed values, rows and `nth` do not change the flow. A journey's sequence id and flow read click text by the config text rule used to match production, so a click on a data value is the same flow as a click with no text.

  A journey file accepts `deprecated: true` at its top level, for a flow being retired from the app. Refresh keeps counting it.

  The list of journeys with no production backing reads the last 3 calendar months.

- f9d8520: feat(journeys): journeys record and replay pages with path parameters

  A journey names a visit as a page and its values, never as a raw path. The dev recorder writes each pageview with the page id and `path_params` the server matched to the path, so moving between two records of one patterned page is two visits. A journey that enters on a patterned page carries `pathParams` next to `urlQuery`, the `goto` step takes `pathParams` (an object of strings, one per placeholder), and dev replay builds every URL from the page's path pattern, refusing a journey whose path is missing a value. `lowdefy journeys pull` reads the page from `lowdefy_page_id` and its values from `lowdefy_path_params`, never from the URL path; an event that names no page is dropped as `no_page`. The journey sequence reads the page an `expect.url` path landed on by matching it against the build's route table, so the steps after a navigation by click count on the page they ran on, in recorded segments and committed journeys alike. Journey files, `lowdefy test` and variants carry `pathParams` where they carry `urlQuery`.

- e5b2f83: feat: A journey runs once per user in a `user` list

  A journey's `user` can be a list of data set user names, such as `user: [admin, member]`, on a journey with `data:`. `lowdefy test` and the `lowdefy_run_tests` MCP tool run the journey once as each user, each in a fresh database, and report each run on its own line as `<name> [<user>]`. `--filter` matches that name (`--filter "[member]"` runs one user's run), recordings and coverage see each run apart, and `--repeat` repeats each run. `as:` steps are unchanged: the first actor is the run's user.

  - A list holds distinct data set user names only and needs `data:`; `none` and inline user objects stay single values. Anything else is refused as an invalid journey file before a server starts.
  - `lowdefy test --lint` reads such a journey once, and L5 checks every listed name against the data set.
  - `lowdefy_run_journey` takes the same list and returns `{ passed, runs: [{ user, ... }] }`. `POST /lowdefy-docs/journey` still runs one user per call and refuses a list with a 400.
  - `lowdefy journeys variants` skips the role sets a journey's listed users already have, and a granted role variant's first comment names the user list to set on the original journey. The `journeys-harden` skill keeps a passing granted role variant by adding its user to that list and deleting the variant file, rather than committing a copy of the journey. A refused role stays a journey of its own.

- 69c31e8: feat: Replay journeys with `--repeat`, measure what each journey exercised, and run config mutants through journeys

  - **`lowdefy test [paths...] --repeat <n>`.** Run journey files or directories anywhere under the config directory, candidates in `tests/journeys/_candidates/` included; `--filter` still applies on top. `--repeat` (1 to 10) runs each journey n times and classifies it `PASS`, `FLAKY` (some runs failed, each failing run's step printed) or `FAIL` (every run failed: a finding, not a test to fix by retrying). Any `FLAKY` or `FAIL` exits 1. A journey file the runner refuses fails once and is not repeated. Run once, the output is unchanged. `lowdefy_run_tests` takes `paths` and `repeat` with the same meaning, and each result carries `class`.
  - **What a journey exercised.** Every journey result carries `exercised`: the pages, requests (with call counts), endpoints and app events its browsers asked the dev server for, merged across actors, plus the endpoints a routine reached through `CallApi` (`via`) and whether each request and endpoint writes. `lowdefy test` keeps each journey's newest path in `.lowdefy/test/exercised.json`.
  - **Config mutants (dev server).** `POST /lowdefy-docs/mutants` lists the mutants on what a set of journeys exercised (dropped actions, skipped validation, flipped visibility, swapped `_if` branches, dropped payload keys, retargeted links, dropped blocks and routine steps), each with an id that is stable across builds and the source line it changes. A journey POST can carry one `mutant`: the dev server applies it only to the requests of that journey's own browsers, including detached endpoint calls, and reports how often it applied. Your own browser tabs keep seeing the unmutated app.

- da76905: `lowdefy test` and the `lowdefy_run_tests` agent tool can run all journeys, a folder or glob of them, or a tagged section.

  - A plain `lowdefy test` reads every sub-folder of `tests/journeys/`. Folders whose name starts with `_`, such as `_candidates/`, are skipped.
  - Paths may be globs, which the CLI expands itself: `lowdefy test 'tests/journeys/review/**'`. They also work in npm scripts on Windows and in the tool's `paths`. A glob that matches nothing is refused, like a missing path.
  - Journeys take an optional `tags` list, such as `tags: [smoke, review]`, and `lowdefy test --tag smoke --tag review` runs the journeys that carry any of the given tags. `--filter` can be repeated in the same way. Paths, tags and filters combine. The tool takes `tags`, and `filter` as a string or a list.
  - When nothing matches, the message names the paths, tags and filters that were given.

- 9953932: feat(cli): Run journeys by popularity tier with `lowdefy test --tier`

  `lowdefy test --tier <common|wide|edge|full>` runs only the most-used journeys of a selection, ranked by their recent production use, so you can check the happy paths first (`common`) and widen to the edge cases real users still reach (`edge`) before calling a change done. Tiers are cut after paths, `--tag` and `--filter` narrow the suite, over that selection alone, and `--usage-window <n>m` (default `3m`) sets the calendar months the ranking reads. A journey with a list of users is tiered once and runs as each user. Journeys with no counts for their current steps run in every tier. A tiered run never records as the suite's run, and a selection with fewer than 100 journey matches in the window, or no evidence, is refused. `lowdefy_run_tests` takes the same `tier` and `usageWindow`.

  The `PASS` line shows a journey's tier, rank, rate and failures over the usage window: `PASS  member assigns an open ticket  (5 steps, 2100ms)  common #2 · 13.7/day · 14 failed (3m) · 11/12 mutants`, or `unranked` for a journey with no counts for its current steps.

  A journey with `deprecated: true` is skipped in every run, even when named by path or `--filter`, and listed as `SKIP deprecated` with its recent rate. A plain run that skips one still records as the full suite.

  `lowdefy journeys usage` selects journeys the same way as `lowdefy test`, so a persona filter such as `--filter "[admin]"` picks the same journeys in both. The AGENTS.md section and `lowdefy-config` skill that `lowdefy agent-setup` writes tell agents to run `tier: common` first and widen to `tier: edge` before calling a change done.

- 9ed1386: feat: The coding agent explores pull requests, with `lowdefy journeys scope` to say what a change touched

  - `lowdefy journeys scope [--base <ref>] [--json]` prints what a change touched: each page the change reached, including pages from modules, why (its own config, a request, an endpoint, a connection, a websocket, an app-wide artifact, or a `_ref`'d file), the blocks added, changed or removed, and who can open the page, with the data set users under `tests/data/` that it admits. It builds the merge base and the working tree with the installed dev server's builder, installing it into `.lowdefy/dev` when none is installed, and needs no running dev server. Without `--base` it lists every page.
  - `lowdefy agent-setup` installs a `journeys-from-pr` skill that has the coding agent explore a pull request itself. For each changed page and role, it looks at the page, writes a journey for every path a user can take, and proves each one with `lowdefy test --repeat 3`. Journeys that pass join the suite. A journey that fails is reported as a finding, with that journey. Given a goal sentence instead, the same skill runs a bug bash.
  - A journey's `name` is at most 100 characters, checked as authored (before a `[user]` suffix). An optional `description`, at most 60 words, states the journey's goal.
  - On a journey with a data set, a click on a block whose events reach a connection the data set cannot run (a type that declares no `meta.dataSet`, a connection with no artifact, or an `external` type with no request types to sink) fails at that step, naming the block and the connection's declaration: `Block "export" reaches connection "reports_db" (Knex, no dataSet declaration), which a data set cannot redirect, so a data-set journey cannot click it.` A click that runs an auth action (`Login`, `Logout`, `SetActiveOrganization`, `UpdateSession` and the rest) fails the step, naming the block and the action, when the action executes; one the click skips (a failed `Validate`, a true `skip:`) passes.

- 85b4c93: feat: `lowdefy agent-setup` installs a `journeys-autopilot` skill that builds and hardens an app's journeys on its own

  Start it once (in Claude Code, `/loop /journeys-autopilot`) from a shell that holds your app's secrets, and leave it running. It works alone, one dev server and one test run at a time, in its own git worktree, so your checkout and dev server are untouched. On an app with no journeys it first writes a data set with fixtures and a test user for each role and maps every page by role. On an app that already has a data set and journeys, it builds on your data set without editing it and counts your journeys as covered, never rewriting or duplicating them. It keeps a progress list in `tests/autopilot.yaml` and each cycle writes the journeys that matter most next: refusals and permissions, then writes, then the most-used pages, then edge cases. A journey is kept only after three clean runs and must check a value only the fixtures hold. Flaky journeys are quarantined with their cause, journeys that expose app bugs are kept as findings, and nothing is deleted or weakened to pass. When everything is covered it moves on to hardening. It keeps one pull request of journeys open at a time, resumes it from any machine, and stops adding to it at about 20 journeys until you merge it. Once those journeys merge, it fixes an obvious local app bug in a separate small pull request. It never merges or touches production or shared databases. Each cycle stops at a clean point, so it can be interrupted any time.

- 73c5e14: feat: `lowdefy journeys pull posthog` brings production analytics into local journey traces; `journeys evidence` and `journeys coverage` report how much real use backs each journey and what no journey covers yet.

  - `lowdefy journeys pull posthog [--since 30d | --from --to]` reads the app's PostHog project over the HogQL query API with your own personal API key (`POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST`, `POSTHOG_PERSONAL_API_KEY` with the Query Read scope) and writes one day of interaction traces per file to `.lowdefy/traces/production/`. A window is at most 30 days. Final days are fetched once, today and yesterday again on every run, and files older than 400 days are removed. Person and organisation ids are hashed, and each clicked element's text is stored as a token (`target.text_token`), never as text, both with a salt that never leaves your machine; typed values, URL query values and element chains are never stored. Options: `--environment`, `--include-test-accounts`, `--org-property`, `--roles-property`, `--page-size`, `--max-rows` and `--refetch`.
  - Coverage and evidence turn a token back into text only when it is text from the app's config (the built pages, menus, i18n messages, block plugins' default messages and antd's locale strings, collected with one build by the installed dev server and cached until the config changes). A click on any other text (a customer's name in a grid cell) is read as its block, row and column with a `tokenised-text` flag, and a journey clicking a data value is backed exactly as one with no text. A day pulled under another salt, or with different filters (project, `--environment`, `--include-test-accounts`), is not mixed in: coverage and evidence name the days and the `--refetch` pull that makes them one set.
  - `lowdefy journeys evidence [--refresh]` counts, for each journey in `tests/journeys/`, the production sessions that did what it does, with people, organisations and failures. `--refresh` writes them into the journey's `evidence` key and changes nothing else in the file, and a hardening run's `.lowdefy/test/mutation.json` adds `evidence.mutation`. Journeys nothing backs are listed beside their mutation numbers and never removed.
  - `lowdefy journeys coverage --source production [--json]` reports interaction, flow, failure, frustration and role coverage, each with what is uncovered ranked by use, and writes them with a production profile to `.lowdefy/test/coverage.json`, which lists per block the clicks, distinct tokens and most-clicked tokens. Journeys with `deprecated: true` are left out of every measure. Sessions are grouped into flows only when the window holds 100,000 production rows or more; below that the summary points to the session logs (`--group` and `--no-group` force either way).
  - `lowdefy journeys session --source production` lists the pulled production sessions (`--since`, `--from`, `--to`, at most 30 days) and prints any one as a log, as dev sessions print: the controls used and what the app did, without typed values, and with clicked text only when it is config text.
  - With a recorded full test run, `journeys coverage` reports the interaction share that run drove beside the static one, and counts a failure as covered only when a journey that passed produced it (`failure.mode: measured`); without one it reports failures as reached. `lowdefy test` and `lowdefy_run_tests` keep which journeys passed in a recorded run in `.lowdefy/test/run.json`.
  - `lowdefy agent-setup` installs a `journeys-from-production` skill that runs the loop with you: it picks the window, pulls, reads each recorded routine with the app's config and code, takes one uncovered failure or flow at a time into a journey proven by three runs, then refreshes evidence. Running `lowdefy journeys usage --json` before and after the refresh, it reports the deprecated flows users still follow, the journeys whose tier changed and those still unranked. It commits nothing, never deletes a journey, and never reads production text or credentials or queries PostHog directly.
  - Journey files accept a strictly validated `evidence` key, and `lowdefy test` (and the `lowdefy_run_tests` MCP tool) print it after each passing journey: `412 sessions · 9 orgs · 11/12 mutants`.

  `@lowdefy/node-utils` exports `isBackedBy`, the one rule for whether a recorded segment did what a journey does, `profileProduction`, `listFailurePaths` and `failurePathKey`. `compileSegments` segments also carry their entry page, pages, failure path and frustrated clicks.

- 12b5f41: feat(cli): The `journeys-from-dev` and `journeys-from-production` skills write journeys from session logs

  `journeys-from-dev` asks which session the developer meant, reads its log with `lowdefy journeys session <id>` (or `lowdefy_journey_session`), decides what the developer was proving (a failed attempt and its fix are both worth a journey), writes the journeys with assertions on outcomes rather than on generated ids, and keeps only those `lowdefy test --repeat 3` passes. `journeys-from-production` reads production session logs, or the grouped flows from 100,000 rows on, and writes and proves journeys the same way, with typed values from data set fixtures.

- c3e0d79: feat(cli): `lowdefy journeys session` prints a recorded dev session as a log to write journeys from

  `lowdefy journeys session` lists the sessions the development server recorded, newest first, with each one's id, time span, pages, interactions and failures. `lowdefy journeys session <id>` prints that session as a log, one line per interaction with what the app did in response, such as `click save → Validate failed [priority]` and `click save → ran Validate, request createTicket ok`, with a `page <pageId>` line per page view. A failed attempt and its retry both show, typed values and generated ids show as recorded, and nothing is turned into an assertion. Agents connected to the development server read the same list and logs with the new `lowdefy_journey_session` tool.

  The development recorder records which actions an event ran and which API endpoints its `CallAPI` actions called, so a log can say `endpoint syncInvoices ok`.

- 3c7b352: feat(cli): Add `lowdefy journeys usage`, a report of journeys ranked by recent production use

  `lowdefy journeys usage [paths...] [--tag] [--filter] [--tier] [--usage-window] [--json]` ranks the journeys in `tests/journeys/` by their recent rate: production sessions over the final days their months hold in the usage window, the last 3 calendar months (`--usage-window 3m`) ending at the newest month any selected journey holds. Each journey shows its popularity tier, its sessions and failures over the window and all time, a line per month with that month's persons and organisations, and its deprecated flows with their recent use. Below that it lists the production flows no journey covers, from `.lowdefy/test/coverage.json`, ranked by their sessions in coverage's window and not tiered.

  Tiers are cumulative cuts of the selection ranked by rate: `common` reaches 50% of the summed rates, `wide` 80%, `edge` 95%, and `full` is every journey. They nest, never split equal rates, and are cut over the paths, tags and filters selected. A journey edited since the last evidence refresh, or never refreshed, is unranked and in every tier; a `deprecated: true` journey is in no tier. With fewer than 100 journey matches in the window, every tier but `full` is refused. `--json` prints the same rows for agents.

- f33e96a: `lowdefy mcp` works in every project and worktree you open an agent session in, and one session can run the dev servers of several projects.

  - **Register once for every project.** `lowdefy agent-setup --user` adds the `lowdefy` MCP server to Claude Code's user scope, so every session has the Lowdefy tools — in a repository nobody set up, in a directory above several projects, anywhere. It needs no app. On Windows it registers `cmd /c npx ...`. A rerun whose add fails keeps your existing registration. Without Claude Code on your `PATH` it prints the entry for your agent client.
  - **Tools in a fresh worktree.** `agent-setup` writes `npx --prefer-offline --yes lowdefy@<version> mcp` into `.mcp.json`, pinned to the version of the CLI running agent-setup, so every app in a repository writes the same entry. A worktree nobody has installed yet still starts the server: npx serves the pinned version from the shared npm cache, offline, in under a second. agent-setup first runs the pinned version through npx and refuses one npm cannot serve, so a committed entry never leaves teammates without tools.
  - **Agents install what is missing.** When an app lists `lowdefy` in its `package.json` but its dependencies are not installed, `lowdefy_dev_start` answers with the install command and where to run it (for example `pnpm install` at the workspace root), instead of running a dev script that cannot start.
  - **Trust a repository once.** Approving an app outside the session's checkout offers **Always allow this repository**, which covers all of its git worktrees in every later session. Trust is per git repository and only comes from you: the question, or `lowdefy hub trust [directory]`, which runs only in an interactive terminal so an agent cannot run it. `lowdefy hub untrust [directory]` and `lowdefy hub trusted` manage the list.
  - **The MCP server is renamed `lowdefy`** (was `lowdefy-docs`), so its tools are `mcp__lowdefy__*`. Rerunning `lowdefy agent-setup` replaces the `lowdefy-docs` entry 6.x wrote in `.mcp.json` (an entry pointing at a `localhost` port; a `lowdefy-docs` entry pointing anywhere else is left as it is) and renames the server in `.claude/settings.json` and `.claude/settings.local.json`: in `enabledMcpjsonServers` and `disabledMcpjsonServers`, and in the `permissions.allow`, `ask` and `deny` tool rules (`mcp__lowdefy-docs__lowdefy_get_schema`, or `mcp__lowdefy-docs` for all its tools, become `mcp__lowdefy__…`), so tool approvals carry over. It also updates the name in the skill and `AGENTS.md` section it wrote, and `agent-setup --user` removes an old `lowdefy-docs` user registration. Update any other place that names `mcp__lowdefy-docs__` tools, such as hooks. The dev server's `/lowdefy-docs` routes are unchanged.
  - **Mixed Lowdefy versions.** When `lowdefy mcp` and the dev server it calls run different Lowdefy versions, a tool call either works or fails with the fix spelled out. `lowdefy mcp` adds the tools it does not know to the session's tool list, and shared tools follow the newest comparable server: a dev server on a newer Lowdefy version replaces their descriptions and schemas. Versions are compared only when both are releases or share a major, so an experimental build is never overridden by an older release line. The client is told to list the tools again. A successful call notes both versions once a session, and every failed call carries the note, with the pinned fix `npx lowdefy@<dev server version> agent-setup` for the agent to pass to the developer rather than run. A dev server `lowdefy mcp` cannot reach is reported with its URL.

- 3bebfd9: `lowdefy mcp` adds `lowdefy_run_tests`: it runs the app's journeys (`tests/journeys/*.yaml`, the same selection and runner as `lowdefy test`, with an optional name `filter`) against the app's dev server, starting it if needed, and returns a summary plus one result per journey — passed, or the failing step with what was expected and what happened. Agents can prove a change did not break anything without a shell, and turn the steps they verified with `lowdefy_run_journey` into regression tests.
- 31605fb: Notification and email links to patterned pages: a `{ pageId, urlQuery, pathParams }` link builds its URL from the page's pattern in `routes.json` with `buildPagePath`, and a missing path value fails with the builder's error. The stored notification record keeps `pathParams` on the link object. `resolveLink` in `@lowdefy/email-templates` now takes `{ link, paths }`, `buildPreviewProps` takes `paths`, and `lowdefy emails` passes the page paths from `routes.json`.
- 81bd4f0: feat(plugin-posthog): new PostHog product analytics plugin

  A default plugin that wraps the `posthog-js` browser SDK, so no script tag or snippet is
  needed. `posthog-js` is loaded lazily by `PostHogInit`, so an app with `enabled: false`
  never downloads it. Run `PostHogInit` from the app's root `events.onInitAsync`, which runs
  once per app load on whichever page opens first; repeat calls with the same `apiKey` do nothing.

  Adds `PostHogInit`, `PostHogCapture`, `PostHogPageview`, `PostHogCapturePageLeave`,
  `PostHogIdentify`, `PostHogSetPersonProperties`, `PostHogAlias`, `PostHogGroup`,
  `PostHogReset`, `PostHogOptIn`, `PostHogOptOut`, `PostHogFeatureFlag` and
  `PostHogReloadFeatureFlags`, each with a params schema.

  With PostHog disabled every other action is a silent no-op, so analytics can never break an
  app, but invalid params still throw and an action that runs before `PostHogInit` logs a
  console warning. `PostHogIdentify` reads the identity `posthog-js` holds and resets before
  identifying a different person on a shared browser.

  - **Lowdefy semantics** — every event gets `lowdefy_page_id` (the page id, also on a page with a
    path pattern) and `lowdefy_path_params` (the page's path values, `{}` without a pattern).
    Autocaptured clicks, rage clicks and dead clicks also get `lowdefy_block_id`,
    `lowdefy_block_type`, `lowdefy_block_ids`, `lowdefy_option` on a dropdown option, `lowdefy_row`
    and `lowdefy_column` inside a grid, and `lowdefy_text`: the text of the control the click
    reached (a button, menu item, option or label), even when the click lands on its icon, a child
    or a wrapper.
  - **Event failures** — a `lowdefy_event_failed` event is captured when a block or app event fails,
    with ids only, never messages or values, and at most 50 per app load. Failures in the app's
    `onInit` are captured too, although `PostHogInit` runs later in `onInitAsync`. Set
    `captureEventFailures: false` on `PostHogInit` to turn it off.
  - **Click text masking** — on by default. Click text (`$el_text`, `lowdefy_text`, `text` entries in
    `$elements_chain` and `$elements`, `$selected_content` and link targets) is kept only when the
    config of the page it was clicked on, the menus, the i18n messages or the antd locale spell it
    out. Grid and table cell values, options and menu items filled by requests, labels built from
    records and `Dynamic` block output are removed; button, menu, tab, column header and literal
    option labels stay. Element attributes other than structural ones (tag, classes, `class`,
    `role`, `type`, `row-index`, `col-id`, `nth-child`, `nth-of-type`) are removed, including
    `title`, `aria-label` and `data-*`, and `id` is kept only as a block wrapper id. Classes and
    `data-ph-capture-attribute-*` values are not masked, so apps must not build them from data. URLs
    are not masked. Set `maskDataText: false` on `PostHogInit` to send full click text, or
    `options.mask_all_text: true` to send none.
  - **Deployment environments** — `PostHogInit` registers the current environment as the
    `environment` super property on every event, and `posthog.enabled: false` in an environment
    turns PostHog off there (`PostHogInit` behaves as `enabled: false`), alongside the `cron`,
    `email` and `sentry` switches.

  For plugin authors: action plugins receive a `trace` argument for observing completed events and
  the read-only app metadata as `lowdefyApp`; the engine trace gains `isConfigText({ text, pageId })`,
  and `@lowdefy/helpers` exports `filterElementsChain`.

  AutoComplete and PhoneNumberInput render their dropdowns inside the block, like Selector.

- 493a1e6: feat(dev): `lowdefy_screenshot_page` can capture an open dropdown, a date picker's calendar or a modal, and a page opened at a query string.

  - New `steps` option runs interactions after the page settles and before the capture, addressed by block id — the same steps as `lowdefy_run_journey`. A new `{ "open": "blockId" }` step opens the popup of any input (Selector, MultipleSelector, AutoComplete, DateSelector and the other pickers, Cascader, TreeSelector) and waits for it to show. Popups are drawn at the end of the page, so `fullPage` and `clip` captures include them. If a step fails, the screenshot is still returned, showing where it stopped, together with the failure.
  - New `urlQuery` option opens the page with query params, for pages that read `_url_query`.
  - `open` is also a journey step for `lowdefy_run_journey` and `lowdefy test`.

- a675307: Journeys can test sign-up, sign-in and invitations through the app's own auth. `user: none` injects no user, so a journey starts signed out and the session cookies a sign-in sets carry through its steps. Three steps cover it: `goto` loads an app page the way a typed URL does (`goto: pageId` or `{ pageId, urlQuery }`); `email: { to, subject }` opens the newest email to an address that arrived during the journey, after which `click: { text: ... }` follows its links; `as: name` switches to another person with their own browser, cookies and client address, so an owner and an invitee, or a member whose session stays open while they are removed, act in one journey. The journey starts as `main`.

  A journey's `user` wins over `auth.dev.mockUser`; a journey with no `user` acts as the mock user. A journey with `user: none` is refused while a mock user is active, since every request would act as the mock user.

  The dev server captures mail for the `email` step when `LOWDEFY_DEV_SMTP_PORT` is set: it receives SMTP on `127.0.0.1` on that port and writes each message to `.lowdefy/mail/` in the app directory instead of delivering it. Point the app's SMTP connection at that port to use it. Nothing is captured without the variable, and the production server never captures mail. `lowdefy test` and the `lowdefy_run_journey` tool accept these steps and `user: none`.

- 855ae02: A journey can set `timeout`: how long each step may wait, in milliseconds (a whole number from 1 to 60000, default 5000). Raise it on a slow machine or CI runner instead of padding the journey with `wait: { ms }` steps. Page opens get at least 15 seconds, or the journey's `timeout` when that is longer. Journey files, `POST /lowdefy-docs/journey` and the `lowdefy_run_journey` tool all accept it.
- f1dc820: feat(server-dev): Add `lowdefy_run_journey` and `POST /lowdefy-docs/journey` — drive a page of the running dev server headless through declarative steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`, `expect: { state | visible | text | url }`, blocks addressed by `blockId`) and assert what happens, so an agent can verify behaviour and not just layout. `expect: { text }` and `expect: { state }` wait up to the step timeout for the text or value to match, as `url` and `title` do, and `state` with `equals: null` also passes when the path does not exist. After an interaction the runner lets the page settle for at most 5 seconds, whatever the step timeout. A failing step stops the journey and returns `passed: false` with `failure: { index, step, expected, actual, message }`, the remaining steps `skipped`, any screenshots taken (MCP image content) and the final page `state`. `lowdefy_run_journey` returns a count of what the run exercised; pass `exercised: true` for the full block, or `exercised: false` to leave it out. The headless page URL also accepts `urlQuery`.
- ae3541c: feat: Lowdefy servers stop when whatever started them stops

  A Lowdefy server started by a test runner, a script or a coding agent's command could outlive it when that process was killed or timed out, and keep holding a few hundred megabytes of memory for days. Servers now stop with their owner, however it ends.

  - **`lowdefy start`, `lowdefy dev` and `lowdefy test`** start the server with node directly (no `pnpm run start` in between), forward SIGINT, SIGTERM and SIGHUP to it, and hold its stdin, so the server stops even when the CLI is killed outright. The dev server's Vite process stops when the dev manager is killed. A server run directly with `node`, as in a Docker image or on Vercel, behaves as before.
  - **`--exit-with-pid <pid>`** on `lowdefy start` and `lowdefy dev`, or the `LOWDEFY_EXIT_WITH_PID` environment variable, stops the server when that process exits. The variable passes through wrappers such as `pnpm exec`, `npx` or a secrets manager.
  - **Test tools set it for you.** The Playwright configs from `@lowdefy/e2e-utils` and `@lowdefy/block-dev-e2e` tie the server to the Playwright run, so a killed or timed-out run leaves no server behind.
  - **`startServer`** from `@lowdefy/e2e-utils/startServer` builds and starts an app's e2e server for other test runners (a vitest or Jest `globalSetup`) and scripts, tied to the calling process, and returns `stop()`.
  - **`@lowdefy/e2e-utils` no longer reuses a running server by default.** A server left on the port would serve an old build to new tests. Set `LOWDEFY_E2E_REUSE_SERVER=true` to reuse one (for example after `pnpm e2e:server`), and `LOWDEFY_E2E_PORT` to move a run to another port.
  - **`lowdefy hub ps`** lists the Lowdefy servers running on the machine and the process that owns each. **`lowdefy hub prune`** lists the servers whose owner is gone, and `--kill` stops them. It also finds servers kept running by a `lowdefy` CLI whose own starter was killed (such as a `pnpm exec` wrapper killed outright) and servers left running by older Lowdefy versions (including a dev server's Vite process left behind by a killed dev server), and never stops a server whose owner is alive and still has its own starter, or one run as a launchd or systemd service. Servers record themselves in `~/.lowdefy/servers` (moved by `LOWDEFY_HOME`), and the hub prunes servers whose owner is gone each time it starts. On Windows, servers are identified by their process creation time, so `prune` works there for servers that record themselves.

- 99c9dac: feat: `lowdefy build` and `lowdefy dev` build again to run newly installed plugins' rules, and `--skip-plugin-checks` skips plugin rules for one run

  - When a build uses a plugin that is not installed yet, its build check rules cannot run. `lowdefy build` and `lowdefy dev` now install the plugin and run the Lowdefy build once more, so its rules run on a fresh checkout or CI run. The second build runs only when a newly installed plugin owns a block, action or operator type or ships `./checks`. The Vite client build still runs once.
  - An unknown `~ignoreBuildChecks` slug is a warning while some plugin's rules are not installed, and an error once every rule is known.
  - `--skip-plugin-checks` on `lowdefy build`, `lowdefy dev` and `lowdefy journeys scope` skips every plugin build check rule for that run, and each build logs a warning that they were skipped. No second build runs for newly installed plugins. Built-in build checks still run. Use it while a fix ships for a plugin rule that is wrong or too strict.

### Patch Changes

- 99a4f35: Update dependencies to releases with published security fixes.

  - `axios` 1.20.0 in the CLI and AxiosHttp.
  - `dompurify` 3.4.16 in `block-utils`, `blocks-basic` and `blocks-markdown`.

  **`dompurify` 3.4.16** keeps the SVG `pointer-events` and `vector-effect` attributes, which earlier releases removed. HTML rendered by `Html`, `ClickableHtml`, `DangerousHtml`, `DangerousMarkdown` and other `renderHtml` properties may keep them.

- d7b2029: chore: Update the MCP SDK to 1.31.0 and `@hono/mcp` to 0.3.2.
- 34040e9: fix(cli): Install and build workspace plugins before the server that links to them

  Inside a pnpm workspace the generated server installs as its own workspace, and each `workspace:` plugin becomes a `link:` to its folder in the parent workspace. pnpm neither installs a link target's dependencies nor runs its build scripts, so on a fresh checkout, such as a Vercel or CI build, a plugin built by its `prepare` script had no `dist` and the Lowdefy build failed with `Cannot find module …/dist/types.js`. Before installing the server, the CLI now installs the plugins it links to in the parent workspace, with their workspace dependencies (`pnpm install --frozen-lockfile --filter <plugin>...` at the workspace root), which installs their dependencies and runs their build. The parent's lockfile is never rewritten: when it is out of date the install fails and names the workspace to run `pnpm install` in. This runs only when the server installs, as before, so a dev server that is already installed does not rebuild its plugins on every start.

- fd3c3aa: `lowdefy_build_status` takes `wait: true` (`GET /lowdefy-docs/build-status?wait=true`): it answers once the dev server has processed your latest edits — the rebuild or page invalidation they trigger, and any server restart or plugin install they need (a new connection type, a new plugin package, a `.env` change) — instead of with the build before them. After `lowdefy_restart`, the same call waits for the restarted server to be ready. One call returns the result of the edit the agent just made, with no polling. It waits up to a minute and says `settled: false` if it gives up. The MCP instructions, `lowdefy agent-setup` guidance and docs tell agents to call it this way after every edit.
- ebf95f8: fix(server-dev): Cheaper rebuilds and restarts in the dev server

  - **Restarts no longer fail with "Port in use".** A restart now waits for the old server process to exit before it starts the new one (up to 10 s, then a forced stop and up to 5 s more), so the new process never finds the port still taken and the server no longer stays down until the next restart.
  - **No more endless rebuild loop.** An app whose own local plugin package is its config directory (its plugin lives next to `lowdefy.yaml`) rebuilt itself every few seconds when its ref resolvers wrote into `public/`. The local plugin watcher now reacts only to code files (`.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx`, `.json`) and ignores `public/`, `node_modules` and the build directories. YAML and Markdown edits stay with the config watcher, so a page edit no longer runs a full build as well.
  - **Page builds no longer rewrite the whole key maps.** Every page the dev server built rewrote `keyMap.json` and `refMap.json` twice, and the files only grew (tens of MB on large apps, with a full parse after each edit). They now hold only what the config build wrote; each page build writes the keys it added to a small file under `build/jitMaps/`. Error locations, `/lowdefy-docs/find` and the file watcher read those files. A key from a page built before the last two page edits may resolve without a location.
  - **Unchanged build files are left alone.** After a config build, artifacts whose bytes did not change are no longer replaced, so Vite does not reload modules that did not change.
  - **Agents restart less.** The MCP tools and agent guidance now say to restart the dev server only when it seems stuck or build status looks stale, or after secrets a wrapper injects have changed. `.env` edits and local plugin code are picked up without a restart.

- 51a6dcb: Fetching the server no longer deletes files in the server directory that are not part of the server. `lowdefy build --server-directory <dir>` replaced the whole directory, so a Vercel deploy directory lost its own build scripts and the build step failed with `vercel.build.sh: No such file or directory`. The server's files now replace their namesakes one by one, `package.json` last, and everything else stays.
- 25bcc87: fix(cli): The CLI checks the server package it downloads from npm against the registry's integrity hash, and extracts it with `tar` instead of `decompress`.

  `decompress` 4.2.1 has a published path traversal vulnerability with no fixed release: an archive entry could be written outside the target directory. The server tarball is now checked against `dist.integrity` before it is extracted, and an entry that would land outside the server directory fails the install instead of being written.

- 575a5ee: feat(blocks-basic)!: `ClickableHtml` fires only the events its `dataEvents` property lists.

  **Breaking:** a `data-event` in a `ClickableHtml` block's HTML now fires its event only when the
  block's new `dataEvents` property lists that event. A block without `dataEvents` fires no events
  from its HTML, and a click on an unlisted `data-event` does nothing and logs a console warning.
  Until now any `data-event` in the HTML fired the block event it named. HTML is often built from
  request or user data, and sanitising keeps `data-*` attributes, so the block now has the author
  say which events its HTML may fire.

  ```yaml
  - id: rows
    type: ClickableHtml
    properties:
      dataEvents:
        - onEdit
        - name: onDelete
          confirm: Delete this row?
      html: ...
  ```

  An entry is an event name, or `{ name, confirm }`. With `confirm`, every click on the event asks
  first whatever the markup says: `confirm: true` uses the element's `data-confirm` message or "Are
  you sure?", and a string is the message. Any `confirm` other than `false` asks, so an empty or
  missing message still asks, with the default message. Unlisted targets are no longer made keyboard
  focusable.

  To migrate, run `lowdefy upgrade`: the `clickable-html-data-events` codemod adds `dataEvents` to
  each `ClickableHtml` block and reports HTML built from data that inserts values without escaping
  them. `ClickableHtml` blocks that `Dynamic` content builds at page load, from config stored outside
  the app's files, need `dataEvents` added where that config lives. The docs now state that HTML
  built from user or request data must escape that data.

  `HtmlComponent` in `@lowdefy/block-utils` takes the list as its `dataEvents` prop, next to
  `onDataEvent`, and applies it inside popover content too.

- 2ef077f: fix: `lowdefy dev` works with `config.basePath`, dev warns about inline page links, and the agent docs are complete

  - `lowdefy dev` now boots an app that sets `config.basePath`. The dev server used to answer `<basePath>/@vite/client` and the client entry with the page HTML, so the app never loaded. The app, its API and the `/lowdefy-docs` agent tools are all served under the base path (`/app/lowdefy-docs` for `basePath: /app`), and `.lowdefy/instance.json` records the URL with the base path, so `lowdefy mcp`, the hub and `lowdefy test` reach the dev server without extra setup. The dev server also reports itself ready and opens the browser at the base path.
  - `lowdefy dev` now reports the same warnings as `lowdefy build` for pages written directly in `lowdefy.yaml`: a `Link` to a page that does not exist, a `CallAPI` to a missing or `InternalApi` endpoint, websocket and dynamic block references, and `_state`, `_payload` and request state references. Before, only pages in their own `_ref` files were checked in dev.
  - `@lowdefy/docs-content` holds 20 pages it was missing, among them theming, blocks, page and app state, roles, auth configuration, websockets and notifications. The extractor now renders docs pages written as `_nunjucks` templates, and the content is regenerated from the current docs. The docs site's notifications, AxiosHttp and v3-to-v4 migration pages now show their `{{ ... }}` template examples instead of dropping them; the notifications page failed to render before.

- 588344b: feat: Dev tools build status and request runner report the config you just edited

  The dev server builds a page only when it is requested, so agent tools could answer from a page's previous build after an edit. They now tell the truth about pages built on request:

  **Build status (`lowdefy_build_status`, `GET /lowdefy-docs/build-status`)**

  - With `wait: true`, build status builds every page your edit touched before it answers, whether or not anything has opened the page since. A new `pages` section lists the pages it built (`checked`), the pages whose last build failed with their errors and source file (`failed`), pages changed on disk that the dev server has not rebuilt (`changedSinceBuild`), and how many pages nothing has built since the dev server started (`unbuilt`).
  - Browser and server errors carry the build they happened under (`buildId`). Errors reported before the latest config build or page edit are listed apart under `earlierErrors`, so errors that may already be fixed no longer read as live.
  - A build that fails with an internal error now reports the error's message, stack and the config file being resolved, instead of only "Build failed due to internal error. See above for details."

  **Request and endpoint runners (`lowdefy_run_request`, `lowdefy_run_endpoint`)**

  - `lowdefy_run_request` builds the page first when it changed since its last build, so it runs the request in the config now rather than the page's previous build. A page that fails to build is refused with its `buildErrors`, and a result from a page whose edit the dev server has not picked up yet carries a `staleConfig` note.
  - A response over 40,000 serialized characters is no longer cut to a string prefix. It is written in full to a JSON file under `.lowdefy/responses/` in the app directory, and the result carries `responseFile`, `responseChars` and, for an array, `responseItems`. The new `saveResponse: true` option writes any response there. Only the 20 most recent response files are kept.

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

- 239a3a7: feat: dates, numbers, avatars, copy buttons, truncation, text tones and confirmations in HTML.

  - **Dates.** `<time datetime="…" data-time="relative">` shows "3 hours ago" and keeps it current, with the exact time on hover. `date`, `datetime` and `time` use the app's locale, and any other value is a dayjs format. Dates show in the reader's time zone.
  - **Numbers.** `data-format` formats the element's number as `number`, `currency` (with `data-currency="USD"`), `percent`, `compact` or `bytes`, with the same formatting as the ag-grid `number` cells; `data-decimals` fixes the decimals.
  - **Avatars.** `data-avatar="Jane Doe"` renders initials in a theme colour, the same as the ag-grid `avatar` cells, and on an `<img>` replaces a missing or broken image. No image service is called.
  - **Copy.** `data-copy` adds an accessible copy button for the element's text or the attribute's value. The copy and check icons are always bundled, and the labels are the new `client.copy`, `client.copyValue`, `client.copied` and `client.copyFailed` translation keys.
  - **Truncation.** `data-truncate` (or `data-truncate="3"`) clamps text to 1–6 lines with an ellipsis and shows the full text in a tooltip only when it is cut off, the same clamp as the ag-grid `ellipsis` columns.
  - **Text tone.** `data-tone="secondary"` (also `tertiary`, `quaternary`, `success`, `warning`, `error`, `info`) colours text with theme tokens that follow dark mode.
  - **Confirm.** In `ClickableHtml`, `data-confirm="Delete this row?"` on a `data-event` element opens a themed confirmation first; only OK fires the event, once. Focus moves to Cancel and returns afterwards, and Escape cancels. A change to the HTML closes it without firing. A bare `data-confirm` asks the new `client.confirm` message ("Are you sure?").
  - **Keyboard.** Space now activates focusable `data-event` targets and popover triggers on key up, like a native button.

- 49490b6: feat: in-app links and status tags in HTML.

  - **Links.** In any HTML string, `<a data-page-id="contacts" data-url-query="_id=42">` links to an app page: Lowdefy sets the `href` (with the app's `basePath`), and a plain click opens the page without reloading the app, like a `Link` action. `data-link` does the same for an existing app-relative `href="/path"`; a `data-page-id` or `data-link` that does not resolve to a page of the app is left as written. `data-new-tab` opens any link in a new tab (sanitising removes `target`, so `target="_blank"` never worked in HTML). The build warns when a `data-page-id` in page config or in an API endpoint names a page that does not exist, with a suggestion for a likely typo.
  - **Status tags and dots.** `<span data-tag="success">Approved</span>` renders a tinted tag and `data-status="warning"` a status dot, in theme colours that follow dark mode. Values are antd status names and preset colours, CSS colours, or any other value, which picks a stable colour. HTML tags look exactly like the ag-grid `tag` cells: both now use the same formatting code in `@lowdefy/block-utils`.
  - **Docs.** A new HTML attributes page describes every attribute HTML understands, and the Html block's schema, hazards and examples teach agents to use them instead of hard-coded hrefs and inline-styled pills.

- a79fb1d: feat: semantic icon names, and icons, tooltips and popovers in HTML.

  - **Semantic icon names.** Anywhere an icon name is accepted you can now write a name like `edit`, `delete`, `warning` or `external-link` (67 built-in names plus Ant Design spellings like `plus` and `setting`). They map to Lucide icons, so apps look consistent without picking a pack per icon. Add or override names with `theme.icons.aliases` in `lowdefy.yaml`, and list icon names that only exist at runtime under `theme.icons.include`. Existing React Icons names work exactly as before, and the build still bundles only the icons your config uses.
  - **Icons, tooltips and popovers in HTML.** Every block that renders HTML (`Html`, `ClickableHtml`, `DangerousHtml`, and HTML properties such as Tooltip and Card titles) understands `<i data-icon="edit"></i>`, `data-tooltip="Text"`, and `data-popover="id"` with a matching `data-popover-content="id"` element. Tooltips and popovers use the app's antd theme and load on first use. An open popover stays open with its new content when the HTML changes, as long as the new HTML still has its trigger. In `ClickableHtml`, `data-event` targets are now keyboard focusable (Enter and Space click them), and a `data-event` inside a popover fires and closes it.
  - **Icon fixes.** Icons no longer remount on every parent render, an icon that failed recovers when its name changes, and a clickable `Icon` block is keyboard focusable.
  - **Agents.** The dev server adds `lowdefy_search_icons` and `GET /lowdefy-docs/icons?q=`, and the agent setup files explain the icon and HTML conventions.

- 5e6bed8: New dev MCP tool `lowdefy_check`: validates the whole app the way `lowdefy build` would, without building it — every page, including ones not yet opened in dev, and the checks `lowdefy dev` only warns about but a production build rejects (they come back as errors with `prodError: true`). Returns `ok` plus located errors and warnings. It runs in a separate process so it never disturbs the running dev server, and it writes nothing. Agents call it before saying a change is done, so "works in dev, fails the deploy" is caught in the session.

  `@lowdefy/build` gains the `validateOnly` build option (every validation runs, nothing is written) and a `check()` entry on `@lowdefy/build/dev`. It adds no new build rules: `lowdefy_check` reports exactly what `lowdefy build` already rejects.

- a9442cc: Production pages load only the plugin code they use.

  The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

  - The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
  - Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
  - Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
  - The build adds the types a page runs without naming them: the operators the `_js` accessors call, and the actions and operators a block runs for events it registers itself (such as `Request` in `Upload` or `SetLocale` in `PageHeaderMenu`), which blocks list in `meta.actions` and `meta.operators`. Plugin blocks that register their own events should list them the same way.
  - A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

  No config changes. The dev server is unchanged.

- 7623c86: The server resolves each request's client address itself, and a new `config.trustedProxies` setting names the proxies it believes.

  - Auth rate limits (sign-in and sign-up: 3 attempts per 10 seconds per address), the session's recorded address and the captcha check use the address the server resolved, not the `X-Forwarded-For` header a client sent. A self-hosted server takes the address from the connection. Behind a reverse proxy, load balancer or ingress, every connection comes from the proxy, so list its addresses or CIDR ranges in `config.trustedProxies`; the server then reads `X-Forwarded-For` from the right, skips trusted hops and takes the first untrusted address. Without it every client shares the proxy's rate limits. The server logs a warning the first time a request carries `X-Forwarded-For` while `trustedProxies` is not set.
  - On Vercel the function entry `lowdefy vercel-output` writes takes the address from `x-real-ip`, which the platform sets on every request.
  - The production request and error logs record the resolved address as `client_address`.
  - `lowdefy build` fails when a `config.trustedProxies` entry is not an IP address or CIDR range.
  - In `lowdefy test` journeys, each actor keeps its own client address.

- 5d8681b: fix(cli): The Vercel function entry keeps every `Set-Cookie` header and survives dropped requests.

  - A response with several `Set-Cookie` headers, such as a sign-in that sets the session cookie and clears another, reached the browser with only the last one.
  - A client that disconnected while its request body was read stopped the whole function process, and every other request it was serving, with an unhandled `aborted` error. The entry now answers a failed request with a 500, or closes it when the response had started.

- 382246b: fix(cli): `lowdefy vercel-output` honours `config.basePath`. The static client was placed at the root of the deployment while its HTML asks for `<basePath>/assets/*`, so an app with a base path served no scripts, styles or public files on Vercel. Static files are now placed under the base path, the immutable cache route for hashed assets matches under it, and the generated cron jobs call `<basePath>/api/cron/*`, where the app mounts its routes.
- 4a6cf77: The Vercel function `lowdefy vercel-output` generates stops a `GET` stream, such as an MCP client's notification stream, when its client disconnects, instead of reading it until `maxDuration`. Other responses, such as an agent run, still run to the end. Websocket upgrade requests now get the protocol and host from Vercel's forwarding headers, like every other request, so `context.origin` is the deployment's `https://` origin on websocket connections too.
- 712d6ef: fix(server,cli): The Vercel function now starts the same way as the Node server. The function entry that `lowdefy vercel-output` generates skipped two startup steps that only ran on the Node server:

  - **Sentry**: server-side Sentry now runs on Vercel. Before, with `SENTRY_DSN` set every server error was logged but never reached Sentry; only browser errors did. Sentry is initialised before the app loads, follows the `logger.sentry` settings (`server: false`, `environment`, `tracesSampleRate`), and logs `Sentry enabled: server` on a cold start. On Vercel it reports errors only, with Sentry's light SDK (`@sentry/node-core/light`: no tracing, OpenTelemetry set-up or module loader hooks, which would add about 300 ms and 130 MB to each cold start), and with client reports off. Set `logger.sentry.serverTracing: true` to trace server requests on Vercel. The flush of queued events starts once the response closes and is handed to Vercel's `waitUntil`, so a request that captured nothing ends right after its response, and one that captured an error, or whose transaction tracing sampled, waits only for that upload. Without `SENTRY_DSN` nothing changes.
  - **Environment guards**: `config.environments.<name>.guards` are now checked again when a Vercel function starts, as the docs already said. A deployment whose runtime variables differ from the build's, for example one built with `vercel build` and deployed with `--prebuilt` or `--env`, now fails every request with the guard error instead of serving with the wrong variables.

  Both entries now share one startup module (`src/initServer.js` in the server), so they stay in step. Redeploy to pick it up; the function entry is regenerated on every build.

- 83cdc16: fix(cli): Websockets connect on Vercel. The function entry that `lowdefy vercel-output` generates exported a request handler that ran the Hono app without the upgrade hooks `@hono/node-server` provides, so every `/api/websocket` request failed with a 500 (`Cannot read properties of undefined (reading 'Symbol(WAIT_FOR_WEBSOCKET_SYMBOL)')`) and page subscriptions timed out. The entry now exports a Node HTTP server, which Vercel's Node runtime serves with WebSocket upgrades (Fluid compute): upgrades go through `@hono/node-server`'s WebSocket support, and every other request still goes through the handler that buffers the request body before running the app.
- 31911e7: fix: On Windows, `lowdefy dev` skips ports Windows will not bind

  On Windows, ports in an excluded range (reserved by Hyper-V, WSL or Docker) refuse to bind with `EACCES`. The port check threw on that error, so `lowdefy dev` failed to start when its port or the internal port after it fell in such a range. A port that cannot be bound now counts as taken, and the next free one is used.

- Updated dependencies [14c4764]
- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [d12c7cc]
- Updated dependencies [cad92af]
- Updated dependencies [4d08b55]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [d42f420]
- Updated dependencies [ebf95f8]
- Updated dependencies [24383b5]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [09717e8]
- Updated dependencies [2baefc1]
- Updated dependencies [662eaa9]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [c744e40]
- Updated dependencies [239a3a7]
- Updated dependencies [4cc0f36]
- Updated dependencies [ef64856]
- Updated dependencies [cb0acad]
- Updated dependencies [9a92898]
- Updated dependencies [0205b5a]
- Updated dependencies [316f5be]
- Updated dependencies [ba86509]
- Updated dependencies [f9d8520]
- Updated dependencies [e5b2f83]
- Updated dependencies [da76905]
- Updated dependencies [1766343]
- Updated dependencies [9ed1386]
- Updated dependencies [73c5e14]
- Updated dependencies [c3e0d79]
- Updated dependencies [959ec32]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [ae3541c]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
- Updated dependencies [99c9dac]
- Updated dependencies [7623c86]
- Updated dependencies [31911e7]
  - @lowdefy/node-utils@7.0.0
  - @lowdefy/helpers@7.0.0
  - @lowdefy/ajv@7.0.0
  - @lowdefy/errors@7.0.0
  - @lowdefy/logger@7.0.0

## 6.1.0

### Minor Changes

- d1bd356: feat: Deployment environments declared once under `config.environments`.

  Everything that differs between an app's deployments — its URL, cron forwarding, the email delivery filter, the Sentry environment — is now declared in one place, and each deployment names the environment it is with the `LOWDEFY_ENVIRONMENT` variable (read at build time):

  ```yaml
  config:
    environments:
      prod:
        url: https://app.example.com
      staging:
        url: https://staging.example.com
        cron:
          secret: STAGING_CRON_SECRET # staging's CRON_SECRET, set on prod
        email:
          filter:
            replaceAddress: team+staging@example.com
  ```

  The current environment supplies the defaults:

  - **`url`** — the `RenderNotification` `serverUrl` (email links and logos) and the auth base URL (`AUTH_URL`) default to it; an explicit value still wins. The dev server always uses the request origin, even with a `LOWDEFY_ENVIRONMENT` that names a deployed environment.
  - **`cron`** — the current environment registers its own schedules. The environment Vercel fires crons on (one without a `cron.secret`) also registers the schedules of every environment with a `cron.secret` and forwards them to that environment's `url`. `cron.enabled: false` registers nothing for an environment. Endpoint `schedules` keyed by environment work as before; the dev server with no current environment runs the `default` schedules.
  - **`email.filter`** — applied to every `SMTPMailSend` and `SendGridMailSend` request unless the connection sets a `filter` of its own with at least one field; an unset connection filter, or one whose fields all resolve to `null`, falls back to it, and the new `filter: false` turns filtering off for a connection, the environment's too (for mail such as invites that must reach the real recipient). Connection resolvers now receive the current environment as `environment`. Auth emails are not filtered.
  - **Logs** — every server log line carries `environment`; the app metadata gains `environment` (`_app: environment`); `logger.sentry.environment` defaults to the environment name.
  - **Switches** — `cron.enabled`, `email.enabled` and `sentry.enabled` set to `false` turn that feature off in one environment: no crons registered or forwarded, no email sent by `SMTPMailSend`/`SendGridMailSend` (each message reports `disabled: true`; auth emails still send), no Sentry on server or client. The switched-off features are listed in the app metadata as `disabled` (`_app: disabled`). Logging has no switch.
  - **Guards** — `guards.secrets` (Lowdefy secret names) and `guards.env` (environment variable names) map to a regular expression the value must match in that environment; the build fails before deploy when a guarded value is unset or does not match, and the production server checks again at startup, so changing it (the prod database URI, say) also takes a config change. Unknown guard kinds fail the build. Values are never printed, and only the current environment's guards are kept, in the server-only `config.json`.

  `cron.secret` is the **name** of a Lowdefy secret, a plain string — not a `_secret` operator.

  - **Browser exposure** — environment settings stay on the server. The client learns only the current environment's name and switched-off features (`_app: environment`, `_app: disabled`); `build/config.json` is no longer bundled into the client (the auth client reads the base path from Vite's `BASE_URL`), and a test allowlists the build artifacts client code may import.

  The new [Deployment environments](https://docs.lowdefy.com/deployment-environments) docs page covers every setting.

  `config.environment` can name the current environment in config for a deployment that sets no `LOWDEFY_ENVIRONMENT`; the variable always wins. With environments declared, the current environment must be one of them, and a production build without one fails (the dev server warns). An `email.filter.regex` that is not a valid regular expression fails the build.

  **Replaces `config.cron.environments` (6.0):** a build with `config.cron` fails with the migration — move the environments to `config.environments`, each `secret` to `cron.secret` and `enabled` to `cron.enabled`, give production its `url`, and set `LOWDEFY_ENVIRONMENT` on each deployment.

### Patch Changes

- 1d3a0b8: Update dependencies to releases with published security fixes.

  - `hono` 4.13.5 and `@hono/node-server` 2.0.10 in the servers.
  - `ws` 8.21.0 in the servers; `postcss` 8.5.23 in the dev server.
  - The servers drop leftover Next.js-era dependencies they no longer use: `@sentry/nextjs` from `@lowdefy/server`, and the `webpack` and `@next/eslint-plugin-next` devDependencies.
  - `axios` 1.18.0 in the CLI and AxiosHttp.
  - `dompurify` 3.4.13 in `block-utils`, `blocks-basic` and `blocks-markdown`.
  - `echarts` 6.1.0, `mysql2` 3.23.1, `nodemailer` 9.1.1, `uuid` 13.0.1 and `@auth/mongodb-adapter` 3.11.3 in their plugins.
  - `tar` 7.5.21 and `picomatch` 4.0.4 in the build, `js-yaml` 4.3.2 in `e2e-utils`, and `@babel/core` 7.29.6 in `block-utils`.
  - `@auth/core` 0.41.3 in the servers and `plugin-next-auth`, whose peer range is now `>=0.41.3`. `@auth/mongodb-adapter` 3.11.3 depends on the same release.

  Two of these change output an app can see:

  - **`echarts` 6.1.0** changes chart defaults. Bar, pictorialBar, candlestick and boxplot series no longer draw past the grid edge; set `containShape: false` on the axis to restore the previous look. `axis.startValue` no longer sets `min`. The second argument of a `tooltip.valueFormatter` function is now `rawDataIndex`.
  - **`dompurify` 3.4.13** keeps a few attributes and elements that earlier releases removed: `command` / `commandfor`, `<selectedcontent>`, and some SVG attributes. HTML rendered by `Html`, `ClickableHtml`, `DangerousHtml`, `DangerousMarkdown` and other `renderHtml` properties may keep them.

- Updated dependencies [6d6f8fa]
- Updated dependencies [d1bd356]
- Updated dependencies [6d6f8fa]
  - @lowdefy/helpers@6.1.0
  - @lowdefy/node-utils@6.1.0
  - @lowdefy/errors@6.1.0
  - @lowdefy/logger@6.1.0

## 6.0.0

### Major Changes

- 8a82fb0: feat!: Replace Next.js with Vite + Hono.

  Lowdefy servers no longer run on Next.js. The production server is a
  [Hono](https://hono.dev) app serving a [Vite](https://vite.dev)-built React
  client; the dev server runs Vite with the Hono app mounted as middleware,
  giving instant hot module replacement for plugin changes (~700ms instead of
  the previous 20–40s rebuild-and-restart cycle). Authentication moves from
  NextAuth v4 to the Auth.js v5 engine (`@auth/core` via `@hono/auth-js`) with
  the `auth:` YAML schema unchanged.

  **Your YAML config does not change.** `lowdefy build`, `lowdefy dev` and
  `lowdefy start` work as before.

  Breaking changes:

  - **Auth sessions invalidate once on upgrade.** The session cookie prefix
    changes from `next-auth.*` to `authjs.*` — users sign in again after the
    upgrade. Provider, adapter, callback and event configuration is unchanged.
  - **`NEXTAUTH_SECRET` is removed — rename it to `AUTH_SECRET`.** The build
    fails with a config error when auth providers are configured and
    `AUTH_SECRET` is not set. `NEXTAUTH_URL` still works as an Auth.js
    fallback, but `AUTH_URL` is the preferred name.
  - **Custom `next.config.js` files no longer apply.** Customize the client
    build with a `vite.config.js` in the server directory instead.
  - **`LOWDEFY_BUILD_OUTPUT_STANDALONE` is removed.** `lowdefy build` writes a
    complete runnable server to `.lowdefy/server` — copy that folder (or build
    in Docker) and run `node src/index.js`. See the updated Docker and node
    server deployment docs.
  - **`NEXT_PUBLIC_SENTRY_DSN` is removed.** Set `SENTRY_DSN` on the server —
    it is passed to the browser client at runtime, so rotating it no longer
    requires a rebuild. Source maps upload via `@sentry/vite-plugin` when
    `SENTRY_AUTH_TOKEN` is set.
  - **Page navigation is now client-side (SPA).** The first page load embeds
    config in the HTML; navigating fetches page config from `/api/page/*`
    without a full browser reload.

### Minor Changes

- a647873: feat: Agent feedback loop, scaffolding, screenshots, and llms.txt

  Building on the dev server docs/MCP endpoint, agents now get a full edit-verify loop and one-command project setup.

  **Feedback loop (`@lowdefy/server-dev`, `@lowdefy/build`)**

  - The dev build now persists its result to `build/buildStatus.json`, and `GET /lowdefy-docs/build-status` (or the `lowdefy_build_status` MCP tool) returns the current build errors and warnings — with source file and line — plus recent browser runtime errors. Edit config, ask what broke, fix it.
  - `GET /lowdefy-docs/page-config/{pageId}` / `lowdefy_get_page_config`: the fully built page config, or its structured build errors.
  - `GET /lowdefy-docs/find/{id}` / `lowdefy_find_config`: which yaml file (and line) defines a page, block, or request id.

  **Visual verification (`@lowdefy/server-dev`)**

  - `GET /lowdefy-docs/screenshot/{pageId}` / `lowdefy_screenshot_page`: PNG of the rendered page via headless Chromium (playwright-core), so agents can see what they built.

  **Scaffolding (`@lowdefy/server-dev`, `lowdefy` CLI)**

  - `lowdefy_scaffold_page` MCP tool creates a canonical new page file.
  - New `lowdefy agent-setup` CLI command writes `.mcp.json`, a Claude Code skill, and an `AGENTS.md` section into your project (merge-safe).

  **Docs reach**

  - docs.lowdefy.com now serves every docs page as raw markdown at `/md/{section}/{slug}.md`, plus `llms.txt` and `llms-full.txt` for AI crawlers.

- c188656: feat: Scheduled API endpoints (cron) on Vercel.

  `Api` and `InternalApi` endpoints can now declare `schedules` to run their routine on a timer:

  ```yaml
  id: purge-stale-conversations
  type: Api
  schedules:
    - cron: '0 6 * * *'
      payload: { mode: full }
    - cron: '*/15 * * * *'
      payload: { mode: incremental }
  routine:
    - id: purge
      type: MongoDBDeleteMany
      connectionId: conversations
      properties:
        filter: { updatedAt: { $lt: { _payload: cutoff } } }
  ```

  - **build**: `schedules` is validated (Vercel cron syntax, unique crons per endpoint, object
    payloads) and passed through to the endpoint artifact; a `build/schedules.json` manifest is
    emitted for scheduled endpoints.
  - **api/servers**: a new `/api/cron/*` route runs a scheduled endpoint's routine as a system context
    (no user session — `_user` is `undefined`), resolving the payload from the firing schedule via the
    `x-vercel-cron-schedule` header, and secured by the `CRON_SECRET` env var (fails closed).
  - **cli**: the Vercel deployment now uses the Build Output API. `lowdefy init-vercel` scaffolds a
    `vercel.build.sh` and a new `lowdefy vercel-output` command assembles `.vercel/output/`
    (static + one `api.func` + `config.json`), generating the `crons` array from the declared schedules
    on every deploy — nothing is committed by hand.

  This migrates how all Lowdefy Vercel apps deploy; re-run `lowdefy init-vercel` (or update the
  `deploy/` files by hand) after upgrading. Cron jobs run in UTC and are subject to Vercel plan limits
  (Hobby: daily only; Pro: per-minute).

- 7ce6e36: feat: Per-environment cron schedules, forwarded from the production deployment.

  Vercel fires cron jobs only on the production deployment, so staging and other environments never
  ran their schedules. Declare the deployment environments once and Lowdefy registers every
  environment's schedules on production, forwarding the ones for other environments to that
  environment's own `/api/cron/<endpointId>` as a fire-and-forget ping:

  ```yaml
  config:
    cron:
      environments:
        production: {} # no url: the deployment Vercel fires crons on
        staging:
          url: https://staging.example.com
          secret: STAGING_CRON_SECRET # Lowdefy secret holding staging's CRON_SECRET
  ```

  `schedules` can then be keyed by environment, with a `default` every other environment inherits and
  `[]` turning crons off — including through module vars, so a module's
  `schedules: { _module.var: tick_schedule }` needs no change:

  ```yaml
  schedules:
    default:
      - cron: '*/5 * * * *'
    staging:
      - cron: '0 * * * *'
    develop: []
  ```

  - **build**: validates `config.cron` (exactly one environment without `url`; `url` + `secret` on the
    others; `enabled: false` registers nothing), resolves keyed schedules onto every declared
    environment, and emits `schedules.json` entries with `environment` and `forward`.
  - **api/servers**: a new `/api/cron-forward/<environment>/<endpointId>` route (secured by
    `CRON_SECRET`) pings the target environment with its own `CRON_SECRET` read from
    `LOWDEFY_SECRET_<secret name>` on the production deployment (fails closed when unset) and answers
    immediately; `/api/cron/*` honours the `x-lowdefy-cron-environment` header forwarded requests carry.
  - **cli**: `lowdefy vercel-output` registers forwarded schedules as `/api/cron-forward/...` cron jobs.

  Existing apps without `config.cron` are unaffected.

- 6f87741: feat: Authenticate the dev server as a mock user for headless rendering and agent tools

  The dev server's headless renderer (used by the AI-agent screenshot and state-inspection tools) now authenticates, so auth-protected pages render instead of returning 404.

  - **New `lowdefy dev --mock-user [user]` flag** — start the development server authenticated as a mock user. Pass a JSON user object to set the identity and roles (e.g. `--mock-user '{"sub":"dev","roles":["admin"]}'`), or use the bare flag for a default user. This drives the same `auth.dev.mockUser` mechanism from the command line.
  - **Headless renderer authenticates** — the docs/MCP headless browser now carries an authenticated session, so `lowdefy_screenshot_page` and headless state inspection work on pages with `auth.public: false`. The developer's real browser session is unaffected. To render role-gated pages, configure `auth.dev.mockUser` (or `--mock-user`) with matching roles.

- 15956e0: feat: Production-grade Docker deployment.

  **Health endpoint (`@lowdefy/server`)**

  - The server now serves `GET /api/lowdefy-health` for container health checks and orchestrator probes. The endpoint skips auth, session lookup, request logging, and Sentry, so frequent probes stay out of logs.

  **Container-friendly startup and shutdown (`@lowdefy/server`)**

  - Startup and Sentry-enabled messages now log as structured JSON through pino instead of plain text, keeping stdout a uniform NDJSON stream for log collectors.
  - On SIGTERM/SIGINT the server closes websocket clients (code 1001, clients reconnect automatically), finishes in-flight requests, flushes pending Sentry events, and exits well within Docker's 10 second stop grace period.

  **New `docker-output` CLI command (`lowdefy` CLI)**

  - Assembles a minimal production runtime at `.lowdefy/docker` from a built app by tracing the server's runtime dependency graph (via `@vercel/nft`) and copying only the files the server imports. This drops the client-side block packages (already compiled into `dist/client`) and other unused dependencies from the image, cutting the shipped runtime to a fraction of the installed `node_modules`. Preserves pnpm workspace links so it works in monorepos.

  **Rewritten `init-docker` Dockerfile (`lowdefy` CLI)**

  - Pins the Lowdefy CLI to the app's `lowdefy:` version from `lowdefy.yaml`, so image builds are reproducible.
  - Runs `docker-output` after the build and copies the traced runtime into the image, so build tooling (Vite, `@lowdefy/build`, webpack) and unused runtime dependencies no longer ship in production.
  - Uses a BuildKit cache mount for the pnpm store, installs pnpm without corepack (removed from Node.js 25+), runs as the built-in non-root `node` user on `node:22-slim`, and adds a `HEALTHCHECK` against `/api/lowdefy-health`.
  - Fixed `init-docker` failing to write `.dockerignore` from the published package.

- 742a900: feat: Email notification rendering

  Lowdefy apps can now define notifications in config: branded emails rendered from framework templates, delivered over any SMTP provider. The framework renders; storing and sending are composed in YAML routines — so any database works through its normal request types, and apps or modules own the notification record.

  **`notifications:` config section (`@lowdefy/build`, `@lowdefy/api`)**

  - New root section where the template is the type: `{ id, type, properties }` with per-notification `theme` overrides and `testData`
  - Template properties are nunjucks data templates — `{{ task.title }}` interpolates against the pipeline's data with no operator syntax; interpolated values are inert (can never inject markup or links)
  - New `RenderNotification` API routine step: renders one data item per call and returns `{ subject, title, preview, html, text, data }` where `data` is the link-resolved item — inserting the record, deduplicating, sending and updating send results are plain routine steps (`:for`, requests, `_uuid`)
  - New `app.email` theme settings (logo, companyName, primaryColor, signature, footer)
  - Link resolution is driven by the step's `serverUrl`, `landingPage` and `recordId` properties: `{ pageId, urlQuery }` links resolve to direct page URLs, or through a landing page (`?_id=<recordId>&option=<dotpath>`) that can mark the record read before redirecting (for example the modules-mongodb notifications module's link page)

  **Email templates (`@lowdefy/email-templates`)**

  - Three React Email templates: `NotificationEmail` (message, metadata table, quoted comment, CTA button, action list), `DigestEmail` (item roundups) and `AlertEmail` (status-toned notices)
  - Sections render only when configured; markdown in `message` with raw HTML disabled
  - Custom templates are plain React Email plugin packages under the new `notifications` type category

  **SMTP connection (`@lowdefy/connection-smtp`)**

  - New `SMTP` connection wrapping nodemailer — works with SES, Postmark, Mailgun, Resend and self-hosted servers; `SMTPMailSend` request type
  - Environment-aware delivery `filter` (`replaceAddress` catch-all, domain `allowlist`, `regex`) applied to every send

  **SendGrid (`@lowdefy/connection-sendgrid`)**

  - Supports the same delivery `filter` and default `replyTo`; interchangeable with SMTP wherever a routine sends notification emails
  - Array requests now send per message; request-level `templateId` is no longer overridden by an unset connection `templateId`

  **Preview CLI (`lowdefy`)**

  - New `lowdefy emails` command: builds the app, generates a preview per notification from its `testData`, and opens React Email's preview server; warns when a template data key is missing from `testData`

  Builds also now validate that `CallAgent` steps reference existing agents — previously this check existed but never ran, so broken agent references that used to build will now fail with a config error.

- 51c3008: feat: Endpoint execution controls for serverless deployments.

  - `config.vercel { maxDuration, memory }` in `lowdefy.yaml` flows into the generated Vercel function config (default stays 60s).
  - `async: true` on Api/InternalApi endpoints responds `{ accepted: true }` immediately and runs the routine in the background (kept alive via the platform request context; outcome observable through logs).
  - `detached: true` on CallApi steps fire-and-forgets the target through the new `POST /api/detached/<endpointId>` route (CRON_SECRET transport auth), running it in its own invocation with a fresh duration budget.
  - `webhook: true` on endpoints turns them into third-party webhook receivers on the standard `/api/endpoints` route: raw `{ body, query, headers }` payload, verbatim response body, system context — caller auth is the routine's first step. Non-webhook endpoints are unchanged.

- 596212a: feat: `lowdefy init-vercel` instruments an app for Vercel, plus a configurable request timeout.

  **`init-vercel`** now scaffolds a complete Vercel setup into `<config-directory>/deploy/`, so a v6
  Lowdefy app (Hono server + Vite client) deploys to Vercel as static assets on the CDN plus one
  Serverless Function:

  - `vercel.json` — serves the built client (`dist/client`, which includes the app's `public/` files
    via Vite's `publicDir`) from the CDN, sets the build command (`pnpm run build:client`) and output
    directory, rewrites all other requests to the function, bundles the runtime-read build artifacts
    via `includeFiles`, and caps the function with `maxDuration`.
  - `api/index.js` — a Node Serverless Function that `chdir`s to the deploy directory, builds a Web
    `Request` from the buffered Node request body, and runs the Hono app. (Vercel's Node runtime does
    not drain a lazily-read body stream, so a streaming adapter hangs on every request with a body.)
  - `vercel.install.sh` + `README.md`.

  **Request timeout.** `@lowdefy/server`'s `createApp` now bounds request duration with a `timeout`
  middleware, configured by a new **`config.requestTimeout`** (milliseconds) in `lowdefy.yaml`
  (default `30000`, `0` disables). This protects against requests that hang on an upstream call
  (database, SMTP, external API) running to the host's function limit — important on serverless
  platforms billed by duration. Agent streaming routes are exempt. `@lowdefy/build` adds
  `config.requestTimeout` to the schema.

  `createApp` also gains a `{ serveStaticAssets }` option (default `true`); the Vercel function passes
  `false` so the CDN owns static files and the function only handles dynamic routes. Docs updated
  (deployment/Vercel and the config reference).

- 660bbfc: feat: Support running multiple dev apps side by side.

  Running several Lowdefy dev servers on `localhost` previously clashed on
  ports and shared a single auth cookie jar (browsers scope cookies by host,
  not port), so logging into one app logged you out of another. Three changes
  make concurrent dev apps work:

  - **Per-app auth cookies.** Cookie names are now resolved through a
    precedence chain: an explicit `auth.advanced.cookies` is used verbatim;
    otherwise an explicit `auth.advanced.cookiePrefix` namespaces the cookie
    names (dev and prod); otherwise the dev server derives a prefix from the
    app `slug`/`name` so each app gets its own cookie jar. Production with no
    config is unchanged (Auth.js defaults). Only cookie names are overridden —
    cookie options continue to come from Auth.js defaults via its config
    merge. The schema gains an optional `auth.advanced.cookiePrefix` string.
  - **Automatic port selection.** The CLI now finds the next available port
    instead of erroring when the requested port is in use, warning which port
    it landed on.
  - **Auth URL mismatch warning.** Auth.js derives the app origin from
    request headers (`trustHost`), so an unset `AUTH_URL` already works on
    whatever port the dev server lands on. When `AUTH_URL` (or the v4
    fallback `NEXTAUTH_URL`) is pinned to a different port, the dev server
    warns that sign-in callbacks and redirects will target the pinned URL.

  Set the same `cookiePrefix` on two apps to intentionally share an auth
  session in dev.

- fc89b99: fix: Agent tools work on auth-enabled apps, in monorepos, and keep user data out of git.

  **Agent request execution on auth-enabled apps (`@lowdefy/server-dev`)**

  - `POST /lowdefy-docs/run-request` (and the `lowdefy_run_request` MCP tool) no longer fails with `Cannot read properties of undefined (reading 'secret')` on apps with authentication configured. Reads, and writes opted in via `cli.agentTools.allowWriteRequests`, now execute the same way app requests do. Calls without a session cookie run as an anonymous visitor.
  - `.env` changes now restart the dev server with the updated values — previously changed variables kept their old values until a full dev server restart.

  **State checkpoints are no longer committable (`@lowdefy/server-dev`)**

  - State checkpoints are written to `.lowdefy/state-checkpoints/<name>/` instead of `checkpoints/<name>/` in the app directory. Checkpoints capture the signed-in user's data and recorded backend responses, so they now live in the conventionally gitignored `.lowdefy` folder — this also stops checkpoint writes from triggering rebuilds.

  **`agent-setup` supports monorepos (`lowdefy` CLI)**

  - `lowdefy agent-setup` now writes `.mcp.json`, the Claude Code skill, and agent instructions at the project root (nearest ancestor with `.git`) so coding agents launched from the repo root discover them. Generated instructions point at the app subdirectory (e.g. `cd apps/myapp && pnpm dev`).
  - When the project root already has a `CLAUDE.md` and no `AGENTS.md`, the Lowdefy section is appended to `CLAUDE.md` instead of creating a competing instructions file.
  - A new `--project-directory` option overrides root detection. Single-app repos are unchanged.

  **Operator REPL (`@lowdefy/server-dev`)**

  - `POST /lowdefy-docs/eval-operator` accepts `operator` as an alias for the `expression` body key, and returns a clear error naming the expected key when it is missing.

### Patch Changes

- 082acec: chore: Bump `yaml` to 2.9.0, clearing vite's `yaml@^2.4.2` peer warning.
- 59190b5: Refresh dependencies and require Node.js 22 or newer.

  Updated a range of libraries across the project to current versions (including the MongoDB driver, the
  MQL/aggregation engine, and various build and CLI tooling) and set the minimum supported Node.js version
  to 22, matching what is tested in CI. Most changes are internal with no effect on your app. One small
  behaviour note: in `_mql` expressions, adding to a missing or null field now returns `null` (matching
  MongoDB) instead of `NaN`.

- 082acec: feat: Dev DX quick wins — fast warm boots, no mid-session reloads.

  - `lowdefy dev` no longer resets the server `package.json` at boot, so plugin
    packages discovered by previous sessions stay installed — no more
    uninstall/reinstall churn, no install pause when navigating to pages whose
    plugins were already known, and a stable lockfile that preserves Vite's
    dependency optimizer cache across sessions.
  - Installs are skipped entirely when `package.json` is unchanged (hash stored
    inside `node_modules`, so deleting `node_modules` forces a reinstall). Warm
    boots drop from ~30s to a few seconds.
  - The dev server pre-discovers all client dependencies at startup
    (`optimizeDeps.entries`), eliminating mid-session "optimized dependencies
    changed" full page reloads.
  - Tailwind scan inputs are excluded from Vite's watcher — first visits to a
    page no longer force a full browser reload that aborts in-flight requests
    ("Failed to fetch" error walls). CSS recompilation is driven by the
    `tailwind-candidates.css` import, now touched only when a build actually
    changes tailwind content.
  - Build artifact writes skip byte-identical content, so unchanged JIT page
    builds no longer invalidate `clientJsMap.js` (Routing HMR churn) or
    `serverJsMap.js` (SSR graph reloads). New `writeFileIfChanged` and
    `installIfPackageJsonChanged` utilities in `@lowdefy/node-utils`.
  - Polish: dev server shutdown log no longer says "next server"; the missing
    `./messages` plugin export notice logs once per process instead of on every
    rebuild.

- 58ae85e: feat: Email branding defaults from app config, and relative logo paths.

  Notification email branding (`app.email`) now inherits from your existing app config when not set explicitly:

  - `companyName` defaults to the app's root `name:`. Note this means apps with a `name:` now render a company name header in emails by default — set `companyName: ''` to opt out.
  - `primaryColor` defaults to `theme.antd.token.colorPrimary`, so branded apps get brand-colored email buttons without repeating the color.

  The email `logo` can now be an app-relative path to a `public/` asset (for example `logo: /logo-light-theme.png`). It resolves against the `serverUrl` passed to the `RenderNotification` step, so one config works across environments. When no server URL is available — including the `lowdefy emails` preview — the logo is omitted and the header falls back to the `companyName` text instead of a broken image.

- 7f49378: feat: Annotation helper — point, draw, copy, and paste feedback to your agent

  Press **Cmd+/** (macOS) / **Ctrl+/** (Windows/Linux) on any page of your running dev app: an overlay appears where you hover-highlight blocks, click to select, draw rectangles/arrows/freehand, comment, and batch several annotations. No browser extension — it's injected by the dev server.

  Hitting **Copy** puts an agent-readable feedback block on your clipboard, **each annotation enriched with the blockId and the exact yaml file and line that defines it**, plus drawn geometry and, by default, **an annotated PNG screenshot of the page with your drawings on it** (saved under `.lowdefy/annotations/`, path included in the block — untick "Include annotated screenshot" to skip). Paste it into whichever agent session you want. Press Enter to drive the primary action (save annotation, then copy).

  Also:

  - `lowdefy_screenshot_page` gains `clip` + `scrollX`/`scrollY` params to capture exactly an annotated region.
  - New reserved dev route prefix: `/lowdefy-feedback` (the overlay's enrichment endpoint).
  - The generated AGENTS.md and Claude Code skill (`lowdefy agent-setup`) teach agents to recognize pasted feedback blocks.

- 206d947: feat: Modules can ship notification email templates.

  `module.lowdefy.yaml` now accepts a `notifications:` section, so a module that drives a notification flow (like user invites) can ship its own email templates instead of every app hand-writing them. Template ids scope to `{entry}/{id}` — installing the same module twice never collides — and template properties resolve `_module.var`, so email copy can be configured through the module's vars.

  The new `_module.notificationId` operator resolves scoped ids in module content (`_module.notificationId: invite-user` in a `RenderNotification` step or dispatch payload) and at the app level with the object form (`{ id: invite-user, module: user-admin }`).

  The `lowdefy emails` preview now finds scoped notification artifacts in subdirectories and writes nested preview shims, grouping templates by module entry in the preview sidebar.

- 6446ae6: fix: Fix dynamic page navigation and dev server port detection.

  - **lowdefy (CLI)**: Port availability checks now probe loopback addresses (`127.0.0.1`, `::1`) in addition to the wildcard bind, so `dev`/`start` no longer report a port held by another local process as free.
  - **@lowdefy/client**: Fixed a blank page that could appear when navigating to a page with server-resolved dynamic content — the page config is now memoized correctly and the page tree remounts when new dynamic content is resolved.
  - **@lowdefy/helpers**: Added `getOperatorType`, a small shared utility for detecting operator objects in config.
  - **@lowdefy/node-utils**: Added `findAvailablePort` and `isPortAvailable` utilities (moved from the CLI) for reuse across dev tooling.

- 49ad033: fix(server-dev): Annotations now work over open modals, plus an annotate hint on dev server startup.

  - The annotation overlay is now rendered into the document body, so its comment box stays clickable and typeable even when a modal is open on the page.
  - On startup the dev server now prints a notice box for coding agents: the docs & MCP endpoint URL with the `lowdefy agent-setup` command to connect an agent, and the Cmd/Ctrl+/ annotation shortcut.
  - `lowdefy agent-setup` now enables the `lowdefy-docs` MCP server in the committed `.claude/settings.json`, so everyone on the project has it approved without a prompt.

- Updated dependencies [da0c62c]
- Updated dependencies [37c8c14]
- Updated dependencies [082acec]
- Updated dependencies [6446ae6]
- Updated dependencies [c9bea1c]
  - @lowdefy/logger@6.0.0
  - @lowdefy/errors@6.0.0
  - @lowdefy/node-utils@6.0.0
  - @lowdefy/helpers@6.0.0

## 5.6.0

### Patch Changes

- 3ead269: feat(helpers): Reject prototype-pollution key names in dot paths and key maps.

  `__proto__`, `constructor`, `prototype`, `__defineGetter__`, `__defineSetter__`,
  `__lookupGetter__` and `__lookupSetter__` are no longer accepted as path segments or as keys
  in maps built from user-supplied values.

  Previously these names were silently _filtered_ on write, which was worse than rejecting
  them: `SetState: { 'a.__proto__.b': 1 }` quietly wrote to `a.b` instead — a different
  location than the one you asked for. Reads could also walk up the prototype chain.

  What you will see now:

  - `:set_state` and the `SetState` action raise a config error naming the offending key and
    pointing at the line in your YAML.
  - Data-reading operators (`_state`, `_get`, `_user`, `_payload`, ...) return their default
    instead of a value.
  - A module entry id, an agent or endpoint id, or a `LOWDEFY_SECRET_*` environment variable
    using one of these names now fails at build or boot with a message naming it, instead of
    silently vanishing.

  Apps that do not use these names are unaffected. If you have a form field, state key, or API
  response property named `constructor`, rename it.

  Deep merges of configuration are hardened the same way, but skip reserved keys rather than
  raising — a reserved name arriving inside a merged _value_ is dropped so a single poisoned
  field can't abort an otherwise valid merge.

  `@lowdefy/helpers` also now exports `isReserved(key)`, so plugin and connection authors can
  test a key against this policy directly instead of catching a `ReservedKeyError`.

- b09ad62: fix: Allow dependency build scripts via pnpm-workspace.yaml so installs succeed on pnpm 11.

  `lowdefy dev` and `lowdefy build` failed with `Dependency installation failed.` on pnpm 11 (`ERR_PNPM_IGNORED_BUILDS`), because dependency build scripts (sharp, better-sqlite3) were only allowed via the `pnpm.onlyBuiltDependencies` field in the server package.json — a field pnpm no longer reads (and strips at publish), while pnpm 11 turns ignored build scripts into a hard install error. The CLI now writes a `pnpm-workspace.yaml` with the build allowlist into the server directory before installing, covering pnpm 9 (`packages`), pnpm 10 (`onlyBuiltDependencies`), and pnpm 10.29+/11 (`allowBuilds`). An existing file is never overwritten, so users can extend the allowlist for their own plugins' native dependencies. When the app lives inside a pnpm workspace (e.g. `apps/*/.lowdefy/*` in the workspace globs, plugins pinned as `workspace:*`), the CLI writes nothing — the server installs as part of the parent workspace, where isolating it would break `workspace:*` plugin resolution and the root's `overrides`/`packageExtensions`, and build allowlists belong in the workspace root's `pnpm-workspace.yaml`. `lowdefy-e2e init` used the same dead mechanism for mongodb-memory-server and now writes the same allowlist to `pnpm-workspace.yaml` (the workspace root's if the app is inside a workspace, otherwise a new file in the app directory). The dead `pnpm` fields were removed from the server packages. Fixes #2191.

- 824f4be: fix(helpers): Dot paths resolve own properties only, and prefer a nested match to a literal dotted key.

  A key that contains dots still resolves without escaping, at every depth. `_url_query:
my_object.subfield` against `?my_object.subfield=x` reads as before, and a JWT `claimMapping` of
  `resource_access.com.example.api.roles` against `{ resource_access: { 'com.example.api': { roles:
['admin'] } } }` still returns `['admin']`. **No path needs a `\.` added unless a plain key or a
  shorter dotted key overlaps the dotted key it resolves through; where one does, escaping is now the
  way — see below.**
  What changed is how ties and misses resolve: `get`, `set` and `unset` now walk the path in a single
  forward pass, look only at own properties, and no longer try the whole path as one key ahead of the
  walk. The accepted breaks:

  **A nested match now wins over a literal dotted key.** With both present,
  `get({ a: { b: 2 }, 'a.b': 1 }, 'a.b')` was `1` and is now `2`, and `unset` deletes the nested `b`
  rather than the literal `'a.b'` key. A present segment also blocks the join even when it cannot be
  descended: `get({ a: 1, 'a.b': 2 }, 'a.b')` was `2` and is now the default. Where two dotted keys
  overlap the shorter one wins: `get({ 'a.b': {}, 'a.b.c': 1 }, 'a.b.c')` was `1` and is now the
  default. Escaping (`a\.b`) is the way to address a literal dotted key past a nested match.

  **Reads and writes see own properties only, never anything inherited from a prototype.** A data
  operator whose key was `toString`, `valueOf` or `hasOwnProperty` used to reach the built-in
  `Object.prototype` function and then fail while copying it, raising `SyntaxError: "undefined" is not
valid JSON`; `_state: toString` now returns the operator default instead. Writes were worse off:
  `SetState: { 'toString.x': 1 }` wrote `x` onto `Object.prototype.toString` — making `x` readable on
  every object in the process — and left state untouched. It now writes `{ toString: { x: 1 } }` into
  state, as asked. Own-only applies to every prototype, not just `Object.prototype`, so any value
  reached through an inherited accessor is now unreachable — the realistic case being a class getter.
  Given a `Thing` class whose `derived` getter returns `'g'`, `get({ t: new Thing() }, 't.derived')` was
  `'g'` and is now the default. YAML config holds no class instances, so that shape reaches a path only
  from a custom plugin or connection.

  **A path no longer steps _through_ a function value.** Given an `f` carrying an `f.z` of `3`,
  `get({ f }, 'f.z')` was `3` and is now the default. Config data holds no functions, so this is
  reachable only from a custom plugin.

  **`get` no longer accepts `separator`, `split`, `join` or `isValid`, and paths must be strings.**
  `get({ a: { b: 1 } }, 'a/b', { separator: '/' })` was `1` and is now the default, and `isValid` is
  ignored rather than consulted. Array paths are gone from all three helpers:
  `get({ a: { b: 1 } }, ['a', 'b'])` was `1` and is now the default, `set({}, ['a', 'b'], 1)` wrote
  `{ a: { b: 1 } }` and is now a no-op, and `unset(obj, ['a', 'b'])` threw a `TypeError` and is now a
  no-op. Nothing in Lowdefy passed any of these, so this too is a custom-plugin concern. (`set`'s
  `options` parameter is removed outright — see its own entry.)

  **`unset` no longer skips a delete because the value looks empty, and no longer throws on a dotted
  key at depth.** Hiding a block clears its state field, so both are reachable from config. A hidden
  _nested_ block whose value was an empty string or `undefined` used to keep its field —
  `unset({ parent: { child: '' } }, 'parent.child')` left `child` in place and now removes it — so a
  cleared, hidden input no longer leaves a stale key behind in `_state`. The same applied to an empty
  `Map` or `Set`, an empty-source `RegExp`, and a blank-message `Error`. And a block id written with an
  escaped dot used to crash the delete: `unset({ 'a.b': { c: 1 } }, 'a\.b.c')` threw
  `TypeError: Cannot read properties of undefined` and now deletes `c`.

  **The dot-path escape grammar now covers the backslash itself.** `\.` remains a literal dot and `\\`
  is now a literal backslash, so `joinPath` can escape a segment that ends in a backslash — before, it
  only escaped dots, and `joinPath(['a\\', 'b'])` produced a path `splitPath` read back as the single
  key `a.b`. Any other backslash is still an ordinary character, so a key such as `a\b` needs no
  escaping. The one observable change is a doubled backslash directly before a dot:
  `splitPath('a\\\\.b')` used to yield `['a\\.b']` and now yields `['a\\', 'b']`.

- 824f4be: fix(helpers): Serialized errors mark the values they cannot carry instead of dropping them.

  An error is turned into plain data in three places: the `err` field of a server log line, an error
  sent to a browser or API caller, and — new in this release — a dot-path read of an error value from
  config. That conversion used to lose fields silently and let a few live values through. Every own
  field of an error now appears, with anything unserializable replaced by a marker string:

  - A field holding a class instance no longer vanishes. A Node error carrying a `socket`, `agent` or
    similar field had that key dropped from the log line altogether, which is indistinguishable from
    the error not having the field; it now logs as `'[Object: Socket]'`. The instance's internals are
    still never expanded.
  - A field holding a function, a bigint or a symbol was passed through live. That leaked a closure
    over server state into serialized output, and a bigint field made `JSON.stringify` of the result
    throw `TypeError: Do not know how to serialize a BigInt`. These are now `'[Function: handler]'`,
    `'[BigInt: 10]'` and `'[Symbol: s]'`.
  - A circular `cause`, or an own field pointing back at the error itself, had its key dropped. Both
    are now `'[Circular]'`.
  - A `cause` chain longer than three levels ended with the fourth `cause` key simply absent. It is
    now `'[Truncated]'`.

  The markers are literal strings, so they show up wherever the serialized error does: a log line's
  `err.agent` reads `[Object: Socket]`, and `_actions: someAction.error.someField` can now resolve to
  `'[Object: Socket]'` rather than to the operator default.

  `extractErrorProps` also takes a new `omit` option — `extractErrorProps(error, { omit: (error) =>
['stack'] })`, called once per error node in the `cause` walk so a policy can key on the node it is
  looking at. `serializer.serialize` accepts the same function as `omitErrorProps` and passes it down.
  This is plugin and server API; app config is unaffected by it.

- 3ead269: fix(helpers): Deep merges replace arrays instead of merging them index-by-index.

  Wherever Lowdefy deep-merges configuration — block property defaults, `AxiosHttp` connection
  and request config, theme tokens, i18n message catalogs — an array value is now treated as a
  single value. A later array replaces an earlier one; it no longer merges element-by-element
  at matching indices.

  This is what most overrides already assumed, and it matches a plain object spread. Two
  places where the old behaviour was visible:

  - `RatingSlider`'s `CheckboxInput.options` — overriding it previously inherited the default
    element's `label: 'N/A'`. It no longer does; specify the full option object.
  - The layout blocks (`PageHeaderMenu`, `PageSiderMenu`, `PageSidebarLayout`, `MobileMenu`) —
    if you set the same array (`selectedKeys`, `defaultOpenKeys`, `links`) on both `menu` and a
    breakpoint variant such as `menuLg` or `menuMd`, the breakpoint value now replaces the base
    value outright rather than overlaying it index-by-index.

  Two smaller semantic changes come with this. A later `undefined` now replaces an earlier value
  instead of being skipped — `mergeObjects([{ a: 1 }, { a: undefined }])` was `{ a: 1 }` and is now
  `{ a: undefined }`, so a caller that means "no override" must omit the key rather than set it to
  `undefined`. And a single-object merge no longer passes its input through: `mergeObjects([x]) === x`
  was `true` and is now `false`, so memoise at the call site if a stable reference is needed across
  renders. Both are reachable only from code that calls `mergeObjects` — plugin and connection authors
  — not from YAML, which has no `undefined`; a config `null` merges as it always did.

  Also fixed: merging no longer mutates its inputs. `AxiosHttp` previously wrote merged request
  config back into the shared connection config, leaking values such as the HTTP agent between
  requests.

  `lodash.merge`, the last remaining lodash dependency in Lowdefy, has been removed.

- 3ead269: fix(operators): Read fields inside an error value by dot path.

  Dot-path reads stopped at an error, so a field on it silently returned the operator default even
  though the value was there. Mapping a sign-in failure to a friendly message with `_actions:
login.error.cause.code` always fell through to the default branch; it now reads the code.
  `_actions: login.error.message` was the default and now returns the message.

  Errors are the only kind of value this opens up. `Date`, `URL`, `Map`, `Set`, `RegExp`, `Promise`,
  `Buffer` and typed arrays are still not traversable — a path into one returns the default, exactly
  as before — and a class instance's own fields were already readable, so nothing changed there.

  A lookup on an error reads the error's serializable form, which brings that form's limits with it:

  - An own field holding a class instance or a function arrives as a marker string —
    `'[Object: Socket]'`, `'[Function: handler]'` — not as a live object.
  - The `cause` chain resolves three levels. `_actions: x.error.cause.cause.cause.message` reads; a
    fourth `cause` is the literal string `'[Truncated]'`. Lowdefy's own wrap (`ActionError` →
    `RequestError` → `ServiceError` → driver error) fits inside that.
  - A non-enumerable own property is not readable. `AggregateError`'s `errors` array is
    non-enumerable, so `_actions: x.error.errors` returns the default.

  An error that is the _end_ of the path is unchanged — `_actions: x.error` still hands over the error
  itself, not its extracted form. This entry only adds readable values; for the reads that this
  release does change, see the dot-path resolution entry.

  Also in this release, `@lowdefy/helpers`' `type` utility identifies `Date` and `Error` with
  `instanceof` rather than duck-typing, so a `Date` or `Error` constructed in another JavaScript realm
  (a `vm` context, iframe, or worker) is no longer detected as one; `type.isRegExp` is unchanged and
  still detects a foreign `RegExp`. Lowdefy itself never constructs a value in another realm, so this
  is reachable only from a custom plugin that introduces one. No `type` predicate was removed.
  `type.typeOf` returns coarser answers for four kinds of value: a generator function is now
  `'function'` (was `'generatorfunction'`), a generator object and an `arguments` object are now
  `'object'` (were `'generator'` and `'arguments'`), and the map, set, array and string iterators are
  all now `'iterator'` (were `'mapiterator'`, `'setiterator'`, `'arrayiterator'` and
  `'stringiterator'`). `typeOf(Buffer.from('x'))` still returns `'buffer'`.

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/node-utils@5.6.0
  - @lowdefy/logger@5.6.0
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/errors@5.5.1
- @lowdefy/helpers@5.5.1
- @lowdefy/logger@5.5.1
- @lowdefy/node-utils@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/errors@5.5.0
- @lowdefy/helpers@5.5.0
- @lowdefy/logger@5.5.0
- @lowdefy/node-utils@5.5.0

## 5.4.0

### Patch Changes

- 134792b: fix: Unblock Playwright e2e for v5+ Lowdefy apps.

  **`@lowdefy/server-e2e`**

  - `next.config.js` now declares `turbopack: {}` and drops the legacy `webpack` polyfill block, so Next 16 (Turbopack-by-default) no longer errors with `This build is using Turbopack, with a webpack config and no turbopack config`. The `transpilePackages` list is now built from the same `build/blockPackages.json` artifact used by `@lowdefy/server`.
  - Plugin `types` modules are now correctly unwrapped from their ESM default export, so apps using custom plugins (blocks, actions, operators, connections, requests, etc.) no longer fail with `Action/Block/... type "Foo" was used but is not defined`.
  - Plugin `blockMetas` are now collected on the e2e server, matching the behaviour of `@lowdefy/server` and `@lowdefy/server-dev`.
  - `lowdefy build --server e2e` no longer crashes when the project has no `lowdefy.yaml` or `lowdefy.yml` (returns an empty plugin set instead of `YAML.parse(undefined)`).
  - Page and API routes now use catch-all segments (`pages/[[...pageId]].js`, `pages/api/endpoints/[...endpointId].js`, `pages/api/request/[...path].js`), so apps with nested page paths (e.g. `pages: [{ id: 'foo/bar' }]`) render correctly under `--server e2e` instead of returning 404.
  - `_app.js` and `_document.js` now mirror `@lowdefy/server`'s dark-mode handling — `useDarkMode` from `@lowdefy/client`, a `ThemeTokenResolver` that exposes the resolved antd token on `lowdefy.theme._resolvedAntdToken`, and a pre-hydration background-colour script that prevents the light/dark flash on page navigation.
  - `pages/api/client-error.js` now enforces the same-origin host check and strips `~e.received` from incoming payloads, matching `@lowdefy/server`.
  - `lowdefy/build.mjs` now uses `instanceof BuildError` for the formatted-error shortcut (matches `@lowdefy/server`) and drops the obsolete `mixin` logger config.
  - Runtime dependency set now includes `@lowdefy/blocks-antd-x`, and `tailwindcss` / `@tailwindcss/postcss` are declared in `dependencies` (not just `devDependencies`). The unused `process` browser polyfill has been removed.

  **`@lowdefy/e2e-utils`**

  - `extractBlockMap` now traverses `slots.<name>.blocks` alongside `areas.<name>.blocks` and `blocks`. Compiled page artifacts under `.lowdefy/server/build/pages/<pageId>.json` use the `slots` container shape, which `extractBlockMap` was not walking — so `generateManifest` produced a `blockMap` containing only the page root and `ldf.block('<any-nested-id>')` threw `Block "<id>" not found on page. Available blocks: <pageId>` for every non-root block, reducing the e2e framework to root-block assertions and raw `ldf.page.locator(...)` fallbacks.

  **`lowdefy` CLI**

  - `lowdefy build --server <name>` now re-fetches the server package when the version matches but the name differs. Both `lowdefy build` and `lowdefy build --server e2e` write to the same `.lowdefy/server/` directory, so the previous version-only cache check meant flipping between them (in either order) would silently reuse whichever server package was fetched first.

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [302e330]
  - @lowdefy/helpers@5.4.0
  - @lowdefy/errors@5.4.0
  - @lowdefy/logger@5.4.0
  - @lowdefy/node-utils@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/errors@5.3.0
- @lowdefy/helpers@5.3.0
- @lowdefy/logger@5.3.0
- @lowdefy/node-utils@5.3.0

## 5.2.0

### Patch Changes

- Updated dependencies [e3fc007]
  - @lowdefy/logger@5.2.0
  - @lowdefy/errors@5.2.0
  - @lowdefy/helpers@5.2.0
  - @lowdefy/node-utils@5.2.0

## 5.1.0

### Patch Changes

- @lowdefy/errors@5.1.0
- @lowdefy/helpers@5.1.0
- @lowdefy/logger@5.1.0
- @lowdefy/node-utils@5.1.0

## 5.0.0

### Minor Changes

- deac108c66: feat: Add `lowdefy upgrade` command with prompt-based codemod system

  New CLI command that guides version migrations using markdown prompts. Resolves a chain of upgrade phases from current to target version, presents migration prompts in order, and tracks progress for `--resume` support.

  **CLI (`lowdefy`)**

  - `lowdefy upgrade` command with `--to`, `--plan`, `--resume` options
  - Version chain resolver computes ordered upgrade phases from semver ranges
  - Fetches `@lowdefy/codemods` package from npm, presents migration prompts
  - Each prompt can be copied to clipboard for AI tools, viewed as a manual guide, or skipped
  - Upgrade state persistence in `.lowdefy/upgrade-state.json` for interrupted upgrades
  - Build-time warning when skipped codemods are detected

  **Codemods (`@lowdefy/codemods`)**

  - v5.0 entry with 20 migration prompts
  - Covers antd v6 upgrade (14 prompts), layout grid migration (4 prompts), dayjs migration (2 prompts)
  - Self-contained markdown prompts with context, examples, edge cases, and verification steps

### Patch Changes

- Updated dependencies [905d5d406]
- Updated dependencies [f430f02dde]
  - @lowdefy/helpers@5.0.0
  - @lowdefy/node-utils@5.0.0
  - @lowdefy/logger@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/errors@4.7.3
- @lowdefy/helpers@4.7.3
- @lowdefy/logger@4.7.3
- @lowdefy/node-utils@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/errors@4.7.2
- @lowdefy/helpers@4.7.2
- @lowdefy/logger@4.7.2
- @lowdefy/node-utils@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/errors@4.7.1
- @lowdefy/helpers@4.7.1
- @lowdefy/logger@4.7.1
- @lowdefy/node-utils@4.7.1

## 4.7.0

### Patch Changes

- cbd74a72b: fix(cli): Exit process and stop spinner on build errors.

  The CLI error handler logged errors but never called `process.exit(1)`, so the process continued running with a spinning indicator after a build failure. Added `process.exit(1)` to `runCommand` after error handling, and added `{ spin: 'fail' }` to stop the spinner in `runLowdefyBuild`, `runNextBuild`, and `installServer` catch blocks.

- 5716be2c8: fix(cli): Remove install skip for local builds

  Removed the early return in `installServer.js` when `lowdefyVersion === 'local'`. The build pipeline adds custom plugins to server's `package.json` via `addCustomPluginsAsDeps`, then runs `pnpm install` to link them. Skipping install for local versions meant plugins were never linked, breaking deploys (e.g. Vercel docs deploy failing with `ERR_MODULE_NOT_FOUND`).

- e2666d58c: fix(cli): Fix port availability check for start command

  The CLI's `checkPortAvailable` was called with `undefined` port when no `--port` flag was passed, causing `net.listen(undefined)` to bind a random port instead of checking port 3000. Added default `port: 3000` in `getOptions`. Removed redundant `checkPortAvailable` from server-dev manager since the CLI now catches port conflicts before the server starts.

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0
  - @lowdefy/logger@4.7.0
  - @lowdefy/node-utils@4.7.0
  - @lowdefy/errors@4.7.0

## 4.6.0

### Minor Changes

- 5e03091ee: Add e2e testing package for Lowdefy apps

  **@lowdefy/e2e-utils** (new package)

  - Locator-first API via `ldf` Playwright fixture: `ldf.block('id').do.*`, `ldf.block('id').expect.*`
  - Request mocking with static YAML files (`mocks.yaml`) and inline per-test overrides
  - Request assertion API: `ldf.request('id').expect.toFinish()`, `.toHaveResponse()`, `.toHavePayload()`
  - State and URL assertions: `ldf.state('key').expect.toBe()`, `ldf.url().expect.toBe()`
  - Manifest generation from build artifacts for block type resolution and helper loading
  - `createConfig()` and `createMultiAppConfig()` for Playwright config with automatic build/server management
  - Scaffold command (`npx @lowdefy/e2e-utils`) for project setup with templates and dependency management
  - Block helper factory with auto-provided expect methods (visible, hidden, disabled, validation)

  **@lowdefy/cli**

  - Add `--server` option to `lowdefy build` for server variant selection (e.g., `--server e2e`)

  **@lowdefy/client**

  - Expose `window.lowdefy` when `stage="e2e"` for e2e state/validation access

  **@lowdefy/blocks-antd**

  - Flatten e2e helper APIs for polymorphic proxy compatibility
  - Add TextArea e2e helper

  **@lowdefy/block-dev-e2e**

  - Remove unused srcDir variable

- aa0d6d363e: feat: Config-aware error tracing and Sentry integration

  **Config-Aware Error Tracing (#1940)**

  - Errors now trace back to exact YAML config locations with file:line
  - Clickable VSCode links in terminal and browser
  - Build-time validation catches typos with "Did you mean?" suggestions
  - Service vs Config error classification

  **Plugin Error Refactoring**

  - Operators throw simple error messages without formatting
  - Parsers (WebParser, ServerParser, BuildParser) format errors with received value and location
  - Removed redundant "Operator Error:" prefix from error messages
  - Consistent error format: "{message} Received: {params} at {location}."
  - Actions and connections also simplified: removed inline `received` from error messages (interface layer adds it)
  - Connection plugins (axios-http, knex, redis, sendgrid) no longer expose raw response data in errors

  **Error Class Hierarchy**

  - Unified error system in `@lowdefy/errors` with all error classes
    - `@lowdefy/errors/build` - Build-time classes with sync location resolution
  - Error classes: `LowdefyError`, `ConfigError`, `ConfigWarning`, `PluginError`, `ServiceError`
  - `ConfigWarning` supports `prodError` flag to throw in production builds
  - `ServiceError.isServiceError()` detects network/timeout/5xx errors
  - `~ignoreBuildChecks` cascades through descendants to suppress warnings/errors

  **Build Error Collection**

  - Errors collected in `context.errors[]` instead of throwing immediately
  - `tryBuildStep()` wrapper catches and collects errors from build steps
  - All errors logged together before summary message for proper ordering

  **Sentry Integration (#1945)**

  - Zero-config Sentry support - just set SENTRY_DSN
  - Client and server error capture with Lowdefy context (pageId, blockId, config location)
  - Configurable sampling rates, session replay, user feedback
  - Graceful no-op when DSN not set

- f673e3ab3d: feat(logger): Add centralized @lowdefy/logger package and standardize logging

  **New @lowdefy/logger Package**

  - Centralized logging with environment-specific subpaths: `/node`, `/cli`, `/browser`
  - `createNodeLogger` — pino factory with custom error serializer preserving Lowdefy error metadata (source, configKey, isServiceError)
  - `createCliLogger` — wraps `createPrint` (ora spinners, colored output) with standard logger interface
  - `createBrowserLogger` — maps to `console.*` with error formatting
  - `wrapErrorLogger` — formats Lowdefy errors, emits source as separate `{ print: 'link' }` line for blue clickable links

  **Standardized `.ui` Interface**

  All logger variants expose `logger.ui` with consistent methods: `log`, `dim`, `info`, `warn`, `error`, `debug`, `link`, `spin`, `succeed`. This allows any component to emit structured output without knowing the runtime environment.

  - `dim` renders as dimmed text in the CLI — useful for low-priority trace lines (e.g., request logs) that shouldn't compete visually with build output

  **CLI Logger Migration**

  - CLI now uses `createCliLogger` instead of raw `createPrint`
  - `context.print` replaced with `context.logger` / `context.logger.ui`
  - `createPrint` and `createStdOutLineHandler` moved from CLI to `@lowdefy/logger/cli`

  **Server-Dev stdio:inherit**

  - Server process spawned with `stdio: ['ignore', 'inherit', 'pipe']`
  - Server pino JSON flows directly to manager stdout (inherited by CLI) — eliminates dev stdout line handler
  - Only stderr piped for error formatting through manager logger
  - Server `createLogger` includes `print` mixin so CLI can render each line correctly

### Patch Changes

- bb3222a5a: fix(errors): Preserve error cause chains in catch-and-rethrow blocks across plugins and CLI
- 7e7343473: Fix env vars not being passed to Next.js build subprocess. The `env` object was passed as a separate parameter to `spawnProcess` instead of inside `processOptions`, so `NEXT_TELEMETRY_DISABLED` was silently ignored during `next build`.
- Add port-in-use check with clear error message before starting server.
- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [f673e3ab3d]
- Updated dependencies [f673e3ab3]
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0
  - @lowdefy/node-utils@4.6.0
  - @lowdefy/logger@4.6.0

## 4.5.2

### Patch Changes

- @lowdefy/helpers@4.5.2
- @lowdefy/node-utils@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/helpers@4.5.1
- @lowdefy/node-utils@4.5.1

## 4.5.0

### Minor Changes

- abc90f3f7: Change to Apache 2.0 license for all packages. All license checks and restrictions have been removed.

### Patch Changes

- @lowdefy/helpers@4.5.0
- @lowdefy/node-utils@4.5.0

## 4.4.0

### Patch Changes

- @lowdefy/helpers@4.4.0
- @lowdefy/node-utils@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/helpers@4.3.2
- @lowdefy/node-utils@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/helpers@4.3.1
- @lowdefy/node-utils@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/helpers@4.3.0
- @lowdefy/node-utils@4.3.0

## 4.2.2

### Patch Changes

- @lowdefy/helpers@4.2.2
- @lowdefy/node-utils@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/helpers@4.2.1
  - @lowdefy/node-utils@4.2.1

## 4.2.0

### Patch Changes

- @lowdefy/helpers@4.2.0
- @lowdefy/node-utils@4.2.0

## 4.1.0

### Patch Changes

- @lowdefy/helpers@4.1.0
- @lowdefy/node-utils@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/helpers@4.0.2
- @lowdefy/node-utils@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/helpers@4.0.1
- @lowdefy/node-utils@4.0.1

## 4.0.0

### Patch Changes

- Updated dependencies [84e479d11]
  - @lowdefy/node-utils@4.0.0
  - @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package lowdefy

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package lowdefy

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package lowdefy

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([e0804b8](https://github.com/lowdefy/lowdefy/commit/e0804b87999e6d812f2d2378770ed214d4264142))
- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Patch version updates for various deps. ([64068f3](https://github.com/lowdefy/lowdefy/commit/64068f38573113e9436d638489e9435ac7f45edf))
- **deps:** Update axios to v1.5.0. ([a23099a](https://github.com/lowdefy/lowdefy/commit/a23099af2738faff4a27c55bcf413ca3da5cdbd2))
- **deps:** Update dependency commander to v11.0.0 ([d1a93ac](https://github.com/lowdefy/lowdefy/commit/d1a93acbdad40651b34faacb2fc8cf4c075d2e98))
- **deps:** Update dependency dotenv to v16.3.1 ([82c1f7a](https://github.com/lowdefy/lowdefy/commit/82c1f7aa168cacab4197326c4f000a00e22761fb))
- **deps:** Update dependency ora to v7.0.1 ([7b58aac](https://github.com/lowdefy/lowdefy/commit/7b58aac1538f765f78b6e6dfa7dc06f7d5349116))
- **deps:** Update dependency yaml to 2.3.2 ([cbcdc7d](https://github.com/lowdefy/lowdefy/commit/cbcdc7d3e313fca96fa52bc4724344a061d9f444))

### Features

- Update minimum node version to 18 ([0b64fd1](https://github.com/lowdefy/lowdefy/commit/0b64fd1347fc807d79819cc9c2022671088c8921))

### BREAKING CHANGES

- Update minimum node version to 18

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- **deps:** update dependency semver to v7.5.2 [security] ([6326c77](https://github.com/lowdefy/lowdefy/commit/6326c77890d8262d828847b52abd097bd0f39980))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

**Note:** Version bump only for package lowdefy

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- **deps:** update dependency yaml to v2.2.2 [security] ([8e015fe](https://github.com/lowdefy/lowdefy/commit/8e015fec47a40bc5233f23d8da345720475d1232))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package lowdefy

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **cli:** Add requiresLowdefyYaml to context. ([f3c6584](https://github.com/lowdefy/lowdefy/commit/f3c658489f7a0164ef00bed8422ef21ba2d61d6f))
- **cli:** Fix command is init condition in validateVersion. ([b3e25b7](https://github.com/lowdefy/lowdefy/commit/b3e25b7b97cd265d93e123ebb1e5bc8228a329a8))
- **cli:** Fix undefined version error when calling lowdefy init. ([a589cd5](https://github.com/lowdefy/lowdefy/commit/a589cd596acb1ed444322dceff2407b1714fe112))
- **cli:** Update tests. ([743f440](https://github.com/lowdefy/lowdefy/commit/743f440732fa08a5718afffd1e4ead070bb366f0))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package lowdefy

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package lowdefy

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package lowdefy

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package lowdefy

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **cli:** Use semver to validate version. ([13e5c45](https://github.com/lowdefy/lowdefy/commit/13e5c454bac5a82abbc1fff1f3553d7b51125e88))
- **cli:** Warn if user is running v3 app. ([4b62d09](https://github.com/lowdefy/lowdefy/commit/4b62d09a6df731574fd210e30dd907de9525fc3c))
- **deps:** Update axios to v1.2.2 (major version) ([18d725e](https://github.com/lowdefy/lowdefy/commit/18d725e9ff8b2d049ecd7182c1241553950e8d4f))
- **deps:** Update dep ora to v6.1.2 ([98afaed](https://github.com/lowdefy/lowdefy/commit/98afaedde508c42e5e573157bc78fe683cda4280))
- **deps:** Update dep uuid major version to 9.0.0 ([a88b974](https://github.com/lowdefy/lowdefy/commit/a88b97420098895905a784031673131581731558))
- **deps:** Update minor versions of util packages. ([2d7a2a5](https://github.com/lowdefy/lowdefy/commit/2d7a2a55c88f0ee33eff49e5ff541f6296ec4337))
- **deps:** Update patch versions of dependencies ([9edaef7](https://github.com/lowdefy/lowdefy/commit/9edaef7e1aa940ff8aa795e60c25fb6369244ca9))
- Remove copy plugins folder functionality ([6c5e35f](https://github.com/lowdefy/lowdefy/commit/6c5e35f68d2c179f980107193fd279272d9edc08))
- Reset server package.json to original version on CLI start. ([6fac2aa](https://github.com/lowdefy/lowdefy/commit/6fac2aabc8a8e4d95e6ad0922ff3b82f73427a30))

### Features

- Add init-docker CLI command and docker docs ([d27975b](https://github.com/lowdefy/lowdefy/commit/d27975b52373b5bded837bb6d5202fe06ab8630d))
- Add init-vercel CLI command and Vercel deployment docs. ([408e21a](https://github.com/lowdefy/lowdefy/commit/408e21a1af4052af2fb16c335378977f70e0451b))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

### Bug Fixes

- Fix server pnpm installs. ([c7be221](https://github.com/lowdefy/lowdefy/commit/c7be22150ed14afcb8b6508bd771112a542e0a26))

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

### Bug Fixes

- Fix CLI tests failing due to pnpm. ([d95524a](https://github.com/lowdefy/lowdefy/commit/d95524ad6b4e37452176cf1aaa046269daf2ba53))

### Features

- Change CLI to use pnpm as package manager. ([e9d7d73](https://github.com/lowdefy/lowdefy/commit/e9d7d73aed2fc9d40699210f2f8846df0170d481))

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

### Bug Fixes

- Log server install output at debug level. ([c77a220](https://github.com/lowdefy/lowdefy/commit/c77a2205c6cc10a7f6e282f02ac787ee13ea4bb9))

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

### Bug Fixes

- Clean up files. ([eaf6bde](https://github.com/lowdefy/lowdefy/commit/eaf6bde3364e24cc5fce949ad03b9db2c779ea6e))
- **cli:** Fix CLI print tests. ([fd8345e](https://github.com/lowdefy/lowdefy/commit/fd8345e5dee20b993662e2990850dd543acd3cb6))
- **cli:** Improve CLI options specification. ([6d550fd](https://github.com/lowdefy/lowdefy/commit/6d550fd4620cde2ded905c3946ed86500c3efed5))
- **cli:** Remove dependency chalk. ([aebe925](https://github.com/lowdefy/lowdefy/commit/aebe925ea61ba10109b1c59e79cbe12fbce1840e))
- **deps:** Update dependency commander to v9.4.0. ([e2cd7d6](https://github.com/lowdefy/lowdefy/commit/e2cd7d6aecb6f0d0f4d7c6a15571010b8acc1237))
- **server-dev:** Remove build retries. ([c27ff36](https://github.com/lowdefy/lowdefy/commit/c27ff36e174f085d00bc0c76f2e2c3d8d2ad9bd2))

### Features

- Cleanup dev server logs. ([27a22c8](https://github.com/lowdefy/lowdefy/commit/27a22c8d34b822268a834704fe9c022397180386))
- CLI output improvements. ([f00bb9b](https://github.com/lowdefy/lowdefy/commit/f00bb9b32e03e77ef1ef19c69055da4b05880cd8))
- **cli:** Add log level option. ([5903c8e](https://github.com/lowdefy/lowdefy/commit/5903c8e4165334eb31f80580c3816a34ac36592d))
- **cli:** Imporve build and start command output. ([f721792](https://github.com/lowdefy/lowdefy/commit/f721792ba9bafd00c8b126ae0ed86c1523025c15))
- **cli:** Throw if Lowdefy CLI is run with node < v14. ([4a99337](https://github.com/lowdefy/lowdefy/commit/4a9933798e304ce0b00bab8b85b851b90dfc2d96))
- Improved logging WIP. ([0bbf19d](https://github.com/lowdefy/lowdefy/commit/0bbf19d69926440930995d457514544608ec5b5b))

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

### Bug Fixes

- Configure server Lowdefy build with env variables, not args. ([590588c](https://github.com/lowdefy/lowdefy/commit/590588c125886655b9487c6dc4184a571533fe26))

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

### Bug Fixes

- Configure server lowdefy build with commandline args instead of env from CLI ([648f050](https://github.com/lowdefy/lowdefy/commit/648f050377077ddd0e677250e7f9e7d422fdea36))

### Features

- Add —no-next-build option to CLI build command. ([9b565f4](https://github.com/lowdefy/lowdefy/commit/9b565f4950f3087d54e9be3c0f768cba1d0651d1))

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

### Bug Fixes

- Configure server Lowdefy build with env variables, not args. ([590588c](https://github.com/lowdefy/lowdefy/commit/590588c125886655b9487c6dc4184a571533fe26))

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

### Bug Fixes

- **cli:** Define build directory on context. ([51bc05f](https://github.com/lowdefy/lowdefy/commit/51bc05f835cade977f7d2c0476b76fa38d762655))
- Configure server lowdefy build with commandline args instead of env from CLI ([648f050](https://github.com/lowdefy/lowdefy/commit/648f050377077ddd0e677250e7f9e7d422fdea36))
- Remove output directory cli option ([ba281a6](https://github.com/lowdefy/lowdefy/commit/ba281a6a2c7a75bc05b4e5495e46063d62e555d8))

### Features

- Add —no-next-build option to CLI build command. ([9b565f4](https://github.com/lowdefy/lowdefy/commit/9b565f4950f3087d54e9be3c0f768cba1d0651d1))

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

### Bug Fixes

- **cli:** Define build directory on context. ([51bc05f](https://github.com/lowdefy/lowdefy/commit/51bc05f835cade977f7d2c0476b76fa38d762655))
- Remove output directory cli option ([ba281a6](https://github.com/lowdefy/lowdefy/commit/ba281a6a2c7a75bc05b4e5495e46063d62e555d8))

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- **cli:** Check env for configDirectory. ([f8964ca](https://github.com/lowdefy/lowdefy/commit/f8964cac1ae2c55cb95fa13c06be3dc8be032538))
- Use createRequire to import json files. ([a9c7ec4](https://github.com/lowdefy/lowdefy/commit/a9c7ec4eae0cf65dd42403fb405e65e13b9eca62))

### Features

- **cli:** Add —no-open option to cli dev command. ([bc5b12f](https://github.com/lowdefy/lowdefy/commit/bc5b12fce379352e6cbf73503154e88b980918e6))
- **cli:** Cli to load .env for build and start commands. ([ac34fe8](https://github.com/lowdefy/lowdefy/commit/ac34fe80190585b3db3f18e5fa3c4fba48563368))
- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- Package Updates. ([0f9d8cd](https://github.com/lowdefy/lowdefy/commit/0f9d8cd89186e12c66e5f833c13c12472f52eaee))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

### Bug Fixes

- **cli:** Do not copy node_modules in plugin folders. ([a5a131d](https://github.com/lowdefy/lowdefy/commit/a5a131de06d6a8d28926aa709a57af0a7e7adb5f))
- **cli:** Plugins should be added as dependencies, not devDependencies. ([e11e11f](https://github.com/lowdefy/lowdefy/commit/e11e11f7ab62b3272bb02cfa723f61b61c836fde))
- Fix tests. ([eb85c58](https://github.com/lowdefy/lowdefy/commit/eb85c58f7a9a0531b703804810f0b61a228a592e))
- Use fileURLToPath when loading json files. ([4885462](https://github.com/lowdefy/lowdefy/commit/488546237b8e5964acc453f05d919f5eb952d8c4))
- Windows compatibility fixes. ([8ecdfc4](https://github.com/lowdefy/lowdefy/commit/8ecdfc4e377648761e9035e355c7ec777fd63888))

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- Fix icon names. ([2e81f58](https://github.com/lowdefy/lowdefy/commit/2e81f589fba193e7039dc7c099855831ff9a61fb))
- Review feedback changes. ([6925625](https://github.com/lowdefy/lowdefy/commit/69256253142813f0b78c353d0698f13386d10929))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- **cli:** Do not merge app and server package jsons ([7a97261](https://github.com/lowdefy/lowdefy/commit/7a972615431ed8993a207c69839837ebe4e69c4a))
- **cli:** Fix CLI tests. ([1c8dc54](https://github.com/lowdefy/lowdefy/commit/1c8dc544af0ed052697ba9ff0e7a47124ffb6a03))

### Features

- Add support for typePrefix on custom plugins. ([d66d395](https://github.com/lowdefy/lowdefy/commit/d66d395e01688af917bda0722beba7a8a5886085))
- **cli:** Add install custom plugins as dev dependencies. ([b6ab43b](https://github.com/lowdefy/lowdefy/commit/b6ab43bae01f10a9b2762b180d1f7d92df712e80))
- **cli:** Copy plugins folder to server. ([9f4ff92](https://github.com/lowdefy/lowdefy/commit/9f4ff92573b164c0cbfe42087e54adac60b6a74a))
- **cli:** Merge user package json into server package json. ([899a15f](https://github.com/lowdefy/lowdefy/commit/899a15f6c515d3be28d67126b653124fb7acf92c))
- Create types map for custom plugins. ([5ddf739](https://github.com/lowdefy/lowdefy/commit/5ddf739103b7bdea57bf0a5903433555368c43c3))
- Custom plugins on dev server. ([9f65d13](https://github.com/lowdefy/lowdefy/commit/9f65d130d70494ebd74fb0ae3cf6edb4cbf31415))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **cli:** Change additional base dir references to config. ([e20cfdf](https://github.com/lowdefy/lowdefy/commit/e20cfdfdcb1f079ea80450b87608ae57ab4e30f8))
- **cli:** Fix icon in init command. ([295faba](https://github.com/lowdefy/lowdefy/commit/295faba2bf0c9dec826fa0c589e3a7e729e635e9))
- **cli:** Fix jest es module mocks. ([78480e8](https://github.com/lowdefy/lowdefy/commit/78480e80022f79a0ab449a9a8d804e6213b676c4))
- **deps:** Update dependency axios to v0.25.0. ([ddf13bb](https://github.com/lowdefy/lowdefy/commit/ddf13bb7f891bbb328f1ac6aea3e34894d80c42c))
- **deps:** Update dependency commander to v9.0.0. ([aebd5be](https://github.com/lowdefy/lowdefy/commit/aebd5bec6b28d0242d60d3ac92a667b5e39c8aca))
- Downgrade dependency ora to v5.4.1 ([ea28ea5](https://github.com/lowdefy/lowdefy/commit/ea28ea51c2c2371e0636d3f9bc66b07470563bce))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))
- **node-utils:** Convert writeFile function prototype. ([5371430](https://github.com/lowdefy/lowdefy/commit/53714307123f3477240767a91c5332a70a292d93))

### Features

- Add watch and ignore paths, default ref resolver to dev server and build. ([c700d9f](https://github.com/lowdefy/lowdefy/commit/c700d9fb0efbdb20dcfe5f8916e256de81acd79e))
- **cli:** Add config option for server-dev and server directories. ([07902b0](https://github.com/lowdefy/lowdefy/commit/07902b0e06f9c72a04168842d7f9bb8de470c424))
- **cli:** Add port option for start command. ([9e16e2f](https://github.com/lowdefy/lowdefy/commit/9e16e2f9b920a44ce1ed95172b4e960afe404ffa))
- **cli:** Add port setting to dev command. ([546798a](https://github.com/lowdefy/lowdefy/commit/546798a8fc3ac877b851f31316eb5b0a49d7ac9f))
- **cli:** Pass package manager setting to dev server. ([0425f07](https://github.com/lowdefy/lowdefy/commit/0425f07e4ada328e76488e3ec0aa164ff475df5c))
- **cli:** Rename base-directory to config-directory. ([f09c569](https://github.com/lowdefy/lowdefy/commit/f09c569f0e4207ce31a9e5e002f8eb30ea221bc5))
- **operators:** Change dependancy from js-yaml to yaml. ([cbb71d8](https://github.com/lowdefy/lowdefy/commit/cbb71d809b3117dbaf89b23c17a2229a24235308))
- **server-dev:** Add .env and lowdefy version watchers. ([bc52268](https://github.com/lowdefy/lowdefy/commit/bc522684abce8c050873ef20a3da66ca023cfa32))

### BREAKING CHANGES

- **operators:** \_yaml.parse now takes an array or an object data instead of a string.
- **cli:** Rename base-directory to config-directory.

## [3.23.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v3.23.2) (2021-11-29)

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

### Bug Fixes

- **cli:** Fix CLI dev server command. ([49f6c20](https://github.com/lowdefy/lowdefy/commit/49f6c208ec400265526487c96b9a55e36894e87d))

### Features

- Add server manager and file watcher in reload event stream. ([8474aaf](https://github.com/lowdefy/lowdefy/commit/8474aaf63c0475cb19a76ca3df9459c05f263986))
- **cli:** Add v4 dev command to CLI. ([02770f5](https://github.com/lowdefy/lowdefy/commit/02770f57096710afc9047403e5e4a616957c3a93))
- **clie:** Update BatchChanges to repeat and pass args to callback function. ([6dd29c5](https://github.com/lowdefy/lowdefy/commit/6dd29c5ca998ff6536d9ce3807583f4c549f070b))
- Create wait helper function. ([42c09f4](https://github.com/lowdefy/lowdefy/commit/42c09f467b3d4a3b51298a2a67364137def7896d))
- **server-dev:** Add the abilty to restart the dev server. ([b610a63](https://github.com/lowdefy/lowdefy/commit/b610a63a522afebe66dee8481cf8caf029334201))

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

### Bug Fixes

- **cli:** Add node shebang to index.js. ([f711fa9](https://github.com/lowdefy/lowdefy/commit/f711fa9fad615d89263954512970ec930cf8dbcd))
- **cli:** Update getDirectories. ([8af70b0](https://github.com/lowdefy/lowdefy/commit/8af70b0e66260a87a3e0e62f1ea83a12822cb3bb))
- V4 fixes. ([088e210](https://github.com/lowdefy/lowdefy/commit/088e210620ffd8d7735cc785483845d082d5485d))

### Features

- Add start command to CLI. ([19bf81a](https://github.com/lowdefy/lowdefy/commit/19bf81ad31d9f5f002521e0aed9b1fc1599277dd))
- Add types object to telemetry. ([d2509b3](https://github.com/lowdefy/lowdefy/commit/d2509b327336c488db192fb1c8086ad685cd007b))
- Update server package.json if plugin deps change. ([09f7bca](https://github.com/lowdefy/lowdefy/commit/09f7bca3a29ff186783197692e988cb315ff7483)), closes [#943](https://github.com/lowdefy/lowdefy/issues/943)

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

## [3.23.2](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v3.23.2) (2021-11-29)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

**Note:** Version bump only for package lowdefy

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

### Bug Fixes

- Fixes for CLI build. ([3e58d59](https://github.com/lowdefy/lowdefy/commit/3e58d599829e1393de52e94e6e1e82f6876231ec))

### Features

- Fetch, install and build @lowdefy/server from CLI. ([7966538](https://github.com/lowdefy/lowdefy/commit/7966538468b4e9ac65003876b30ad1302132f1c3))

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

### Bug Fixes

- Clean up server configuration. ([dea25de](https://github.com/lowdefy/lowdefy/commit/dea25dec2303f19937253a0d9c699b56b28fb82b))
- **deps:** Update dependency axios to v0.23.0. ([f04f720](https://github.com/lowdefy/lowdefy/commit/f04f7208d2e00e2f8d9d2418514ecbe2bbab5cbc))
- **deps:** Update dependency chalk to v4.1.2. ([5a80923](https://github.com/lowdefy/lowdefy/commit/5a8092303ecf1abe93c307396ddd2f2af5a04349))
- **deps:** Update dependency chokidar to v3.5.2. ([ea8300a](https://github.com/lowdefy/lowdefy/commit/ea8300a2958b7cf74185446ba6503a2b15c49dc7))
- **deps:** Update dependency commander to v8.3.0. ([45489e6](https://github.com/lowdefy/lowdefy/commit/45489e68cd37d9d3b5f1dd7464fe6adf68c52b73))
- **deps:** Update dependency mssql to v7.2.1. ([c9acf42](https://github.com/lowdefy/lowdefy/commit/c9acf42dc081c282c259afdd7c3d795b3920c682))
- **deps:** Update dependency ora to v6.0.1. ([25e82f5](https://github.com/lowdefy/lowdefy/commit/25e82f515f80576a08d1548d5041989aeefd2014))
- **deps:** Update dependency pg to v8.7.1. ([cc2e30a](https://github.com/lowdefy/lowdefy/commit/cc2e30a5a8bb4ce3569034b9ee6a3523602cbed2))
- **deps:** Update dependency reload to v3.2.0. ([101ca3c](https://github.com/lowdefy/lowdefy/commit/101ca3ca6b71c8415463db7b8c2249c058efd618))
- **deps:** Update package axios to v0.24.0. ([ea4f077](https://github.com/lowdefy/lowdefy/commit/ea4f07784f5020eb12c95b3d2885e74044fc3fb9))
- Fix tests ([80c00f4](https://github.com/lowdefy/lowdefy/commit/80c00f4403067493351347ca91cb953586bb97da))
- Next server fixes ([d5ab3d9](https://github.com/lowdefy/lowdefy/commit/d5ab3d92f24b09a59e6c20e31a8b01dce9d1056f))
- Replace all front end testing with @testing-library/react, jest and other updates. ([22ec295](https://github.com/lowdefy/lowdefy/commit/22ec2954047853096aabcddba7a2c509342f95f2))

### Features

- Make @lowdefy/build a dev dependency of server. ([fa97eb6](https://github.com/lowdefy/lowdefy/commit/fa97eb6a34ae0ea08ae341959c461d5be4f4ba49))

## [3.23.1](https://github.com/lowdefy/lowdefy/compare/v3.23.0...v3.23.1) (2021-11-20)

**Note:** Version bump only for package lowdefy

# [3.23.0](https://github.com/lowdefy/lowdefy/compare/v3.23.0-alpha.0...v3.23.0) (2021-11-19)

**Note:** Version bump only for package lowdefy

# [3.23.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0...v3.23.0-alpha.0) (2021-11-09)

### Bug Fixes

- Support .yml in lowdefy.yaml file. ([0f7cc2a](https://github.com/lowdefy/lowdefy/commit/0f7cc2a7612a5ad9a8164d5a5437dde5c6d7da49)), closes [#902](https://github.com/lowdefy/lowdefy/issues/902)

# [3.22.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.1...v3.22.0) (2021-09-27)

### Bug Fixes

- **cli:** Use renderer served from blocks server url if configured. ([69d14b4](https://github.com/lowdefy/lowdefy/commit/69d14b4a862827beac955a5039df225af689f297)), closes [#840](https://github.com/lowdefy/lowdefy/issues/840)

# [3.22.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.0...v3.22.0-alpha.1) (2021-09-20)

### Bug Fixes

- **cli:** Add readme to CLI package. ([cf5c406](https://github.com/lowdefy/lowdefy/commit/cf5c406da6d0c1f53e23d0a1d2b802c89f29db44))
- **deps:** Update dependency axios to v0.21.4 ([81cd2b6](https://github.com/lowdefy/lowdefy/commit/81cd2b6e0ae3dc377b9cee6e3c801c47ddca2f08))
- **docs:** Change npx commands to specific versions for deployments. ([f2c380b](https://github.com/lowdefy/lowdefy/commit/f2c380b07a78defff79281d5c07c61a718bfe750))
- **docs:** Convert CLI commands to npx commands. ([c9cd643](https://github.com/lowdefy/lowdefy/commit/c9cd643f3809fdc0cde7ba47e17e392b3236c17b))

# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)

**Note:** Version bump only for package lowdefy

## [3.21.2](https://github.com/lowdefy/lowdefy/compare/v3.21.2-alpha.0...v3.21.2) (2021-08-31)

**Note:** Version bump only for package lowdefy

## [3.21.2-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.1...v3.21.2-alpha.0) (2021-08-31)

**Note:** Version bump only for package lowdefy

## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

**Note:** Version bump only for package lowdefy

# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)

**Note:** Version bump only for package lowdefy

## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)

**Note:** Version bump only for package lowdefy

## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)

### Bug Fixes

- **cli:** Initialise basePath in CLI dev server. ([3c2093a](https://github.com/lowdefy/lowdefy/commit/3c2093a6bd85e969c0f3cccfc213c9ebccdd7144))

## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)

### Bug Fixes

- **cli:** Initialise basePath in CLI dev server. ([3c2093a](https://github.com/lowdefy/lowdefy/commit/3c2093a6bd85e969c0f3cccfc213c9ebccdd7144))

## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)

**Note:** Version bump only for package lowdefy

# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)

### Bug Fixes

- **cli:** Do not exit dev server if the initial build fails ([41653f8](https://github.com/lowdefy/lowdefy/commit/41653f827ad25d56a1cd189dcb551f7ca4db6ef9)), closes [#711](https://github.com/lowdefy/lowdefy/issues/711)
- **cli:** Fix print tests in CI. ([6be137d](https://github.com/lowdefy/lowdefy/commit/6be137d45a6bfaf9a6c3a3254a7b5917893c4f6a))

### Features

- **build:** Add support for app default ref resolver function. ([b23e8c9](https://github.com/lowdefy/lowdefy/commit/b23e8c967ec1c48664a9aef954a0b53497af28d2))
- **cli:** Add option to configure cli from the lowdefy.yaml file ([e4f62d0](https://github.com/lowdefy/lowdefy/commit/e4f62d0cf4784ec1ffb872f876469fc6beea0efd))
- **cli:** Add watch and watchIgnore options to dev command ([9eaf3e8](https://github.com/lowdefy/lowdefy/commit/9eaf3e8adb39eca7e7c7a9c8fe131776960002c8))
- **docs:** Document \_ref resolver functions. ([446b383](https://github.com/lowdefy/lowdefy/commit/446b3833a9c3c861db609319ed11e1b14222327e))
- Make blocks server URL configurable. ([65c9fe7](https://github.com/lowdefy/lowdefy/commit/65c9fe79b254bf5a20b87e0a2ec4fdcd1ecd5427)), closes [#670](https://github.com/lowdefy/lowdefy/issues/670)

# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)

**Note:** Version bump only for package lowdefy

## [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

**Note:** Version bump only for package lowdefy

# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

**Note:** Version bump only for package lowdefy

## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package lowdefy

## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

**Note:** Version bump only for package lowdefy

# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

**Note:** Version bump only for package lowdefy

# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

### Bug Fixes

- **cli:** Open docs link in new tab. ([2da64c2](https://github.com/lowdefy/lowdefy/commit/2da64c2d8d0c9d58456c5c8df4a82836e7a623bf))

# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

**Note:** Version bump only for package lowdefy

# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package lowdefy

# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)

**Note:** Version bump only for package lowdefy

## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)

### Bug Fixes

- **deps:** update apollo server packages to v2.24.1. ([a538a22](https://github.com/lowdefy/lowdefy/commit/a538a22b6d5526678f3d8a1a7c86363a91b96992))
- **deps:** update apollo server packages to v2.25.0 ([bbe713d](https://github.com/lowdefy/lowdefy/commit/bbe713d1bb584e1dcba6db9b9bd46a8531d2e2e6))
- **deps:** update dependency dotenv to v10.0.0 ([19e6a71](https://github.com/lowdefy/lowdefy/commit/19e6a7186821a40b82a6c391646f64108a743b0a))
- **deps:** update dependency fs-extra to v10.0.0 ([d9ad1a5](https://github.com/lowdefy/lowdefy/commit/d9ad1a50b1184be4feb10dae90337a2d9e24d4e1))
- **deps:** update dependency js-yaml to v4.1.0 ([d3954f3](https://github.com/lowdefy/lowdefy/commit/d3954f30dd719deca4bc1383ba23a351a1b3b60b))
- **deps:** update dependency mssql to v7.1.0. ([becfe14](https://github.com/lowdefy/lowdefy/commit/becfe14c5dbaaf9c1729d1fd7e7ad6fa7eb60221))
- **deps:** update dependency pg to v8.6.0 ([630b448](https://github.com/lowdefy/lowdefy/commit/630b4484c99212aca614205ec848501bd5328215))

## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

### Bug Fixes

- **cli:** Fix CLI for previous lowdefy versions ([89b8533](https://github.com/lowdefy/lowdefy/commit/89b85332033c59b64904d693776d62fc82dd8817)), closes [#598](https://github.com/lowdefy/lowdefy/issues/598)
- **cli:** Fix dev server reload. ([af6e70d](https://github.com/lowdefy/lowdefy/commit/af6e70da762fe1212ea9a0ec6372f02d09c9a185))

## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)

### Bug Fixes

- **servers:** Append html when serving index from url root ([12cb782](https://github.com/lowdefy/lowdefy/commit/12cb7829460e05479fc7376f49b0defa0819afea))

## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

### Bug Fixes

- **cli:** Fix cli dev server missing import ([beff373](https://github.com/lowdefy/lowdefy/commit/beff37341b9d055028b44bfb662785ccfff100c4))

## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)

**Note:** Version bump only for package lowdefy

# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)

### Bug Fixes

- Rename appendHeader to appendHead. ([4e79736](https://github.com/lowdefy/lowdefy/commit/4e797363540bd0f5cfbe65928585012316b05a58))
- webpack config so that index.html is not minified. ([d9cbf8d](https://github.com/lowdefy/lowdefy/commit/d9cbf8df56f97116832a7038f026058f1d528dc6))
- **servers:** Express function changed to async. ([6df571b](https://github.com/lowdefy/lowdefy/commit/6df571b0475d946e6864c2824af36450b70a7fa0))

### Features

- Include contenthash in webpack output. ([dd2adbb](https://github.com/lowdefy/lowdefy/commit/dd2adbbaa195899c6986ca99934e19c4f6aeca21)), closes [#575](https://github.com/lowdefy/lowdefy/issues/575)
- **cli:** Add appendHead, appendBody and custom js scripts. ([0f74833](https://github.com/lowdefy/lowdefy/commit/0f74833914917e7fb5d2d51177e2010b698d1019))

# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)

### Bug Fixes

- Remove support for oracle db due to lack of apple silicon support. ([0a1ca68](https://github.com/lowdefy/lowdefy/commit/0a1ca687607e4d49bc6a0a46e6784eb9a957cd09))

## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

**Note:** Version bump only for package lowdefy

# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)

### Bug Fixes

- Make lgtm corrections. ([ef20857](https://github.com/lowdefy/lowdefy/commit/ef2085781aa245bf0d027ddec3511d949403bed9))
- **cli:** Fix webpack config mode, should be production. ([86d7f38](https://github.com/lowdefy/lowdefy/commit/86d7f38129e4f400299a5999e9f7fad0cb30451a))

# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)

### Bug Fixes

- Fix graphql-federated build, move knex dependencies to cli. ([ff32126](https://github.com/lowdefy/lowdefy/commit/ff321269bf46dd5f334a1f4e2c91c52b59b9dc67))
- Update react, react-dom and react-test-renderer to v17.0.2 ([78969ab](https://github.com/lowdefy/lowdefy/commit/78969abd39e8b04a7cddb39472985da6da50c7b9))

## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

**Note:** Version bump only for package lowdefy

## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

**Note:** Version bump only for package lowdefy

## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

**Note:** Version bump only for package lowdefy

## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

**Note:** Version bump only for package lowdefy

## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

**Note:** Version bump only for package lowdefy

## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package lowdefy

# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

**Note:** Version bump only for package lowdefy

## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

**Note:** Version bump only for package lowdefy

## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

### Bug Fixes

- **cli:** Fix dev server url paths for auth callback ([8cb2717](https://github.com/lowdefy/lowdefy/commit/8cb2717ea79e581e4f40e838b7798336caa210ee))

## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package lowdefy

## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package lowdefy

# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)

### Bug Fixes

- Update telemetry data field names. ([085e5cc](https://github.com/lowdefy/lowdefy/commit/085e5cc635f3eab2433f376de96af67a762f828f))

### Features

- Move all servers to expressed based apps. ([ffc6043](https://github.com/lowdefy/lowdefy/commit/ffc6043e0faf2812c31d3e25d794a64a154849d2))
- use setHeader plugin to set auth headers ([6238c6f](https://github.com/lowdefy/lowdefy/commit/6238c6f6ba6c1d24720f4867da7e5e577ff344d4))
- **graphql:** Add OpenID Connect flow queries. ([1ac0b3d](https://github.com/lowdefy/lowdefy/commit/1ac0b3d3180bd3bb5e9d47084125efba1e862715))

## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)

### Bug Fixes

- **cli:** Log info about created files in init ([bcb8933](https://github.com/lowdefy/lowdefy/commit/bcb89332aac6ac5a28b6ec2b08d6190ebd24b409))
- **docs:** Improve body markdown block ids in tutorial ([7e04786](https://github.com/lowdefy/lowdefy/commit/7e04786cff0b1a5fc9ed73a69fab8f54018c76a0))

## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

### Bug Fixes

- **cli:** Give dev command name to startup function. ([1ce7e3f](https://github.com/lowdefy/lowdefy/commit/1ce7e3fcf41669e5861ff8a5f25bd640179cfbfd))
- **cli:** Stop dev server if lowdefy version changes ([a944cc8](https://github.com/lowdefy/lowdefy/commit/a944cc819ee60df6371ae3cff1747ec14889c5dc)), closes [#447](https://github.com/lowdefy/lowdefy/issues/447)

# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)

### Bug Fixes

- **cli:** Log command and lowdefy version in error handler. ([6c1ed5b](https://github.com/lowdefy/lowdefy/commit/6c1ed5b4c29f94b95802f2081ee58db7d1ebe47f))
- **deps:** Update dependency apollo-server packages to v2.21.0 ([276012c](https://github.com/lowdefy/lowdefy/commit/276012c48283be64e60cbe00f7d8acf695773725))
- **deps:** Update dependency css-loader to v5.0.2. ([6dd6a82](https://github.com/lowdefy/lowdefy/commit/6dd6a82fa4e4975f201e0c22c6b5bf29cd0541e3))
- **deps:** Update dependency html-webpack-plugin to v5.1.0 ([d0dd688](https://github.com/lowdefy/lowdefy/commit/d0dd688816e3e9fc6ff56235698d3af4707eba5f))
- **deps:** Update dependency webpack to v5.22.0. ([bb9f69e](https://github.com/lowdefy/lowdefy/commit/bb9f69e29cbce728932ab512e12122ce3dc349cc))
- **deps:** Update dependency webpack-cli to v4.5.0. ([445d55c](https://github.com/lowdefy/lowdefy/commit/445d55ca12f720be9f09632a319c319323c7041c))
- **deps:** Update package commander to v7.1.0. ([e13945e](https://github.com/lowdefy/lowdefy/commit/e13945e5774078a9b55d8db7391dc4d9b82485c2))

### Features

- **cli:** Add init command to cli. ([ec496a5](https://github.com/lowdefy/lowdefy/commit/ec496a5e55caacf42f3fddccefca213778963f2a))
- **cli:** Check for outdated versions on startup. ([7236da3](https://github.com/lowdefy/lowdefy/commit/7236da312b2656464c0775e882fc58e11303944f))
- **cli:** Rename @lowdefy/cli package to lowdefy ([b73777a](https://github.com/lowdefy/lowdefy/commit/b73777a18f379c8cb2ffef7007ba487d4d1c051e))

# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

**Note:** Version bump only for package @lowdefy/cli

# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

**Note:** Version bump only for package @lowdefy/cli

## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)

### Bug Fixes

- Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))

## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/cli

# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

**Note:** Version bump only for package @lowdefy/cli

# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)

### Bug Fixes

- **cli:** Fix netlify build. ([3c930e8](https://github.com/lowdefy/lowdefy/commit/3c930e85010fcf85aae48eb07603412a31044c29))

### Features

- 🐢Redirect all paths to blocks-cdn. ([a45447a](https://github.com/lowdefy/lowdefy/commit/a45447ad1dacf977e487a020bd56080ae2b09792))

# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)

### Bug Fixes

- **cli:** Clean node_modules in netlify build before copying. ([9251d58](https://github.com/lowdefy/lowdefy/commit/9251d58a592d5cca83021f9d7a6701390defa1f9))
- **cli:** Fix function name case ([1ba1c65](https://github.com/lowdefy/lowdefy/commit/1ba1c65d7d01a808f5c1d06e0c95454bae9594d7))
- **cli:** Fix reload port clash when running multiple dev servers. ([4910718](https://github.com/lowdefy/lowdefy/commit/4910718f4ebe78105694a5943d96989f274c427a))
- **cli:** Only start server if initial build has completed. ([20cfcaa](https://github.com/lowdefy/lowdefy/commit/20cfcaa3d8f67816628f5001fbcc4ebb28b43123))
- **deps:** update dependency chokidar to v3.5.1 ([fe8ff89](https://github.com/lowdefy/lowdefy/commit/fe8ff892a770cac37cbba3b1244357aab5b68d28))
- **deps:** Update dependency copy-webpack-plugin to v7.0.0. ([901d412](https://github.com/lowdefy/lowdefy/commit/901d4126544dd4ee68d62bf520cdd4cc2b0d1dcc))
- **deps:** Update dependency graphql to v15.5.0 ([90acf72](https://github.com/lowdefy/lowdefy/commit/90acf7289c517f9afe066cd0706c64187a39648b))
- **deps:** Update dependency ora to v5.3.0. ([542c115](https://github.com/lowdefy/lowdefy/commit/542c1156c66c9926d89b751ed5b5bf44661a5d96))

# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)

**Note:** Version bump only for package @lowdefy/cli

# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)

### Bug Fixes

- **cli:** add dev server port option ([744ce51](https://github.com/lowdefy/lowdefy/commit/744ce51e9f0318211764d12d82c5e47a7f93c09a))
- **deps:** update apollo server packages to v2.19.1 ([#326](https://github.com/lowdefy/lowdefy/issues/326)) ([8b977e3](https://github.com/lowdefy/lowdefy/commit/8b977e363930b2c5b639fd4455751d81e3487570))
- **deps:** update apollo server packages to v2.19.2 ([68f89d0](https://github.com/lowdefy/lowdefy/commit/68f89d0b9a131bfd031af5a95f9b71b276efa275))
- **deps:** update dependency axios to v0.21.1 [security] ([99d91ed](https://github.com/lowdefy/lowdefy/commit/99d91edce62a5e7c9d98f94f12bbcc1754cee303))
- **deps:** update dependency chokidar to v3.5.0 ([#329](https://github.com/lowdefy/lowdefy/issues/329)) ([3e79f6f](https://github.com/lowdefy/lowdefy/commit/3e79f6f55419995437210f091d39775d3e6fd47d))
- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))

### Features

- **cli:** Rename version field in lowdefy.yaml to lowdefy. ([51ed277](https://github.com/lowdefy/lowdefy/commit/51ed277a0525c1fd6eca426f709a50852b764ece))

# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)

### Bug Fixes

- **cli:** add dev server port option ([744ce51](https://github.com/lowdefy/lowdefy/commit/744ce51e9f0318211764d12d82c5e47a7f93c09a))
- **deps:** update apollo server packages to v2.19.1 ([#326](https://github.com/lowdefy/lowdefy/issues/326)) ([8b977e3](https://github.com/lowdefy/lowdefy/commit/8b977e363930b2c5b639fd4455751d81e3487570))
- **deps:** update apollo server packages to v2.19.2 ([68f89d0](https://github.com/lowdefy/lowdefy/commit/68f89d0b9a131bfd031af5a95f9b71b276efa275))
- **deps:** update dependency axios to v0.21.1 [security] ([99d91ed](https://github.com/lowdefy/lowdefy/commit/99d91edce62a5e7c9d98f94f12bbcc1754cee303))
- **deps:** update dependency chokidar to v3.5.0 ([#329](https://github.com/lowdefy/lowdefy/issues/329)) ([3e79f6f](https://github.com/lowdefy/lowdefy/commit/3e79f6f55419995437210f091d39775d3e6fd47d))
- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))

### Features

- **cli:** Rename version field in lowdefy.yaml to lowdefy. ([51ed277](https://github.com/lowdefy/lowdefy/commit/51ed277a0525c1fd6eca426f709a50852b764ece))

# [3.1.0](https://github.com/lowdefy/lowdefy/compare/@lowdefy/cli@3.0.0-alpha.7...@lowdefy/cli@3.1.0) (2020-12-15)

### Bug Fixes

- **cli:** Use startUp function in clean-cache command ([cc6ffa0](https://github.com/lowdefy/lowdefy/commit/cc6ffa07930792a574ee76f657b61eefcf9d1156))
- **deps:** update dependency commander to v6.2.1 ([71d62c9](https://github.com/lowdefy/lowdefy/commit/71d62c9e69024139043ee6aab3c6903c0a643c35))

### Features

- **cli:** add app and machine ids to telemetry ([a3a2bc0](https://github.com/lowdefy/lowdefy/commit/a3a2bc0e1500e9bb0f9feed507d54d356d7a1859))
- **cli:** add disable telemetry flag ([c97cde4](https://github.com/lowdefy/lowdefy/commit/c97cde45117a3bcc0dc11711a81cc7f5f5e5f275))
- **cli:** add telemetry ([3ce6dc5](https://github.com/lowdefy/lowdefy/commit/3ce6dc5b5b0f50733fffb92d6f4f0a9fa7b8c560))
- **cli:** Clean block meta cache on build and dev commands. ([4fb5fbd](https://github.com/lowdefy/lowdefy/commit/4fb5fbd3c35aeaab75238298e95b88676d63e2b6))
- **cli:** Log cli errors to lowdefy api. ([4e8ef7b](https://github.com/lowdefy/lowdefy/commit/4e8ef7b34615de4c3da7015721188b5d5bfa3224))
- **cli:** Shutdown development server if .env file changed. ([1a89a11](https://github.com/lowdefy/lowdefy/commit/1a89a11a3bf75c1c311f03bd00ebe3974274f240))

# [3.0.0](https://github.com/lowdefy/lowdefy/compare/@lowdefy/cli@3.0.0-alpha.7...@lowdefy/cli@3.0.0) (2020-12-15)

### Bug Fixes

- **cli:** Use startUp function in clean-cache command ([cc6ffa0](https://github.com/lowdefy/lowdefy/commit/cc6ffa07930792a574ee76f657b61eefcf9d1156))
- **deps:** update dependency commander to v6.2.1 ([71d62c9](https://github.com/lowdefy/lowdefy/commit/71d62c9e69024139043ee6aab3c6903c0a643c35))

### Features

- **cli:** add app and machine ids to telemetry ([a3a2bc0](https://github.com/lowdefy/lowdefy/commit/a3a2bc0e1500e9bb0f9feed507d54d356d7a1859))
- **cli:** add disable telemetry flag ([c97cde4](https://github.com/lowdefy/lowdefy/commit/c97cde45117a3bcc0dc11711a81cc7f5f5e5f275))
- **cli:** add telemetry ([3ce6dc5](https://github.com/lowdefy/lowdefy/commit/3ce6dc5b5b0f50733fffb92d6f4f0a9fa7b8c560))
- **cli:** Clean block meta cache on build and dev commands. ([4fb5fbd](https://github.com/lowdefy/lowdefy/commit/4fb5fbd3c35aeaab75238298e95b88676d63e2b6))
- **cli:** Log cli errors to lowdefy api. ([4e8ef7b](https://github.com/lowdefy/lowdefy/commit/4e8ef7b34615de4c3da7015721188b5d5bfa3224))
- **cli:** Shutdown development server if .env file changed. ([1a89a11](https://github.com/lowdefy/lowdefy/commit/1a89a11a3bf75c1c311f03bd00ebe3974274f240))

# 3.0.0-alpha.7 (2020-12-10)

### Bug Fixes

- **cli:** fix build script mf path ([1548905](https://github.com/lowdefy/lowdefy/commit/1548905af936bae93a249be73fb2ae5e51047150))
- **cli:** fix clean cache description and error messages ([a3a9ffc](https://github.com/lowdefy/lowdefy/commit/a3a9ffccb63ac4097da91a1feb08636caf5c4c81))
- **cli:** fix dev server static path ([b963569](https://github.com/lowdefy/lowdefy/commit/b963569387152af24938c2435319df4d6873da08))
- **cli:** fix test imports ([93d35e4](https://github.com/lowdefy/lowdefy/commit/93d35e453f596fdc10bc17d65511fa0ca982ef79))
- **cli:** node_modules should be moved to project root in build-netlify ([9c46108](https://github.com/lowdefy/lowdefy/commit/9c461084f847a9cb2c3bb11f1b923f323bb96ddd))
- **cli:** react and @lowdefy/block-tools should be dev deps ([3859a43](https://github.com/lowdefy/lowdefy/commit/3859a436fa476610c0c1ed0a97a9961394be9379))
- **cli:** update block-tools package version ([c24e31e](https://github.com/lowdefy/lowdefy/commit/c24e31efac6780f0378a9f557ac524154a6bf3b7))
- **deps:** update apollo graphql packages to v2.19.0 ([a620fb0](https://github.com/lowdefy/lowdefy/commit/a620fb077f6f2b5f826de3638246de9dbae9568a))
- **deps:** update dependency js-yaml to v3.14.1 ([935ad89](https://github.com/lowdefy/lowdefy/commit/935ad894cd221901784360bee684189a60a2d386))
- @lowdefy/block-tools version in cli ([2cc6ae2](https://github.com/lowdefy/lowdefy/commit/2cc6ae217ff81ffb5f6b024eb2e4ce89909fc9a6))
- ci test fixes ([1f2d71b](https://github.com/lowdefy/lowdefy/commit/1f2d71b50171bae23d835278cce6332b7815dc65))
- **deps:** update dependency chokidar to v3.4.3 ([89bcb1f](https://github.com/lowdefy/lowdefy/commit/89bcb1fda83e974f7ca360a7728736a2c784d1d7))
- **deps:** update dependency commander to v6.2.0 ([01781af](https://github.com/lowdefy/lowdefy/commit/01781af6d89c073fa6e0738f3fed713f2b2f6273))

### Features

- **blockTools:** bump version ([b450047](https://github.com/lowdefy/lowdefy/commit/b450047478ba55d93e233c839c77677c0114847a))
- **blockTools:** move module fed functions to blockTools ([5e6cebf](https://github.com/lowdefy/lowdefy/commit/5e6cebf6d0eaef1360ba1637e7135df52858fd16)), closes [#219](https://github.com/lowdefy/lowdefy/issues/219)
- **cli:** add build-netlify command ([c779ac7](https://github.com/lowdefy/lowdefy/commit/c779ac7c8aff9c43676b0a51fb31f2f83f055047))
- **cli:** add clean cache command ([1a97665](https://github.com/lowdefy/lowdefy/commit/1a976659c8fd0a0c27076a8b71fd5360f8907ee9))
- **cli:** add errorBoundary and getLowdefyVersion utils ([519e604](https://github.com/lowdefy/lowdefy/commit/519e6047714a8e32072eaacaa111eff666b69e71))
- **cli:** add ora spinners ([5ac00f5](https://github.com/lowdefy/lowdefy/commit/5ac00f50da8a7f4577291e4b0a2f1064c0686c51))
- **cli:** add output directory option to build ([6a09779](https://github.com/lowdefy/lowdefy/commit/6a097793f3c6d5cb6cf1f83c2ae8c4321fe4b28c))
- **cli:** add suport for user public assets in netlify build ([e11a9de](https://github.com/lowdefy/lowdefy/commit/e11a9de120f5d23ae62d3471cfba7e87060f74a7))
- **cli:** console output improvements ([9ea1c22](https://github.com/lowdefy/lowdefy/commit/9ea1c2279adcbe1d62412dde43dc1243e13d2b08))
- **cli:** dev server running ([8d33183](https://github.com/lowdefy/lowdefy/commit/8d331836156c9d16af4cb0adb637bd89d17b3043))
- **cli:** do not print in color in netlify builds ([ce5b29e](https://github.com/lowdefy/lowdefy/commit/ce5b29ed6392c94f086c299fda9c4a47be176695))
- **cli:** improve cli console logs ([7ca7509](https://github.com/lowdefy/lowdefy/commit/7ca7509e2696e2380a02aded5b22d6bd9b1ec62f)), closes [#247](https://github.com/lowdefy/lowdefy/issues/247)
- **cli:** improve errors ([dfa9629](https://github.com/lowdefy/lowdefy/commit/dfa96290e3e01371d12dd16182adc8dc7e21e905))
- **cli:** improve module federation, use @lowdefy/graphql-federated ([1139232](https://github.com/lowdefy/lowdefy/commit/11392323082b9c4105ebfc393aa83802f91f487c))
- **cli:** init cli with build command ([92fff8f](https://github.com/lowdefy/lowdefy/commit/92fff8f157ce6ac2d2df09dac7f8f2073e120b63))
- **cli:** init dev server ([7eae1a8](https://github.com/lowdefy/lowdefy/commit/7eae1a80f456f0987c8835a3966ca5a7a6a80018))
- **cli:** init loadBuildScriptToCache ([f2eabfa](https://github.com/lowdefy/lowdefy/commit/f2eabfae9232d151e1f9001d012b7e39c0fcdb13))
- **cli:** init module federation of build script ([34dba01](https://github.com/lowdefy/lowdefy/commit/34dba017246b38b940f6614d66def34844f9e961))
- **cli:** print tests, ux polish ([9b6a3e1](https://github.com/lowdefy/lowdefy/commit/9b6a3e199861301cd00a071f77f8c8e352f72c33))
- **cli:** read secrets from env, add dotenv ([6b9bd63](https://github.com/lowdefy/lowdefy/commit/6b9bd63e6f4f471450febae52e1149179dc3509d))
- **servers:** add logos, favicons and pwa icons ([fc8610e](https://github.com/lowdefy/lowdefy/commit/fc8610e7f529071fd9ce3961b3991cab2d7911bd))
