# Change Log

## 7.2.0

### Minor Changes

- afeec0b: feat(server-dev): Agent tools take a device

  - `lowdefy_screenshot_page` and `lowdefy_run_journey` take `device`, a phone's tab id from the new `lowdefy_device list`. Steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot` and `expect` with `state`) run on the phone in Lowdefy Dev by block id. A screenshot is taken with `xcrun simctl io` on a simulator, `adb exec-out screencap` on an Android device, or by Lowdefy Dev from its own view on a paired phone, and says which.
  - `lowdefy_inspect_state`, `lowdefy_snapshot_state` and `lowdefy_load_state` take `device` and read the phone's live state, or load a checkpoint into it.
  - New `lowdefy_device` tool: `list` the connected phones, booted simulators and Android devices; `start` Lowdefy Dev on a simulator or emulator, as `lowdefy dev --ios` or `--android` does; `inject` a phone's next scan, photo, NFC read, location, permission answer, push or network state. On an iOS simulator a location and permission are also set with `simctl`, and a push is delivered with `simctl push`.
  - `lowdefy_list_types` takes `target: web | mobile`; with `mobile` it lists the blocks, actions and client operators a native shell carries, which dev builds now write to `plugins/availableTypesMobile.json`.
  - Client errors in `lowdefy_build_status` carry `surface` (`web` or `mobile`, with the phone's shell version).
  - Lowdefy Dev names its platform and app id when it joins the dev server, and answers state checkpoint loads.
  - The simulator and emulator helpers of `lowdefy dev --ios` and `--android` move to `@lowdefy/node-utils`, shared with the dev server.

- 3080390: feat(cli): `lowdefy dev --ios`, `--android` and `--lan` put the app on a phone

  `lowdefy dev --ios` boots an iPhone simulator (or uses a booted one), installs Lowdefy Dev and opens the dev server in it. `--android` does the same on a connected phone or a running emulator, or starts the first Android virtual device, and connects it through `adb reverse`. Both reach the dev server on `localhost`, so nothing is exposed on the network. Until Lowdefy Dev builds are released, the build to install comes from `LOWDEFY_DEV_APP_IOS` (a simulator `.app`) or `LOWDEFY_DEV_APP_ANDROID` (an `.apk`). A missing `xcrun simctl` or `adb` stops the command with the install step to take.

  `lowdefy dev --lan [interface]` lets a phone on the local network connect. The server also listens on the first private network address, or on the interface you name, and prints that interface with a QR code of a `lowdefy-dev://connect` link. The link carries a pairing token that lasts for the dev session. A request or websocket from another machine without the token is answered 401, and even with it the dev tools (`/lowdefy-docs` and its MCP endpoint, `/api/dev-inspect`, `/api/dev-recording`, `/api/dev-tools`, `/lowdefy-feedback`) refuse it and the headless-user cookie is ignored.

  The dev mail sink prints the sign-in code of each email it catches (`code for ada@example.com: 482913`), which `lowdefy_dev_logs` also shows. `/api/client-error` in dev accepts requests with no Origin header, so errors from a simulator, a USB phone or a paired phone reach `lowdefy_build_status` like browser errors.

- 8b0c8be: feat(api): Link endpoints serve a file at a stable URL, and Tiptap editors save it with `imageSrc`

  An `Api` endpoint with `link: true` answers a `GET` on `/api/endpoints/<endpointId>/<path...>`: its routine runs as the signed-in caller, with `{ path, query }` as payload and the endpoint's `auth` applied, and the endpoint answers `302` to the URL its `:return` gives (an absolute http(s) URL or a path starting with `/`), with `Cache-Control: private, no-store`. Endpoint ids can hold slashes, so the longest link id the URL starts with wins. A signed-out caller on a protected link gets `401`, a caller without its roles `403`, a `:reject` its `:status` (default `400`), all with no body; an unknown id answers `404` (`401` to a signed-out caller on an app with auth), and any other error `500` with a fixed message. A payload its `payloadSchema` refuses answers `400` with no body. A `POST` to a link endpoint is refused as a missing endpoint, and the build refuses one as an MCP tool. The build refuses `link` on `InternalApi` and with `webhook` or `async`, and allows `:status`, not `:body`, on a `:reject` in a link endpoint. Link endpoints must have no side effects, since any page that embeds the URL can trigger the `GET`.

  `TiptapInput` and `TiptapMentionInput` take an `imageSrc` `_function`, called with `{ key, bucket, name, type }` once an image is uploaded; its string is the inserted `src`. It takes precedence over `downloadPolicyRequestId`, so no download request runs. Pointing it at a link endpoint lets the bucket behind inline images stay private.

- c23d09a: feat(shell): Lowdefy Dev connects to `lowdefy dev`, has a shake menu, and joins the dev tab channel so agents can drive it

  - `LOWDEFY_SHELL_VARIANT=dev | release` decides whether a shell carries the developer features. Lowdefy Dev builds as `dev`, every other shell as `release`, whose bundle leaves them out. `pnpm --filter=@lowdefy/shell check:release-bundle` fails a release bundle that holds the dev-tab client.
  - Lowdefy Dev connects to a dev server from a `lowdefy-dev://connect` link, a scanned QR code, a typed address or one of the last 5 servers. It asks "Connect to `<host>`?" before attaching to a server off the device; a simulator's localhost connects at once. A paired server's token goes with every request and websocket.
  - Shake the phone (or open `lowdefy-dev://menu`) for reload, switch server, clear data, logs, the block gallery and the shell version.
  - The open app joins the dev server's tab channel as a browser tab does: it reloads with empty page state when the dev server rebuilds, answers state inspection and operator evaluation in a browser tab's shape, and runs journey steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`) by block id, waiting for each action chain to finish.
  - The dev server lets a phone paired with `lowdefy dev --lan` answer on `/api/dev-inspect` and post to `/api/dev-recording`; its other dev tools stay on this computer. A tab that cannot read an event stream can poll `/api/reload?transport=poll`.

- 7b06be6: feat: Phone apps sign in with ordinary sessions sent as bearers

  An app with a `mobile:` section accepts its Better Auth session as `Authorization: Bearer <token>` on every route, for phone shells:

  - A phone signs in on Better Auth's own routes, such as `/api/auth/sign-in/email-otp`, and reads the session token from the `set-auth-token` response header. The header goes only to requests with no `Origin` and no cookies, so page script in a browser never sees it.
  - Bearer callers resolve like cookie callers, with the same roles, organization and caller stamp, and are read past the cookie cache: signing out, ending sessions or removing a member applies on the next call. Websockets accept the bearer on the upgrade.
  - `/auth/mobile?shell=<id>&state=<s>` is the page a shell opens in a system sign-in sheet for every other sign-in method. It sends a signed-out person through the app's sign-in page, then redirects to the shell's scheme with a one-time token that lasts one minute and works once.
  - The email code send is capped at 5 per address per 15 minutes.
  - New `mobile.auth` keys: `emailCode`, `unlock`, `unlockAfter`, `sharedDevice` and `sessionExpiresIn`, which gives phone sessions their own lifetime. A shell `scheme` must be a lowercase URL scheme and not a web one.

- 8158470: feat: Server routes for mobile shells

  - `GET /api/mobile/root` returns what a mobile shell syncs on start: the `mobile.menus` frame with the items the caller may open, menu icon data, the index of the mobile pages the caller may open with each page's hash and type set key, those type sets, `minShellVersion`, and placeholder theme fields. It answers 404 for an app without a `mobile` key. The dev server lists page paths only, without hashes or type sets.
  - `GET /api/page/*` sends an `ETag`, and both routes answer `304` to a matching `If-None-Match`.
  - Pages are gated by surface: a request with `x-lowdefy-shell` gets only pages listed in `mobile.pages`, and a browser never gets a page listed only there. The other surface answers `404` with `{ pageConfig: null, surface }`. Page access still comes from `auth.pages`.
  - `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` are served from `mobile.shells` when a shell declares iOS or Android signing details.
  - The dev server builds mobile pages on demand, resolving their blocks against the native block set.

- d80e12d: feat: The phone sign-in sheet asks to confirm, gives the phone its own session and returns by app link on Android

  - `/auth/mobile` no longer hands a session to a shell on a GET. A signed-in person sees "Sign in to <app> on this device?", naming the shell and the account, with Continue and Cancel. The one-time token is minted only when the page posts back from the app's own origin with its CSRF token. Cancel returns `error=cancelled` to the shell.
  - Continue creates a new session for the phone, with the browser session's active organization and the phone lifetime from `mobile.auth.sessionExpiresIn`. The browser's own session is never handed over, marked or extended, so signing out on the phone leaves the browser signed in. A browser session created inside this sign-in is ended once the phone has its own.
  - Shells send `platform=ios` or `platform=android` (now required). Android returns by the https app link `<app url>/auth/mobile/callback`, verified through `assetlinks.json`, instead of the shell's scheme, so no other app can receive the token. An Android shell needs `android.package` and `android.sha256` in `mobile.shells`. If the link is not verified, `/auth/mobile/callback` asks the person to return to the app and never shows the token. iOS keeps the shell's scheme.
  - The shell declares the app link in its Android manifest for each app's https url.

- 61ae799: feat: Dictation in the native Composer and AgentChat inputs

  - The native Composer and AgentChat inputs have a microphone button. It runs on-device dictation through `expo-speech-recognition`, shows a listening row with the partial transcript, and asks for microphone access with a warning and a Settings link when it is off. A spoken "for Sam, ..." in a Composer turns into a mention as typed text does.
  - The shell carries `expo-speech-recognition` 58.0.0 in the basic profile, with the microphone and speech recognition usage strings. The shell's `nativeVersion` is now 2, so this needs a new native build.
  - In Lowdefy Dev, `lowdefy_device` action `inject` takes kind `transcript` (`{ partials, final }` or `{ error }`) for what the next dictation session hears. With no injected transcript, Lowdefy Dev uses the phone's microphone.
  - Development builds hide the dev menu's floating tools button.

- 2ce6fa5: feat(mobile): Push and actionable notifications in every shell

  Every shell carries expo-notifications. `mobile.notifications` names the API endpoints the shell posts its push token to once signed in (`register`, with `{ token, expoToken, platform, provider, shellId, appVersion }`) and at sign-out (`unregister`), how a notification shows while the app is open (`foreground: banner | silent`), and categories of action buttons. A tap opens `data.path` and fires the `onNotificationAction` app event; a button with `endpointId` (Approve, or Reply with `input`) calls the endpoint without opening the app; `snooze: <minutes>` shows the notification again later. `onNotification` fires for a notification received while the app is open, and a push with `data.refreshWidgets` refreshes the widgets. New actions: `ScheduleNotification`, `CancelNotification`, `SetBadgeCount` and `RequestNotificationPermission`. `lowdefy_device inject` with kind `push` now shows the notification in Lowdefy Dev and can tap it or press a button; an APNs payload with `aps` still goes through `simctl push` on an iOS simulator.

- 0d53174: feat(server-dev): Remove the in-page annotation overlay

  The dev server no longer has the Cmd/Ctrl+/ annotation overlay or its `POST /lowdefy-feedback` route. Point a coding agent at the page instead: it can take screenshots and read live state through the dev server's MCP tools. Option/Alt+click to open a block's yaml in VS Code stays. The dev server's start-up notice now names Option/Alt+click for it, where it said Cmd/Ctrl+click. `lowdefy agent-setup` no longer writes the visual feedback section into AGENTS.md and the skill.

- d8f2f6d: feat(server-dev): A smaller dev server agent surface, so an agent session starts on about half the tokens.

  Removed dev tools: `lowdefy_list_plugins`, `lowdefy_get_plugin_doc`, `lowdefy_overview`, `lowdefy_scaffold_page`, `lowdefy_checkpoint`, `lowdefy_revert_checkpoint`, `lowdefy_snapshot_state`, `lowdefy_load_state`, `lowdefy_list_state_checkpoints` and `lowdefy_checkpoint_to_mocks`. The config and state checkpoint stores, the `?_checkpoint=` URL and the dev mock registry go with them. Use git for config checkpoints, `list_types` for a type's package, and `get_doc` or `search_docs` for plugin docs. `lowdefy_restart` stays, hidden.

  Merged: `lowdefy_eval_operator` is now the optional `expression` argument of `lowdefy_inspect_state`. It takes the same `pageId`, `pathParams`, `source`, `user` and `data` arguments, and returns `{ value, errors, source, reads }`, where `reads` names the paths the expression read. A dev server older than this release answers `expression` with plain state and no value.

  Removed HTTP routes under `/lowdefy-docs` that only mirrored a tool: `app-map`, `checkpoints*`, `state-checkpoints*`, `eval-operator`, `run-request`, `run-endpoint`, `inspect-state`, `screenshot`, `plugins`, `schema`, `examples`, `search`, `icons`, `plugin-doc`, `content` and `:kind`. `build-status`, `journey`, `mutants`, `page-config`, `find`, `events`, `restart`, `mcp` and `GET /lowdefy-docs` stay.

  The MCP instructions shrink from 7,000 to at most 2,500 characters, and the dev server's `tools/list` to at most 25,000. The journey step grammar is served only by `lowdefy_get_schema` with `kind: "journey-step"`. Tool results are compact JSON, and `lowdefy_get_page_config` now answers `{ page }`, or `{ block }` with the new optional `blockId` for one block's subtree, writing a page over 40,000 characters to `pageFile` instead. `GET /lowdefy-docs/page-config` still returns the full page.

  fix(cli): `lowdefy mcp` logs each tool call to `tool-calls.jsonl` in the Lowdefy home: the tool, the app, the time, the duration and whether it worked, with no arguments or results. The file stays on your machine and rolls over at 1 MB. `lowdefy agent-setup` no longer repeats the dev server rules between AGENTS.md and the `lowdefy-config` skill. Tests hold the shim's `tools/list` for a current server to 40,000 characters.

### Patch Changes

- 8d06d67: fix(servers): A session the server refuses no longer reloads the page until it fails

  When the server resolves a signed-in session to no caller (a removed member, or an invitee whose invitation expired or was cancelled after sign-in), the browser used to render the session's user anyway. Every response then named a different caller than the page showed, so the page reloaded and failed with "The server answered as a different user or organization than this page shows". The page now renders no caller in that case, matching the server. After a client-side sign-in with no navigation, the page asks `/api/user` once for the signed-in caller instead of rendering the session's user without roles or organization.

- c84f275: fix(client): A sign-in that stays on the page renders the signed-in user before the action returns

  A sign-in with `callbackUrl: false`, which stays on the page, now finishes by asking the server who signed in, as `UpdateSession` does, and renders that user before the `Login` action returns. The next action in the chain, such as a request, is answered as the user the page shows. Before, that request could reload the page and lose the page's state. If the page cannot get the signed-in user from the server, it reloads in place rather than failing a sign-in that succeeded.

- 9419d09: Cap the dev tab's event and call histories (dev only), close idle headless browsers after 45 s and keep at most 10 rendered instances per page in the tab list.
- 5d27806: An idle dev server now stops its Vite web server after 3 minutes with no use and no open tab, freeing several hundred megabytes, and starts it again on the next page request, tool call or journey. Status reads and reconnecting streams get a quick "idle" answer instead of waking it, and edits made meanwhile are built but wait for that request. `lowdefy_dev_status` reports such a server as `idle`.
- b596ef3: perf(server-dev): A fresh dev server answers after one config build, not two

  On a fresh checkout, the dev server's first config build cannot check plugins that are not installed yet. It installs them and builds again to run their checks, and that second build ran before the server started, so a large app took two full config builds to answer. The server now starts after the first build, and the second runs once it answers: `lowdefy_build_status` with `wait: true` waits for it, and open pages are not reloaded, since the checks change nothing they show. The checks it runs and the warnings it gives are unchanged.

- 8b1a252: The dev server keeps each plugin's type and message lists between config rebuilds, so a page or config edit no longer re-imports every plugin. A local plugin change, a `.env` change, a root `lowdefy.yaml` change and a `lowdefy_restart` read them afresh.
- fc5e7ff: fix(server-dev): The dev server opens one `build/reload` watcher for all open tabs instead of one per tab. The agent docs routes and the docs index load in the background after the server first answers, so a restart is ready sooner.
- df6fa3c: fix(build, cli, errors, server-dev): Dev tools and build errors keep their cause and location

  `@lowdefy/errors` exports `isExpectedError`, the one test for an expected outcome (a `UserError` or an auth refusal) versus a fault. The dev server's agent error feed uses it, so an auth refusal is no longer reported to an agent as an app error.

  When the server explains a browser error with a plugin schema error ("property title must be type string"), the agent feed records that error instead of the original "Error rendering block". Feed entries from the browser and the server carry the same fields, including `hint` and `configKey`.

  A dev tool (an MCP tool, a journey run, `run_endpoint`, the mutants route) that fails with an error of its own is logged with its stack, and the agent is told the tool failed rather than its app. Bad tool arguments are answered as `UserError`s. `run_endpoint` logs the caller's id instead of the whole user object.

  A plugin that fails to import gives its reason (a syntax error, a missing dependency) in the build error, and the build status keeps the cause and stack of an internal fault. Module entry and module var errors point at their line in `lowdefy.yaml`, and an invalid `config` or `theme` is a located `ConfigError`. The dev server's warnings are no longer printed as `ERROR` lines, and a crash in the dev server is printed whole rather than in fragments. A build artifact that is there but unreadable is reported instead of read as empty, and an `_js` map that fails to load is logged.

  The CLI's error telemetry sends the error name, a message cut to 300 characters and the stack frames, with the home directory replaced by `~`.

- e030f96: feat(cli): Test runs wait for a starting dev server, report their server's resources, and cap the data store's cache

  - `lowdefy test`, `lowdefy journeys harden` and `lowdefy journeys variants` wait up to 5 minutes for a dev server in the worktree that is still starting (for example after `lowdefy hub start .`), instead of booting a second one. A starting server whose `<basePath>/api/ping` answers counts as ready. If it never becomes ready, the run fails with `The dev server in this worktree did not become ready. See: lowdefy hub logs <dir>`.
  - When a run uses a running dev server, it warns about `--ref-resolver`, `--port`, `--dev-directory` or `--server-directory`, which that server ignores.
  - A run that started its own server ends with `Resources (approximate): server peak 0.71 GB, CPU 94 s, including data store and browsers.`, measured with `ps` every 5 seconds over the server's process tree (not on Windows). A run on a shared dev server says `Resources: not measured (shared dev server).`
  - The journey data store's MongoDB starts with a 0.25 GB WiredTiger cache, so it no longer grows toward half the machine's memory.

- 31d7de8: fix(journeys): `row` and `column` targets work on `Table` and `TableInput` blocks

  A journey step such as `click: { blockId: orders, row: 1, column: actions }` or
  `expect: { blockId: orders, row: 0, column: name, text: Jane }` only worked on `AgGrid*` blocks.
  It now finds the displayed row (zero-based) and the column `key` of a `Table` or `TableInput`
  too, and a click on a row button in a `Table` is recorded with the same `row` and `column`.
  Header rows, header cells and summary rows are not rows or cells. A `fill` in a `TableInput`
  cell is not covered yet: the cell shows its input only once an edit starts.

- 29fd1a6: feat(shell): Lowdefy Dev fakes device results for agents and records what you do on the phone

  - The dev-tab client answers `inject` requests: the next scan, photo or NFC read, a location or a route of them, a permission answer, and network offline or online. While offline, every fetch the app makes fails as it does with no network. Push injection is refused until the shell carries `expo-notifications`.
  - Device actions read injections through one helper, `injected(name)`, which returns nothing in a release shell. `GeolocationCurrentPosition` answers on the phone with an injected location, or a denied permission, in the web action's shape.
  - Lowdefy Dev records clicks, changes, Enter presses and page views by block id in the web recorder's record shape, labelled with the device and shell version, so `lowdefy journeys session` lists and prints phone sessions. Password inputs are never recorded.
  - The engine trace gains `reportInteraction` and `subscribeInteractions`, and the native renderer reports block presses and changes through them. The recorder's record building moves to `@lowdefy/client-core`, shared by the web and phone recorders.
  - A release shell no longer links `expo-sensors`, `react-native-view-shot` or, unless its shell config's `capabilities` include `camera`, `expo-camera`, and asks for none of their permissions. `check:release-bundle` runs `expo prebuild` and fails a release shell that still links them or asks for the camera it does not need.

- 5d21931: fix(server): the MCP endpoint answers `GET` with 405

  The MCP server is stateless and pushes no notifications, but a `GET /api/mcp` opened an event stream nothing wrote to, which MCP clients held open until the host's time limit. On a serverless host each one held a function until `maxDuration`. A `GET` now answers 405 with `Allow: POST` after the auth checks, as the MCP spec allows for a server without a stream, and clients stop opening one.

- 74122f0: Mobile apps are experimental: the `mobile` section and `offline` on requests build only when the app sets `config.experimental.mobile: true`. Without it the build fails with a message that names the flag. The new docs page, Mobile Apps (Experimental), covers the section, capability profiles, offline requests, sign-in and the phone dev loop.
- 023c4e1: fix(server-dev): Editing a block in a local plugin no longer restarts the dev server

  A local plugin with any server-side type (a connection, request, server operator, auth or agent type) restarted the dev server on every change to any of its files, blocks included. The restart drops page loads, screenshots and tool calls in flight until the new server answers, although Vite hot-replaces block code by itself. The dev server now restarts only when a changed file is one the server imports: it follows the imports of the build's server-side plugin import files through the local plugins' files, resolving package `exports` and `#` subpath `imports` the way the server does. This also restarts the server for code it imports that did not restart it before: a plugin that only holds steps, or a helper a connection imports from another local plugin. A changed `package.json` of a plugin the server imports from restarts it, and where the dev server cannot be sure (an import it cannot resolve, a dynamic import of a computed path), any change to that plugin restarts it as before. Every change still rebuilds the config.

- a461f7c: fix(deps): Update dependencies for security advisories

  - vite 8.0.16 -> 8.1.6: the dev server no longer serves files outside `server.fs.allow` when a project path matches a system path, and launch-editor's command handling is fixed.
  - @modelcontextprotocol/sdk 1.31.0 -> 1.32.2: bounds request validation memory, ties experimental tasks to their session, checks a bearer token's audience and stops forwarding headers on cross-origin redirects.
  - hono 4.13.7 -> 4.13.14: `serveStatic` no longer decodes the path a second time, which let a request bypass middleware.
  - dompurify 3.4.16 -> 3.4.17: fixes three sanitizer bypasses, one critical.
  - markdown-it 14.3.1 -> 14.3.3, nodemailer 10.0.13 -> 10.1.7 and undici 7.30.0 -> 7.30.1.

- 6c53753: perf(server-dev): Vite skips the build artifact folders no module imports, and the editor hover resolves once per frame.

  Vite no longer watches `build/pages`, `build/api`, `build/connections`, `build/agents` and `build/jitMaps`, which hold thousands of files in a large app that the server reads from disk and no module imports. The Option/Alt hover in the editor-link overlay now calls `elementFromPoint` and `getBoundingClientRect` at most once per animation frame instead of on every pointer move.

- 3af2019: fix(api, servers, connection-mongodb): Server errors are classified, located and logged the same way everywhere

  Every server site that tells an expected outcome from a fault now asks `isExpectedError`, so an auth refusal or a `UserError` is one warn line on every path: a nested `CallApi`, a websocket frame, a background run, an optional Dynamic block, an MCP tool call and the server error handlers. Faults reach a `handleError` sink instead of a raw `logger.error`: a background, detached or forwarded-cron run that fails, an optional Dynamic block that falls back, an unwalled connection that reaches walled data, an MCP `afterToolCall` hook that fails before its routine runs, an auth email send, and an auth engine error, which goes to a system context's sink. A detached `CallApi` whose dispatch `/api/detached` does not accept is now a fault rather than a completed dispatch. The request context is set before authentication runs, so a fault there is logged with the request id.

  The prod log and Sentry no longer carry `received`, an operator's or control's evaluated input. BetterAuth's own log lines carry an error under `err` and name other values by type only. A connection error that is already typed leaves a request with the step's ids and its cause summarised, and a websocket source's failure is wrapped like a request's, without its evaluated properties. An auth hook that returns a non-object names its type, not the record.

  A MongoDB error that refuses the request (a duplicate key, a malformed pipeline, a missing permission or collection) is now a `RequestError` with the same `code` and `hint`; only a time or memory limit stays a `ServiceError`. A failed unique index build at auth startup names the index and code instead of quoting the duplicate values.

  Config faults carry their config location: endpoint control errors (`:for`, `:while`, `:if`, `:switch`, `:parallel_for`, `:log`) are `ConfigError`s at the control, and the detached `CRON_SECRET` check, cron forwarding, the auth secret, the invitation sender and the auth email connection name theirs. An auth hook's `:throw` now refuses the write with a 400 instead of a 500.

  On the server, `_log` writes an info line through the request's logger instead of `console.log`, so secrets and values marked with `_credential` are removed from it like from every other log line. In the browser it still logs to the console.

- 3be80ec: chore: Lowdefy's tests run on vitest instead of jest 28, and the dev server watches files with chokidar 4 instead of chokidar 3, so `braces` no longer comes in through either. `--watch` and `watchIgnore` globs still apply. `@lowdefy/block-dev`'s test helpers now register their tests with vitest and create their mocks with `vi.fn`, so a block package that uses them runs its tests on vitest.
- Updated dependencies [ff71016]
- Updated dependencies [a41d898]
- Updated dependencies [afeec0b]
- Updated dependencies [dc785ea]
- Updated dependencies [029208c]
- Updated dependencies [bb799e9]
- Updated dependencies [b7b8445]
- Updated dependencies [09dbbee]
- Updated dependencies [163905d]
- Updated dependencies [e1cf57e]
- Updated dependencies [f9cafb7]
- Updated dependencies [4d72041]
- Updated dependencies [c84f275]
- Updated dependencies [9c044eb]
- Updated dependencies [9419d09]
- Updated dependencies [df6fa3c]
- Updated dependencies [02842fe]
- Updated dependencies [d143e29]
- Updated dependencies [58f2500]
- Updated dependencies [344c002]
- Updated dependencies [7e24234]
- Updated dependencies [31d7de8]
- Updated dependencies [8b0c8be]
- Updated dependencies [29fd1a6]
- Updated dependencies [3f4c3f8]
- Updated dependencies [82d304d]
- Updated dependencies [ba2ab81]
- Updated dependencies [10903fd]
- Updated dependencies [02cf4b1]
- Updated dependencies [7b06be6]
- Updated dependencies [2248ec5]
- Updated dependencies [7416223]
- Updated dependencies [74122f0]
- Updated dependencies [f05943c]
- Updated dependencies [083821c]
- Updated dependencies [8158470]
- Updated dependencies [8972d38]
- Updated dependencies [d80e12d]
- Updated dependencies [9aa9608]
- Updated dependencies [b54d521]
- Updated dependencies [3f8aa1f]
- Updated dependencies [5b19a85]
- Updated dependencies [988fc30]
- Updated dependencies [73fefe9]
- Updated dependencies [8e4dfc8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [2f7a526]
- Updated dependencies [bd50d64]
- Updated dependencies [8736703]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [54f0579]
- Updated dependencies [64159ca]
- Updated dependencies [048e010]
- Updated dependencies [78e54ea]
- Updated dependencies [9e97d17]
- Updated dependencies [0ccbe0c]
- Updated dependencies [2ce6fa5]
- Updated dependencies [2ce6fa5]
- Updated dependencies [1663aa9]
- Updated dependencies [bb7c249]
- Updated dependencies [4210b1d]
- Updated dependencies [2ce6fa5]
- Updated dependencies [2ce6fa5]
- Updated dependencies [20dd549]
- Updated dependencies [dfdb8ab]
- Updated dependencies [ab1f114]
- Updated dependencies [0d53174]
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [0f0cd03]
- Updated dependencies [a461f7c]
- Updated dependencies [3af2019]
- Updated dependencies [7aec569]
- Updated dependencies [d8f2f6d]
- Updated dependencies [12bb05c]
- Updated dependencies [fcea703]
- Updated dependencies [9226424]
- Updated dependencies [26333a9]
- Updated dependencies [ff7e31a]
- Updated dependencies [1ffabe9]
- Updated dependencies [b1d42ca]
- Updated dependencies [4d548e9]
- Updated dependencies [9085f6d]
- Updated dependencies [70ef067]
- Updated dependencies [c7c1693]
- Updated dependencies [962ac05]
- Updated dependencies [837d529]
- Updated dependencies [f51a6cc]
- Updated dependencies [9d5eb24]
- Updated dependencies [732646e]
- Updated dependencies [0dd2e9d]
  - @lowdefy/api@7.2.0
  - @lowdefy/build@7.2.0
  - @lowdefy/node-utils@7.2.0
  - @lowdefy/docs-content@7.2.0
  - @lowdefy/blocks-aggrid@7.2.0
  - @lowdefy/engine@7.2.0
  - @lowdefy/client@7.2.0
  - @lowdefy/operators-js@7.2.0
  - @lowdefy/client-core@7.2.0
  - @lowdefy/plugin-better-auth@7.2.0
  - @lowdefy/errors@7.2.0
  - @lowdefy/blocks-antd@7.2.0
  - @lowdefy/blocks-table@7.2.0
  - @lowdefy/connection-mongodb@7.2.0
  - @lowdefy/helpers@7.2.0
  - @lowdefy/e2e-utils@7.2.0
  - @lowdefy/blocks-tiptap@7.2.0
  - @lowdefy/actions-core@7.2.0
  - @lowdefy/block-utils@7.2.0
  - @lowdefy/blocks-basic@7.2.0
  - @lowdefy/blocks-markdown@7.2.0
  - @lowdefy/operators-change-case@7.2.0
  - @lowdefy/operators-cron@7.2.0
  - @lowdefy/operators-dayjs@7.2.0
  - @lowdefy/operators-diff@7.2.0
  - @lowdefy/operators-mql@7.2.0
  - @lowdefy/operators-nunjucks@7.2.0
  - @lowdefy/operators-uuid@7.2.0
  - @lowdefy/operators-yaml@7.2.0
  - @lowdefy/connection-axios-http@7.2.0
  - @lowdefy/logger@7.2.0
  - @lowdefy/layout@7.2.0
  - @lowdefy/blocks-antd-x@7.2.0
  - @lowdefy/blocks-loaders@7.2.0
  - @lowdefy/websockets-core@7.2.0
  - @lowdefy/blocks-echarts@7.2.0
  - @lowdefy/blocks-captcha@7.2.0

## 7.1.0

### Minor Changes

- ffc060c: feat(server-dev): A journey data set run gives each database your connections name a database of its own

  An app that reads several MongoDB databases can now seed a collection name in each of them. Connections with the same `databaseUri` secret (or literal) and `databaseName` share one run database, and connections that differ in either read different ones, as they do outside the run. Before, every connection read one run database, so a data set that seeded `users` in the app's database could not also seed `users` in an auth database: the journey was refused. That refusal and its warning are gone. A connection whose `databaseUri` or `databaseName` is computed per request reads the run's first database. The run still drops all its databases when the journey ends.

### Patch Changes

- d197cb4: fix(server-dev): Build status no longer says ok while a page fails to build

  The dev server builds each page when it is first requested, after the config build. `lowdefy_build_status` and `GET /lowdefy-docs/build-status` took their top-level `build.status` from the config build alone, so it read `ok` while a page failed, and the failure showed only in `pages.failed` further down. Agents that read the top line moved on with a broken page.

  `build.status` now reads `pages_failed` when the config builds but a page failed its latest build and has not changed since, and `build.failedPages` names those pages. A failed page that changed after that build is not counted until it is rebuilt, since its failure may already be fixed. Each page's errors stay under `pages.failed`. `error` still means the config build itself failed and the dev server is serving the previous build; it names no failed pages. `build.configStatus` is the config build's own status, and `lowdefy journeys harden`, which waits for a successful config build after an edit, reads it. `lowdefy_dev_status` reports the number of failed pages as `failedPageCount`.

- 3408010: fix: `lowdefy build` no longer warns `Plugin checks for <package> did not run: package not installed.` for plugins that have nothing to check.

  A clean build warned for every plugin the server had not installed yet, including connection plugins like `@lowdefy/connection-mongodb` that ship no build check rules. The warning now names only plugins that own a block, action or operator type, and `lowdefy build` gives it only from the build after it installs the app's plugins, so it shows a plugin that is still missing rather than one it was about to install. `lowdefy dev` does the same when it starts. Journeys and dev page builds still warn for a missing block, action or operator plugin. `--skip-plugin-checks` no longer gives this warning.

- Updated dependencies [96d6f1c]
- Updated dependencies [b1d58df]
- Updated dependencies [d197cb4]
- Updated dependencies [c6d665a]
- Updated dependencies [3408010]
- Updated dependencies [3df29f3]
- Updated dependencies [1e614fc]
- Updated dependencies [a589bb1]
  - @lowdefy/blocks-aggrid@7.1.0
  - @lowdefy/docs-content@7.1.0
  - @lowdefy/blocks-antd@7.1.0
  - @lowdefy/build@7.1.0
  - @lowdefy/engine@7.1.0
  - @lowdefy/blocks-table@7.1.0
  - @lowdefy/blocks-tiptap@7.1.0
  - @lowdefy/api@7.1.0
  - @lowdefy/client@7.1.0
  - @lowdefy/blocks-antd-x@7.1.0
  - @lowdefy/layout@7.1.0
  - @lowdefy/actions-core@7.1.0
  - @lowdefy/blocks-basic@7.1.0
  - @lowdefy/blocks-captcha@7.1.0
  - @lowdefy/blocks-echarts@7.1.0
  - @lowdefy/blocks-loaders@7.1.0
  - @lowdefy/blocks-markdown@7.1.0
  - @lowdefy/connection-axios-http@7.1.0
  - @lowdefy/connection-mongodb@7.1.0
  - @lowdefy/operators-change-case@7.1.0
  - @lowdefy/operators-cron@7.1.0
  - @lowdefy/operators-dayjs@7.1.0
  - @lowdefy/operators-diff@7.1.0
  - @lowdefy/operators-js@7.1.0
  - @lowdefy/operators-mql@7.1.0
  - @lowdefy/operators-nunjucks@7.1.0
  - @lowdefy/operators-uuid@7.1.0
  - @lowdefy/operators-yaml@7.1.0
  - @lowdefy/plugin-better-auth@7.1.0
  - @lowdefy/websockets-core@7.1.0
  - @lowdefy/block-utils@7.1.0
  - @lowdefy/e2e-utils@7.1.0
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

- ed342ae: Doc search ranks by words, and covers the app's own plugins and modules.

  - `lowdefy_search_docs` and `GET /lowdefy-docs/search` split the query into words and rank pages by how many match, title matches first. A query like "Link action pathParams path parameters" now finds the Link action page.
  - Each hit names its `source` (`core`, `plugin`, `local-plugin` or `module`), package and version. Pass `source` (`&source=` on the route) to search one source.
  - The docs your app's plugins and modules ship are searched and read like the core docs, local plugins and `file:` modules included. `lowdefy_get_doc` returns a plugin's README as `plugins/<package>`, a `docs/*.md` file as `plugins/<package>/<file>`, and the same for modules under `modules/<id>`. A plugin docs file named after a type is that type's doc.
  - `modules/<id>/manifest` lists the vars (type, required, description, default), components and exports a module's `module.lowdefy.yaml` declares.
  - The dev server reads these docs when it starts and again when plugins or modules change. A config-only edit does not re-read them.
  - Only files inside a plugin or module are served: a README or docs file that links outside it is left out. A part of `module.lowdefy.yaml` with the wrong shape is named on the manifest page instead of failing the docs tools.

- f7fa621: feat(agent): agent calls carry the page's path parameters

  `AgentChat` sends the page's `pathParams` with each call next to `urlQuery`, the agent route accepts them, and the page-context option adds a `pathParams` line to the agent's instructions when the page has any. A record id moved from the query into the page path is still known to the agent. Links in agent messages are resolved to their page and path values through the engine's path memory.

- 099d412: AgentChat: send `sharedState` as read-only context

  - **`sharedStateReadOnly: boolean`** (default `false`). When `true`, the block still sends `sharedState` with each turn (to `_payload`, and to the agent's context block with `pageContext: true`), but the server does not register the `update-page-state` tool, so the model is never offered a write to page state. Use it to give an agent context such as the current time or the record on screen when some of those values are also bound to inputs the agent should not change. Without it, an app that wanted context but no writes had to list every other tool in the agent's `activeTools`.

- 07a67b5: AI requests take `maxOutputTokens` and `timeout`, and a closed request cancels its model call.

  - `GenerateText`, `GenerateObject` and `Decide` take `timeout`: the milliseconds a model call may take, retries included, before it is cancelled. `Decide` also takes `maxOutputTokens`.
  - The `Anthropic`, `OpenAI`, `Google` and `AIGateway` connections take `maxOutputTokens` and `timeout` as defaults for every request and agent on the connection that does not set its own.
  - Request resolvers receive `signal`, which aborts when the request that started the work closes: when the server's request timeout (`config.requestTimeout`) answers first, or, on the Node server, when the client disconnects. The AI requests pass it to the model call, so a call that nobody is waiting for stops instead of running, and billing, to its end. A call stopped by the request timeout fails with a `ServiceError`. A call stopped because the client left fails with a `UserError`, which is logged as a warning.
  - Work that outlives its request is not cancelled with it: endpoints with `async: true`, detached runs, and agent chat turns, which still run to their end so `onFinish` hooks save the conversation. A `CallAgent` step is cancelled with the routine that runs it.

  A synchronous routine that kept running after its request timed out now has its AI calls cancelled at the timeout. Use `async: true` for work that takes longer than `config.requestTimeout`.

- 2dab826: chore: Update antd to 6.6.5 and Ant Design X to 2.9.0.

  antd moves from 6.3.1 to 6.6.5, `@ant-design/x` and `@ant-design/x-markdown` from 2.7.0 to 2.9.0,
  and `@ant-design/icons` from 6.1.0 to 6.3.4. Custom block plugins that import from `antd`
  directly should pin `antd@6.6.5` so the app keeps a single copy of antd.

- fd3c3aa: `lowdefy_build_status` takes `wait: true` (`GET /lowdefy-docs/build-status?wait=true`): it answers once the dev server has processed your latest edits — the rebuild or page invalidation they trigger, and any server restart or plugin install they need (a new connection type, a new plugin package, a `.env` change) — instead of with the build before them. After `lowdefy_restart`, the same call waits for the restarted server to be ready. One call returns the result of the edit the agent just made, with no polling. It waits up to a minute and says `settled: false` if it gives up. The MCP instructions, `lowdefy agent-setup` guidance and docs tell agents to call it this way after every edit.
- 24383b5: Add `lowdefy test`, which runs an app's config tests: the journeys committed in `tests/journeys/*.yaml`. Each journey names a page, an optional inline user object and a list of declarative steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`, `expect`). The command boots the development server headless on a free port (or targets a running one with `--url`), runs every journey through `POST /lowdefy-docs/journey`, prints `PASS`/`FAIL` per journey with the failing step's index, `expected` and `actual`, and exits `1` when any journey fails. `--filter <name>` narrows the run. Journey files are validated against a schema; an invalid file is reported as a failed journey without aborting the run.

  - **Journeys fail at the step that causes an app error**: an action that fails with an error that is not a user error, an uncaught exception or an error the page reports, a request or endpoint that throws on the server, or a 5xx from one. Errors raised while the first page opens (its `onInit` and `onMount` requests) fail the journey on open. `lowdefy test` prints the step and each error's kind, message and config file and line; the journey route's result carries them as `failure.errors`, each with a stable finding key. Only errors a journey's own browsers cause count, and they are reported in its result, not in the dev server's build status or event stream. Expected outcomes never fail a journey: a failed `Validate`, a `Throw` action or any other user error, and 401 or 403 refusals. Where an error is the outcome the app means, assert it with `expect: { error: <text> }` straight after the interaction that raises it: it claims that interaction's errors whose message contains the text, and fails when none does.
  - **Every reference is checked before its step runs.** A blockId, request, endpoint or `goto` page the step names that is not in the app's build, or an `as` name that is not a data set user, fails the step naming the unknown id.
  - **`wait: { request }` waits for a fresh call**: one started since the last interaction (or since the page opened, before the first). `wait: 3000` is shorthand for `wait: { ms: 3000 }`.
  - **The step grammar is a JSON schema**: `GET /lowdefy-docs/schema/journey-step/all` returns every step and `/lowdefy-docs/schema/journey-step/wait` one step, the `lowdefy_get_schema` MCP tool takes `kind: "journey-step"`, and `@lowdefy/node-utils` exports it as `journeyStepSchema`.

- 81a5ad3: Client navigation by path. The production, e2e and dev clients fetch pages by URL path and learn the page id and path values from the server. Each set of path values is its own page instance: `Client` keys the page tree by the instance key, so following a link from one ticket to another remounts the page, and passes `pathParams` to the page context. The engine keeps up to 10 instances per page and gives actions `getPathParams`. The shown page is written to the path memory before its context is built, and auth callbacks write their target before navigating. A navigation to the path the shown page was matched on skips the fetch, unless the page is dynamic. The router's location carries the path instead of a page id. `setUrlQuery` waits for a page refetch only on dynamic pages.
- ef2b0c7: feat(server-dev): The dev server checks Lowdefy's agent instructions and reports what it finds apart from build warnings

  The dev server reads the `lowdefy-agent-rules` block that `lowdefy agent-setup` writes into `AGENTS.md` or `CLAUDE.md`, and reports a notice when the block comes from a different Lowdefy minor version than the app runs, when the block is in `AGENTS.md` but the root `CLAUDE.md` does not import it with `@AGENTS.md`, or when the block is missing from a project whose `.mcp.json` names the `lowdefy` server. Notices appear in build status's new `agentFiles` field (`lowdefy_build_status` and `GET /lowdefy-docs/build-status`), never among the build's warnings, and are checked again on every read, so a fix shows at once. The dev server also logs them once when it starts. `lowdefy mcp` passes each notice to the agent once per session for each app, and again only when its text changes, so it does not repeat after every edit; `GET /lowdefy-docs/build-status` reports them on every read. Each notice tells the agent to pass the fix to the developer rather than run agent-setup itself. The check only reads files, and apps on `lowdefy: local` get no version or missing-block notice.

- 9697b22: feat(server-dev): Dev server browser tools use the Playwright headless shell and close the browser when idle

  Screenshots, journeys, headless state inspection, operator evaluation and state loads now launch Playwright's `chromium-headless-shell` instead of system Google Chrome. Measured with the same Playwright version, one open page takes about 79 MB instead of 391 MB, an idle browser 29 MB instead of 99 MB, and a launch takes under a second instead of 1.5 to 7 seconds.

  - When the shell is missing, the dev server downloads it itself the first time a browser tool needs it (about 100 MB, once per machine and Playwright version), in a separate short-lived process. Meanwhile the call uses system Chrome if it is installed; with neither, it waits for the download. A download that has not finished within 3 minutes is stopped and counts as failed: Playwright's installer can stall while unzipping on Node 26, where installing with Node 22 works. A shell left half-installed by a stopped download is installed again the next time it fails to launch. Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to turn the download off, or install it yourself with `npx playwright install chromium-headless-shell`.
  - The browser closes after 90 seconds with no open page and no browser tool call, and relaunches on the next call, so a dev server that runs for hours no longer holds a browser it used once.
  - The dev server tags every browser it launches and kills it when the server process that launched it exits for any reason. A server killed outright no longer leaves a system Chrome running.
  - The server no longer loads Playwright at start-up, which shortens every server start and restart by about half a second.

- f9e483f: feat: The dev server records journeys

  `lowdefy dev` now records how you use your app in the browser, locally, so an agent can turn what you tried into journeys. Recordings stay in `.lowdefy/traces/` on your machine, are kept for 7 days or 200 MB, and never include password fields. Set `LOWDEFY_DEV_RECORD=false` to turn recording off. `lowdefy agent-setup` now also installs a `journeys-from-dev` skill.

- 588344b: feat: Dev tools build status and request runner report the config you just edited

  The dev server builds a page only when it is requested, so agent tools could answer from a page's previous build after an edit. They now tell the truth about pages built on request:

  **Build status (`lowdefy_build_status`, `GET /lowdefy-docs/build-status`)**

  - With `wait: true`, build status builds every page your edit touched before it answers, whether or not anything has opened the page since. A new `pages` section lists the pages it built (`checked`), the pages whose last build failed with their errors and source file (`failed`), pages changed on disk that the dev server has not rebuilt (`changedSinceBuild`), and how many pages nothing has built since the dev server started (`unbuilt`).
  - Browser and server errors carry the build they happened under (`buildId`). Errors reported before the latest config build or page edit are listed apart under `earlierErrors`, so errors that may already be fixed no longer read as live.
  - A build that fails with an internal error now reports the error's message, stack and the config file being resolved, instead of only "Build failed due to internal error. See above for details."

  **Request and endpoint runners (`lowdefy_run_request`, `lowdefy_run_endpoint`)**

  - `lowdefy_run_request` builds the page first when it changed since its last build, so it runs the request in the config now rather than the page's previous build. A page that fails to build is refused with its `buildErrors`, and a result from a page whose edit the dev server has not picked up yet carries a `staleConfig` note.
  - A response over 40,000 serialized characters is no longer cut to a string prefix. It is written in full to a JSON file under `.lowdefy/responses/` in the app directory, and the result carries `responseFile`, `responseChars` and, for an array, `responseItems`. The new `saveResponse: true` option writes any response there. Only the 20 most recent response files are kept.

- abb3f27: feat(server-dev): Every dev tool that acts as someone takes the same `user` option

  `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator`, `lowdefy_load_state`, `lowdefy_run_request` and `lowdefy_run_endpoint` now take `user` in the forms `lowdefy_run_journey` already took: a user object, `"none"` to act signed out, or the name of a user in a journey data set together with `data`. With a data set the call acts as that user and runs on a fresh database of its own loaded with the data set, as a journey with `data` does, so an agent can check a page, a request or an endpoint as a real user without hand-made cookies or scripts. `lowdefy_run_endpoint` keeps `system: true` as its only other form. Every tool description carries the same sentence explaining the option, and the `/lowdefy-docs` routes take the same `user` and `data` params.

- 73642f1: feat(dev): Screenshot viewport and colour scheme, smaller journey results, and Back, title and segmented-control steps for journeys.

  **Screenshots (`lowdefy_screenshot_page`)**

  - New `width`, `height` and `colorScheme: 'light' | 'dark'` options check a phone layout or dark mode, e.g. `{ "width": 390, "colorScheme": "dark" }`. The REST route takes them as `?viewportWidth=390&viewportHeight=844&colorScheme=dark`, since `width` and `height` there already name the clip.

  **Journeys (`lowdefy_run_journey`, `POST /lowdefy-docs/journey`, `lowdefy test`)**

  - A final page state over 10000 characters is no longer returned whole: the result carries `stateOmitted` with its size and each top-level key's size. A new `state` option picks what comes back: an array of state paths, `true` for the whole state, or `false` for none.
  - New `{ "back": true }` step presses the browser's Back button, and `{ "expect": { "title": { "equals" | "contains" } } }` checks the document title.
  - Segmented controls, radio groups and checkboxes are reached through their labels, so `click` by text and `select` by value work on a `SegmentedSelector`, `RadioSelector` or `ButtonSelector` option; before, the runner found the option's hidden input and timed out.

- f889c26: feat: dynamic blocks policies. Declare `policies.dynamicBlocks` in `lowdefy.yaml` to render block config stored as data — generated forms, model output — through a `Dynamic` block within limits the app sets. A policy lists the blocks, actions, operators, endpoints, requests, pages and origins content may use, an optional state path it must write under, whether HTML is allowed, and size, depth and actions-per-event limits. It requires literal values wherever content names a target.

  - `Dynamic` blocks take `properties.policy`. The policy's types are bundled into the page, and the resolved content is checked against the policy on every page get; a violation renders the fallback and logs each rule broken.
  - New built-in routine step `ValidateDynamic` runs the same check and returns `{ valid, errors, blocks }`, with a content path, rule and message per error, for a generator to correct and retry. In a Dynamic block's endpoint, `_step: <stepId>.blocks` of a passing step with the block's policy is returned as config; all other data stays literal.
  - New built-in routine step `DescribeDynamicPolicy` returns what a policy allows, with the schemas of its blocks, actions and operators, to build a model's prompt from.
  - The build validates policies (installed types, exact origins, no `Dynamic` or `_operator`), checks their pages, endpoints and requests on every page that hosts them, and warns when a policy without HTML lists operators that build strings.

- 8621dbb: feat: `lowdefy_run_endpoint` runs an Api endpoint routine headlessly

  The dev MCP server could execute a page request (`lowdefy_run_request`) but not an `Api` endpoint, so routines — where multi-step server logic, `:if`/`:try` control flow, `CallApi` chains, writes and `:return`/`:reject` shapes live — could only be verified by clicking through the browser.

  `lowdefy_run_endpoint` (and `POST /lowdefy-docs/run-endpoint`) runs an endpoint in-process with a test payload and an optional `user`, merged over the roleless headless caller exactly as `lowdefy_run_request` does:

  ```json
  { "endpointId": "create_order", "payload": { "sku": "A1" }, "user": { "roles": ["admin"] } }
  ```

  `system: true` instead runs the routine as a system context, through the same api entry point `/api/detached` uses — no user, endpoint `auth` not checked, `InternalApi` allowed — so scheduled and detached-only routines can be tested locally without `CRON_SECRET`. `system` cannot be combined with `user`.

  Endpoints are not classified read-only — a routine has no `checkWrite` meta, and one routine can read, write, call other endpoints and send notifications — so the tool always requires `cli.agentTools.allowWriteRequests: true` in `lowdefy.yaml`. Without it the call answers `refused: true` with the reason and how to enable it, before anything runs.

  The result is the `{ error, response, status, success }` object the HTTP endpoint route returns. A `:reject` or `:throw` comes back as data (`success: false`, `status: "reject"`/`"error"`, the routine's own `error`), not as a tool failure; without `system`, `InternalApi` endpoints are refused with the same message HTTP callers get; an unknown endpoint answers `refused: true`; faults that escape the routine are returned as `error: { name, message, source, configKey }`. Oversized responses are truncated the same way `lowdefy_run_request` truncates them — the shared helper is now `lib/docs/truncateResponse.js`.

- 4a87b7a: feat(server-dev): Push build, restart and browser/server error events to AI agents.

  The dev server no longer makes an agent poll `lowdefy_build_status` to learn that its edit broke the
  build. Two push channels deliver the same events:

  - MCP clients connected to `/lowdefy-docs/mcp` receive `notifications/message` from logger
    `lowdefy` on the standalone GET stream — the server now declares the `logging` capability.
  - `GET /lowdefy-docs/events` streams the events over SSE for everything else, one frame per event,
    named by type.

  Event types are `restart` (sent on connect with the process `bootedAt`), `build` (status, errors,
  warnings and the `stale` flag, whenever `build/buildStatus.json` is written), `client_error` and
  `server_error` (each entry as it lands in the build-status ring buffers). Events are not buffered —
  a client that missed one calls `lowdefy_build_status`, which is derived from the same file.

- eaa6517: feat(server-dev): Return contextual hazards from the dev MCP with schemas, docs and config lookups.

  `lowdefy_get_schema`, `lowdefy_get_doc` (by kind and type) and `lowdefy_find_config` (per match) now
  include `hazards: [{ id, message, see }]` — behaviours of a type that its schema does not show, such as
  `Html` stripping `<style>`, a closed `Modal` keeping its state, `_state` being `undefined` inside request
  properties, or the tenant wall injecting a `$match` into every `$lookup` of a request over a walled
  connection (`tenant-wall-lookup`, returned only when the request's connection is walled).

  Hazards come from two channels. Plugins declare type-attached hazards through `meta.hazards`: the build
  now carries them into `plugins/blockMetas.json`, request metas already ride along in
  `plugins/requestSchemas.json`, and operator packages can export a `./metas` module which the build
  writes to the new `plugins/operatorMetas.json`. Framework-level hazards ship hand-authored in
  `@lowdefy/docs-content/hazards.json`. Seeds: `Html`, `DangerousHtml`, `Modal` and `_js` carry their
  first hazards; the docs describe hazards and the `meta.hazards` plugin contract.

- b56bb7a: feat: Lowdefy apps as OAuth 2.1 authorization server for external MCP clients.

  The app's MCP endpoint gains an app-issued OAuth 2.1 envelope, so external MCP clients connect with app-issued bearer tokens.

  - One MCP address per deployment: `POST /api/mcp`, with RFC 9728 metadata at `/.well-known/oauth-protected-resource/api/mcp`. The resource URIs default to the current environment's `url` in `config.environments`. The organization a token acts in is chosen at authorization, not encoded in the address.
  - After login and before consent the authorization server sends the user to `auth.oauthProvider.postLoginPage` (required under the `tenant` organizations policy) to choose one of their organizations; the page runs `SetActiveOrganization` then the new `OAuthContinue` action. Consent is then per (client, user, organization), and every access token carries the choice as its `organization_id` claim — refresh grants keep it.
  - Scopes are `mcp:read`, `mcp:write` and `offline_access`, so clients get refresh tokens: access tokens last 1 hour, refresh tokens 30 days. A rotated refresh token is accepted again for two minutes, so several sessions sharing one sign-in can refresh together.
  - The `/api/mcp` route resolves the member from that claim, refuses a token whose grant no longer stands (consent deleted), and stamps `auth_method: 'mcp'` on the caller. A token whose user is no longer a member of its organization gets the `401` `WWW-Authenticate` challenge and cannot be refreshed, which sends the client back through authorization.
  - New `RevokeMcpGrant` auth step: an MCP tool built on it gives up the calling assistant's own grant, so the assistant's next call is challenged to reconnect — and to choose an organization again.
  - `mcp.endpoints` entries carry a `scope` (`mcp:read` | `mcp:write`); tools are listed and callable only when the caller's role gate and token scope both allow.

- 2baefc1: feat: Mark build warnings that fail the production build as "fails in prod" in dev.

  Some build checks (`_state` in request properties, `_payload`/`_step`/request/`Link`/`CallAPI`/
  websocket/`Dynamic` endpoint references) are warnings under `lowdefy dev` but errors under
  `lowdefy build`. They now say so wherever a developer or agent reads them:

  - `buildStatus.json` entries (served by `GET /lowdefy-docs/build-status` and `lowdefy_build_status`)
    and `BuildError.warnings` carry `prodError: true`.
  - The dev terminal prints `[ConfigWarning · fails in prod] …`.
  - The dev error bar badges the entry `fails in prod`, turns dark orange instead of yellow, and says
    `(fails in prod)` in the copy-all text.

  The messages of these checks now all say what to do about the problem, not only what is wrong. No
  gating change: a prod-gated warning still does not fail the dev build.

- 6b4bd99: Runtime errors reach the agent feedback channel with their config source.

  - The dev server now collects server-side failures — request, endpoint, MCP and agent tool errors — into a ring buffer surfaced as `serverErrors` in `GET /lowdefy-docs/build-status` and the `lowdefy_build_status` MCP tool, beside `clientErrors`. Each entry carries the resolved yaml `source` and `config` path, plus `endpointId`, `requestId` and `pageId` where known (page request failures name the request).
  - MCP tool errors carry their config source (` (at file.yaml:line)`) and hint in dev. Unexpected tool-call failures now go through the server's error sink so they are logged with their source. Production keeps returning the bare message.
  - `_js` execution errors report the original JavaScript error (`ReferenceError: x is not defined`) instead of pasting the whole function source into the message.

- 662eaa9: feat: Tenant wall — multi-tenant isolation on MongoDB connections, scoped by default

  `auth.organizations.policy` sets the scoping default for every connection in the app. Under `policy: tenant`, every connection whose type implements the scoping contract is walled to the caller's active organization — enforced mechanically on reads **and** writes, with nothing to declare per connection and no per-request filters to remember. A connection declares only its **exception** to that default: `tenant: shared`, for data deliberately shared across organizations, or `tenant: { field: ... }` to scope on a non-default field. A connection carries no default of its own — the same connection file is scoped in a `tenant` app and unscoped in a `pinned` one, with nothing in the file about tenancy.

  **The wall is policy-conditional.** It engages only when the app declares `auth.organizations.policy: tenant`. Under `pinned` (the default, including apps with no `organizations:` block) no connection is scoped and none can be — the wall applies nothing: no read filter, no write stamp, no selector merge, no change-stream scoping, no authored-clause audit, no fail-closed error for organization-less callers, and no rejection of an authored tenant field. A single-organization deployment therefore adopts scoping-capable connections with no data migration — no backfill, no index changes. One check stays on under both policies: declaring `tenant:` on a connection type that does not implement the scoping contract is a config error, so it surfaces on the current deployment rather than on the day the app flips to `tenant`. `_build.authConfig` projects `organizations.policy`, so config can branch on the policy at build time, including in module entry vars and cross-module components consumed through them. (Reading it inside the `auth:` block itself, or in app metadata, is a build error.)

  **Tenant preflight.** Under `policy: tenant` the server probes every walled collection (lazily, once per process) for documents missing the tenant field or carrying it as `null` — rows no walled read can see. It keeps serving and reports each offending collection once: a `TenantIntegrityError` log line and a Sentry event tagged with collection, connection and endpoint. A probe that cannot reach the database logs a warning and retries on the next request. The probe is a connection-type capability (`tenantPreflight`, implemented by `MongoDBCollection`); the walled set — every scoping-capable connection that does not declare `tenant: shared` — is enumerated from the `tenantConnections.json` build artifact.

  **Tenant wall (`@lowdefy/connection-mongodb`, `@lowdefy/api`)**

  - Every find/findOne/update/delete selector is merged with the caller's organization equality; every insert, replacement, and upsert is stamped server-side with the organization id. Every insert into a walled collection (including upserts, bulk writes, table changes and the version copy of a versioned update) is read back by `_id`; a row missing the tenant field or carrying another organization is deleted and the request fails with `TenantIntegrityError`.
  - Aggregation pipelines: the wall's one pipeline move is prepending the tenant `$match` at every pipeline entry — the root pipeline and every `$lookup` (both forms) / `$unionWith` sub-pipeline entry, recursing through `$facet` branches. The wall never rewrites the inside of a stage. `$out`/`$merge` are rejected on tenant connections, and `$collStats`/`$indexStats` too — collection-level statistics cannot be tenant-scoped.
  - Stages the prepend cannot scope — a pipeline-leading `$search`/`$searchMeta`/`$vectorSearch`/`$geoNear`, and `$graphLookup` at any position — are **refused** unless the request declares `tenant: authored`: the request then authors the tenant clause itself (a `compound.filter` `equals` for `$search`/`$searchMeta`, the `filter` for `$vectorSearch`, the `query` for `$geoNear`, `restrictSearchWithMatch` for `$graphLookup`, typically with `_user: organization_id` as the value), and the wall **audits** it at runtime — clause present, tenant field, value strictly equal to the caller's resolved organization — refusing to run on any miss. The rest of an authored request's pipeline is still walled mechanically, and the caller must still resolve an organization. Atlas index requirements for authored clauses: the tenant field `token`-mapped in the Atlas Search index (and in `storedSource` where `returnStoredSource` is used); indexed as the `filter` type for Atlas Vector Search.
  - Change streams are scoped via a `fullDocument` match with `updateLookup` forced; events that cannot prove they match (deletes) are not delivered, and callers from different organizations never share a change-stream channel.
  - The tenant field may be read but never authored in a write or filter position — authored usage is rejected loudly. In writes this means a top-level key of an insert or replacement document or of an update operator's argument; a nested key of that name inside stored data is ordinary data. (On a `tenant: authored` request the audited stage position is the one place it is instead _required_.)
  - Fail-closed everywhere under `policy: tenant`: system-context and strategy callers carry no organization, so their requests to tenant connections fail. A read fails with an `AuthenticationError` unless the request or step declares `tenant: none`, the only opt-out, authored at the point of use; `tenant: none` reads reach every organization's rows. A write in a run bound to no organization fails with `TenantIntegrityError` (naming the collection, connection and tenant field, logged at error level and sent to Sentry). To write from a caller-less run (a schedule, an auth hook, a verified webhook), call an endpoint with a `CallApi` step that names the `organization`: its requests run with the wall on, filtered and stamped with that organization.
  - **`tenant: none` is read-only.** A request, routine step or webhook verifier with `tenant: none` on a scoped connection whose type writes (`MongoDBInsertOne`, `MongoDBUpdateMany`, `MongoDBBulkWrite`, `MongoDBTableChanges`, the enrichment requests and the rest) fails the build with a `ConfigError` naming the step, request or verifier, its type and its connection, and the same write is refused at runtime. An aggregation with `$out` or `$merge` under `tenant: none` fails the build when the target is a literal collection name and is refused at runtime otherwise.
  - A `tenant: shared` connection over the same collection and database as a scoped connection (compared as authored; a collection name resolved at runtime is not compared) keeps unscoped reads, but every row it inserts, replaces, upserts or updates must keep a non-empty `organization_id`, and each `MongoDBBulkWrite` operation must name exactly one operation kind.
  - `context.user.organization_id` (the caller's active organization id) is exposed and readable as `_user: organization_id` under both organizations policies.

  **Walled MongoDB client for plugins**

  `@lowdefy/connection-mongodb/walled` exports `getWalledCollection`, a client whose `find`, `findOne`, `aggregate`, `countDocuments`, `insertOne`, `insertMany`, `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany` and `bulkWrite` apply the wall exactly as the matching MongoDB requests do: scoped reads and writes, stamped and read-back inserts and upserts, change logs kept, `$out` and `$merge` refused, and every write method refused under `tenant: none`. A plugin's request resolver receives `walled(connectionId)` and passes its result to `getWalledCollection`. Under `policy: tenant`, a non-scopable connection (SMTP, a plugin's own connection type) may not reach a walled database: the build fails when such a connection reads the secret behind a walled connection's `databaseUri`, and when one holds a URI to a walled database under another secret or as a literal, the server logs an error at start and refuses that connection's requests with a `ConfigError` while the rest of the app keeps serving. There is no opt-out (`~ignoreBuildChecks` does not suppress it): give the plugin a `mongoConnectionId` and use `getWalledCollection`.

  **Build validation (`@lowdefy/build`)**

  - The connection position accepts only the exception: `tenant: shared`, or `tenant: { field: ... }`. Any `tenant:` declaration on a connection type that does not implement the scoping contract is a build error under both policies.
  - Connection types declare their tenancy capability in `connectionMetas`: `{ tenant: true }` implements the scoping contract (v1: `MongoDBCollection`), `{ tenant: false }` is non-scopable — every first-party connection type declares one or the other. Under `policy: tenant` a connection whose type declares neither is a build error naming the type, so a data-bearing custom type can never be silently unscoped. Connection plugins can also declare `requestMetas` (`{ checkRead, checkWrite }` per request type) in their `types.js`, which the build reads to know which request types write.
  - The request/step-level sentinel accepts `none` and `authored`; websockets accept `none` only (`authored` is aggregation-only). Declaring `none`/`authored` on a connection, or `shared`/`{ field }` on a request, is a build error naming the position the value belongs to.
  - Best-effort entry-stage check: a literal walled pipeline leading with `$search`/`$searchMeta`/`$vectorSearch`/`$geoNear` or containing `$graphLookup` without `tenant: authored` is a build error (operator-composed pipelines are checked at runtime, which is the enforcement gate). The check only runs under `policy: tenant` — under `pinned` the wall never engages, so a missing authored clause is not an error.
  - Shared connections and walled collections: a request or step on a `tenant: shared` connection whose literal aggregation pipeline writes into a scoped connection's collection with `$out` or `$merge` is a build error, and so is a `tenant: shared` connection whose `changeLog.collection` is a collection a scoped connection reads — give shared connections their own change-log collection. Both checks compare literal collection names and database properties as authored; `MongoDBCollection` declares the properties that name its collections in `connectionMetas.tenantTarget`.
  - Remap guard: a connection remap on a module entry swaps the module's whole connection definition for the app's — including its position against the wall. Under `policy: tenant`, remapping a scoped module connection to a target that is not scoped — one that declares `tenant: shared`, or whose type does not implement the scoping contract — is a build error (it would silently run the module's requests outside the wall). Remapping onto a target that declares nothing is safe: both sides are scoped. Under `pinned` remaps stay unrestricted; the flip to `tenant` is a rebuild, so the guard fires there.

  **Signup under `policy: tenant`**

  With `organizations.signup: open` and `create: auto`, a user without a membership gets a fresh organization, as its owner, at their next session — exactly one organization and one owner row even under concurrent sessions, and never an organization the user was a member of before. The server creates unique indexes on the organization `slug` and the member `(user, organization)` pair at startup (an equivalent index created by hand, under any name, is accepted). If they cannot be created — the database user lacks the privilege, or duplicate rows exist — the server logs an error naming the index, and a sign-in that needs a new organization is refused with status 503 and the code `ORGANIZATION_SETUP_UNAVAILABLE`; the server retries at most every 30 seconds, so a fix recovers without a restart.

  **Enabling the wall**

  Under `pinned`, adopting scoping-capable connections changes nothing — no migration, no new requirements, no declaration. Enforcement starts when the app declares `policy: tenant`, and that flip is deliberately breaking, in the fail-closed direction:

  - Documents without the tenant field fall outside every walled read — the tenant preflight names the collections to backfill.
  - Every system-context caller of the connection (webhook verifiers, hook routines, scheduled endpoints) and every strategy caller starts failing until it runs with an organization: reads can declare `tenant: none` at the point of use, writes go through `CallApi` with `organization`. Declaring `tenant: none` on a read is inert under `pinned`, so authoring it ahead of the flip is safe and recommended wherever a caller-less context reads a walled connection.

- 43179c3: The headless dev tools address page instances. Screenshot, inspect state, eval operator, snapshot state and the journey and screenshot page opens take `pathParams` for a page whose `path` has placeholders, read contexts and inputs under the instance key, and return the URL builder's error naming a missing placeholder. State checkpoints keep `pathParams` next to `urlQuery`, and loading one opens that instance. The page-ready check waits for an instance key, or the instance on screen. The app map shows each page's `path`, the overview lists the patterned pages, and the screenshot, page-config and inspect-state routes take multi-segment page ids.

  The in-page dev tools follow page instances too. The inspector, the feedback overlay and open-in-editor take the page id and instance from the fetched page, so they name the right page on a first load of a page with path placeholders. The inspector reads state and input under the instance key, and a headless tool request for a page reads the instance a browser tab shows, else the page's most recently rendered instance. Feedback batches carry `pathParams` next to `urlQuery`.

- fbc43dc: Headless agent captures now wait for the page's async lifecycle instead of only for initial requests.

  `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator` and `lowdefy_load_state` previously read the page as soon as its context existed and no request was in flight — which is true before `onMountAsync` has even started, so a page fed by an `onMountAsync` `Request` action was screenshotted and inspected empty. They now wait for `onInit`, `onInitAsync`, every block event (including `onMountAsync`), in-flight requests, and the first websocket message. A page that has not settled within the 15s timeout is still returned, now carrying `ready: false` and a note saying the result is a snapshot of an unsettled page.

- a79fb1d: feat: semantic icon names, and icons, tooltips and popovers in HTML.

  - **Semantic icon names.** Anywhere an icon name is accepted you can now write a name like `edit`, `delete`, `warning` or `external-link` (67 built-in names plus Ant Design spellings like `plus` and `setting`). They map to Lucide icons, so apps look consistent without picking a pack per icon. Add or override names with `theme.icons.aliases` in `lowdefy.yaml`, and list icon names that only exist at runtime under `theme.icons.include`. Existing React Icons names work exactly as before, and the build still bundles only the icons your config uses.
  - **Icons, tooltips and popovers in HTML.** Every block that renders HTML (`Html`, `ClickableHtml`, `DangerousHtml`, and HTML properties such as Tooltip and Card titles) understands `<i data-icon="edit"></i>`, `data-tooltip="Text"`, and `data-popover="id"` with a matching `data-popover-content="id"` element. Tooltips and popovers use the app's antd theme and load on first use. An open popover stays open with its new content when the HTML changes, as long as the new HTML still has its trigger. In `ClickableHtml`, `data-event` targets are now keyboard focusable (Enter and Space click them), and a `data-event` inside a popover fires and closes it.
  - **Icon fixes.** Icons no longer remount on every parent render, an icon that failed recovers when its name changes, and a clickable `Icon` block is keyboard focusable.
  - **Agents.** The dev server adds `lowdefy_search_icons` and `GET /lowdefy-docs/icons?q=`, and the agent setup files explain the icon and HTML conventions.

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

- 9a92898: feat: `expect: { effect: true }` checks that the interaction before it did something

  A journey step `expect: { effect: true }` fails when the click, open, fill, select, press or back just before it ran no event, changed nothing on the page, called no request or endpoint and left the URL as it was. It must directly follow one of those steps, and `true` is its only value. Put it after a click on a control that should do something, so the journey fails while the control does nothing.

- 0205b5a: The journey grammar accepts `from: recorded | shape`; the runner refuses placeholder values.

  `fill`, `select` and `expect.state` take an optional `from`. `from: recorded` marks a value observed in a recorded trace; the step runs as usual. `from: shape` marks a placeholder, `value: null`, that a trace could not hold (a value typed in production, or a password the dev recorder did not keep). The dev server's journey runner and `lowdefy test` refuse a journey holding one before a browser opens, naming the step: fill it from a data set or the journey's user, then remove `from`. A `fill` or `select` with `value: null` and no `from: shape` is a grammar error.

  The step grammar lives in `@lowdefy/node-utils` and `lowdefy test` checks it before starting a dev server, so a malformed step, or an unknown key on any step or target, is reported as an invalid journey file with its step number. `lowdefy test` also accepts the `open` step.

- 316f5be: feat: Journeys can assert that something is hidden (`expect.hidden`), that a request was sent a given number of times (`expect.calls`), and can double-click (`click.count`)

  - `expect: { hidden: <target> }` passes once nothing the target names is visible.
  - `expect: { calls: { request, pageId, count } }` (or `{ endpoint, count }`) compares, once the page settles, how many times this person's browser called the request or endpoint since the journey started. Counts survive full page loads.
  - `click: { ...target, count: 2 }` clicks twice in quick succession, as a person's double click.

- 316f5be: feat: Harden journeys with lints, config mutants and edge-case variants

  `lowdefy test` can repeat journeys (`--repeat 3`) and lint them (`--lint`). `lowdefy journeys harden` breaks your config on purpose, one change at a time and only in the test's own browser, and reports each change no journey noticed with its source line. `lowdefy journeys variants` writes edge-case journeys (bad input, reload, double click).

  - **`lowdefy test --lint [paths...]`** checks journeys without running them: no placeholders (L1), every action that ran an event followed by an assertion (L2), no fixed waits (L3), journeys that write declare `data:` (L4), a final assertion (L6), and no `as` step that names the person already acting (L7).
  - **`lowdefy journeys harden`** hardens journeys that run on a data set (`data:`); a journey without one is left out with an error naming it, and with none left harden exits 1. It runs each journey once, lists the mutants on what it exercised, runs each against the journeys that reached it, and writes `.lowdefy/test/mutation.json` with each journey's kills. `--list` estimates the run, `--mutant <id>` confirms one kill, `--max` and `--seed` sample, and `--page` limits the mutants to those pages and the baseline to journeys whose last measured run touched them. It prints progress while the baseline and mutants run (`Baseline 37/412 journeys (2 failed)`, `Mutants 12/45 run (3 survived)`), and carries its verdicts over config edits made while it runs.
  - **`lowdefy journeys variants <file>`** writes `negative`, `interrupt` and `double-submit` candidates to `tests/journeys/_candidates/variants/` with a `variant: { of, kind, detail }` key, and replays each three times.
  - **Journey results report the events that ran and the blocks shown** (`exercised.events`, `exercised.rendered`), measured from inside the journey's own browsers only.

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

- 1766343: feat: One recorded trace format, and the functions that read it

  A recorded trace is a JSONL file of interactions (a click, a change, a key press, on which block) joined to what the app did in response, in one record format (version 1) shared by every recorder.

  `@lowdefy/node-utils` exports the record reader (`parseTraceLines`), the record validator (`validateTraceRecord`), `compileSegments`, which cuts records into the segments and sequences that journey evidence and coverage read, and the journey identity functions (`journeySequence`, `stepIdentity`). `@lowdefy/helpers` exports `pairTraceEvents`, the rule that decides which DOM interaction caused which engine event, and `isMountEventName`. The dev server's `GET /lowdefy-docs/build-status` reports a top-level `buildId`, the build it serves now.

- 9ed1386: feat: The coding agent explores pull requests, with `lowdefy journeys scope` to say what a change touched

  - `lowdefy journeys scope [--base <ref>] [--json]` prints what a change touched: each page the change reached, including pages from modules, why (its own config, a request, an endpoint, a connection, a websocket, an app-wide artifact, or a `_ref`'d file), the blocks added, changed or removed, and who can open the page, with the data set users under `tests/data/` that it admits. It builds the merge base and the working tree with the installed dev server's builder, installing it into `.lowdefy/dev` when none is installed, and needs no running dev server. Without `--base` it lists every page.
  - `lowdefy agent-setup` installs a `journeys-from-pr` skill that has the coding agent explore a pull request itself. For each changed page and role, it looks at the page, writes a journey for every path a user can take, and proves each one with `lowdefy test --repeat 3`. Journeys that pass join the suite. A journey that fails is reported as a finding, with that journey. Given a goal sentence instead, the same skill runs a bug bash.
  - A journey's `name` is at most 100 characters, checked as authored (before a `[user]` suffix). An optional `description`, at most 60 words, states the journey's goal.
  - On a journey with a data set, a click on a block whose events reach a connection the data set cannot run (a type that declares no `meta.dataSet`, a connection with no artifact, or an `external` type with no request types to sink) fails at that step, naming the block and the connection's declaration: `Block "export" reaches connection "reports_db" (Knex, no dataSet declaration), which a data set cannot redirect, so a data-set journey cannot click it.` A click that runs an auth action (`Login`, `Logout`, `SetActiveOrganization`, `UpdateSession` and the rest) fails the step, naming the block and the action, when the action executes; one the click skips (a failed `Validate`, a true `skip:`) passes.

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

- c3e0d79: feat(cli): `lowdefy journeys session` prints a recorded dev session as a log to write journeys from

  `lowdefy journeys session` lists the sessions the development server recorded, newest first, with each one's id, time span, pages, interactions and failures. `lowdefy journeys session <id>` prints that session as a log, one line per interaction with what the app did in response, such as `click save → Validate failed [priority]` and `click save → ran Validate, request createTicket ok`, with a `page <pageId>` line per page view. A failed attempt and its retry both show, typed values and generated ids show as recorded, and nothing is turned into an assertion. Agents connected to the development server read the same list and logs with the new `lowdefy_journey_session` tool.

  The development recorder records which actions an event ran and which API endpoints its `CallAPI` actions called, so a log can say `endpoint syncInvoices ok`.

- 5e6bed8: New dev MCP tool `lowdefy_check`: validates the whole app the way `lowdefy build` would, without building it — every page, including ones not yet opened in dev, and the checks `lowdefy dev` only warns about but a production build rejects (they come back as errors with `prodError: true`). Returns `ok` plus located errors and warnings. It runs in a separate process so it never disturbs the running dev server, and it writes nothing. Agents call it before saying a change is done, so "works in dev, fails the deploy" is caught in the session.

  `@lowdefy/build` gains the `validateOnly` build option (every validation runs, nothing is written) and a `check()` entry on `@lowdefy/build/dev`. It adds no new build rules: `lowdefy_check` reports exactly what `lowdefy build` already rejects.

- 60fb714: feat: Member tokens for MCP scripts

  A script that runs on its own can now call an app's MCP tools with a long-lived **member token** instead of an OAuth grant, which a crashed refresh can sign out with no way back short of a person signing in again. A member creates a token for themselves from a signed-in session with the new `CreateMcpToken` auth step, choosing an expiry in days or none. The script sends it as `Authorization: Bearer ldf_mcp_…` to `/api/mcp` and is served as that member, with their roles and organization, exactly as an OAuth-connected assistant is (`_user.auth_method` is `'mcp'`).

  - Tokens are stored hashed in the new `user-mcp-tokens` auth collection, created only in apps that set `auth.oauthProvider`.
  - `RevokeMcpToken` switches off one of the caller's own tokens; `RevokeOrgMcpToken` lets owners and admins switch off any token in their organization. `RemoveMember`, `LeaveOrganization` and `DeleteUser` delete the member's tokens too.
  - A token stops working when its member leaves, is removed or is banned. A refused token gets a `401` whose `error_description` says why.
  - A banned user's OAuth access tokens are refused on `/api/mcp` too.

  See "Tokens for scripts" on the MCP Server & OAuth docs page.

- 959ec32: feat: The `_credential` operator keeps a runtime-made credential out of the server logs

  The log scrub only knew the secrets the server holds, so a value a routine made at runtime, such as a new API key or a secret derived with `_hmac`, printed in plain text at debug level in every `:set_state`, `:return`, step result and error `received` that held it. Wrap the value in `_credential` where it is made: it is returned unchanged, so the routine and its caller still get it, and every log line for the rest of that request shows `[REDACTED]` in its place, on the production and development servers alike. Marked values are also scrubbed from the request's Sentry events, and an endpoint run through a `CallApi` step with `detached: true` keeps the marks its dispatcher made. The development server still logs `_secret` values in full.

- 366ed1e: feat: Pages can declare a `path` URL pattern, and the build writes the route table

  - A page may declare `path`, a URL pattern with `{name}` placeholder segments, such as `path: tickets/{space}/{ticket_id}`. The page id stays the page's identity. A module page's `path` is prefixed with its entry id, as its id is. A pattern that starts with a placeholder must be quoted in YAML, and the build says so when it is not.
  - The build writes `routes.json`, every page's pattern (its id for a page without `path`) with its page id and auth. The JIT skeleton build writes it in dev, resolving `path` behind `_ref`, `_var`, `_build.*` and `_module.var`.
  - The build refuses two patterns that match the same URLs (same segments, placeholders in the same positions, fixed segments equal ignoring case), placeholders on the home page or an auth page, and any `path` on the `404` page.
  - An auth page URL maps to the page served at that path. A URL that names a page by its id while the page is served at a path of its own fails the build with the path to use.
  - The dev server rebuilds the config when a page file edit adds, changes or removes the page's `path`.

- e6302c6: fix: Reload when the server answers as another caller

  Page, request and endpoint responses now carry an `x-lowdefy-caller` header naming who the server answered as: `<caller>; session=<hash>; roles=<hash>; memberships=<hash>`. `<caller>` is a short hash of the user id and active organization id, empty when anonymous. `session` hashes the session id, `roles` the caller's app roles and organization role (owner, admin or member) in the active organization, and `memberships` the ids of every organization the person belongs to (under the pinned organization policy, only the app's own organization). A field the server does not know is left out, such as `session` for an API key caller. The browser compares the header with the caller the page renders and reloads the page when the caller or their roles differ, so a page never keeps showing one person's or organization's data after a sign-in as someone else or an organization switch in another tab, and `_user.roles`, `_user.org_roles` and role-gated blocks always match the server. A new session or a changed list of organizations for the same person, organization and roles does not reload the page.

  - A request or endpoint call answered with a 401 while the page shows a signed-in user reloads the page, since the session has ended. A 403 from a page request reloads too; a 403 from an endpoint, and a two-factor enrolment refusal, are thrown as before.
  - When the session names a different user than the page renders, the page reloads instead of keeping the previous user rendered.
  - A kept page instance is rebuilt after `SetActiveOrganization` and `UpdateSession` instead of rendering the state and request results it had under the previous organization.
  - `CallAPI` results read by `_api` are dropped when the organization changes, so a result fetched for one organization is never read under another. Global state is left as it is.
  - A tab reloads at most once every 10 seconds for these reasons; a second difference inside that window fails the call with an `AuthenticationError` instead of reloading again.
  - `@lowdefy/helpers` exports `callerStamp`, `parseCallerStamp` and `rolesHash`.

- aa6bb38: feat(api)!: A declared `payloadSchema` is now enforced on every caller.

  **Breaking:** a caller that sends a payload outside an endpoint's `payloadSchema` is now refused
  before the routine runs. Until now the schema was only advertised to MCP clients and agents, and
  nothing checked a payload against it. This is a major bump for `@lowdefy/api` and `@lowdefy/build`
  because apps whose callers relied on the schema not being checked will see those calls fail.

  Every payload is validated on every call path, and a non-conforming one is refused. Who built
  the payload decides how the refusal is reported:

  - **An outside caller's payload** is the caller's mistake, a `UserError` logged at warn level and
    never captured to Sentry. REST (`POST /api/endpoints/<endpointId>` without naming a page)
    answers `400` with `{ name: 'UserError', message }`; MCP `tools/call` answers `isError: true`
    carrying the message, and agent tool calls get it as a tool error, so the model can retry.
  - **A payload the app's own config built** (a page's `CallAPI`, a nested or detached `CallApi`
    step, a Dynamic block's endpoint, an auth or agent hook, a scheduled run's `schedule.payload`)
    breaks the endpoint's own contract, so the refusal is a `ConfigError`, logged as a server error
    with its config location. A page's `CallAPI` fails with `_error.name: ConfigError` (outside
    development with the generic server error message), a nested `CallApi` reaches the routine's
    `:catch` as a `ConfigError`, and a detached target or scheduled run fails its run.

  The message names the endpoint, the failing location and what would be accepted, e.g.

  - `Payload for endpoint "create_order" does not match its payloadSchema at /quantity: must be number.`
  - `... at /status: must be equal to one of the allowed values (draft, placed).`
  - `... at (root): must NOT have additional properties (colour).`
  - `... at /slug: must match pattern "^[a-z0-9-]+$".`

  When a location fails both its `type` and one of `enum`, `pattern`, `required` or
  `additionalProperties`, that keyword is reported.

  There is no opt-out: the way to not validate is to not declare a `payloadSchema`. The build now fails
  when an endpoint declares both `webhook` and `payloadSchema`, since a webhook routine receives the
  `{ body, query, headers }` envelope rather than the schema's shape.

  `cleanBuildArtifact` (strips `~k`/`~r`/`~l` markers and unwraps `~arr`) moves into
  `@lowdefy/helpers`, replacing the private copies in `@lowdefy/api` and `@lowdefy/ai-utils`.

- 019eb9c: `lowdefy_run_request` and `POST /lowdefy-docs/run-request` now accept a `user` param, and run the request as that caller. Without it a request runs as a roleless anonymous caller, so a tenant-walled or role-gated request silently returns empty rows; passing `user: { roles: ['admin'] }` (merged over the default headless user, exactly as the other headless agent tools merge it) runs it as that identity instead. An explicit `user` also wins over the ambient `auth.dev.mockUser`. Impersonation does not unlock writes — the `cli.agentTools.allowWriteRequests` gate is unchanged.
- 493a1e6: feat(dev): `lowdefy_screenshot_page` can capture an open dropdown, a date picker's calendar or a modal, and a page opened at a query string.

  - New `steps` option runs interactions after the page settles and before the capture, addressed by block id — the same steps as `lowdefy_run_journey`. A new `{ "open": "blockId" }` step opens the popup of any input (Selector, MultipleSelector, AutoComplete, DateSelector and the other pickers, Cascader, TreeSelector) and waits for it to show. Popups are drawn at the end of the page, so `fullPage` and `clip` captures include them. If a step fails, the screenshot is still returned, showing where it stopped, together with the failure.
  - New `urlQuery` option opens the page with query params, for pages that read `_url_query`.
  - `open` is also a journey step for `lowdefy_run_journey` and `lowdefy test`.

- a675307: Journeys can test sign-up, sign-in and invitations through the app's own auth. `user: none` injects no user, so a journey starts signed out and the session cookies a sign-in sets carry through its steps. Three steps cover it: `goto` loads an app page the way a typed URL does (`goto: pageId` or `{ pageId, urlQuery }`); `email: { to, subject }` opens the newest email to an address that arrived during the journey, after which `click: { text: ... }` follows its links; `as: name` switches to another person with their own browser, cookies and client address, so an owner and an invitee, or a member whose session stays open while they are removed, act in one journey. The journey starts as `main`.

  A journey's `user` wins over `auth.dev.mockUser`; a journey with no `user` acts as the mock user. A journey with `user: none` is refused while a mock user is active, since every request would act as the mock user.

  The dev server captures mail for the `email` step when `LOWDEFY_DEV_SMTP_PORT` is set: it receives SMTP on `127.0.0.1` on that port and writes each message to `.lowdefy/mail/` in the app directory instead of delivering it. Point the app's SMTP connection at that port to use it. Nothing is captured without the variable, and the production server never captures mail. `lowdefy test` and the `lowdefy_run_journey` tool accept these steps and `user: none`.

- 6d6fa5f: Journey targets take `containing`: the element whose visible text contains the string, inside the block when a `blockId` is given. `click: { blockId: members_list, containing: ada@example.test }` clicks the row a person would click, reaching the row's click handler, so the cards of a `ListSelector` (neither blocks nor controls) can be opened in a journey. The text is matched as the page shows it, across elements that only layout separates (`<span>Assigned to</span><b>Jane</b>` matches `containing: Assigned to Jane`), and the innermost matching element is picked.
- 6d6fa5f: A journey can type a one-time code from an email: `fill: { blockId, fromEmail: { to, subject, match } }` waits for the newest matching email, like the `email` step, and types the first match of the regular expression `match` (or its first capture group) into the block, without leaving the page. Sign-in by emailed code can now be tested end to end.
- effdeb3: Journey steps can reach controls that are not blocks. Wherever `click`, `fill`, `select`, `expect.visible` and `expect.text` take a `blockId`, they also take a target object: `{ blockId, row, column }` narrows to a grid row (zero-based, as displayed) or cell (by col-id), `text` names the interactive control with exactly that visible text, and `nth` picks among several matches. `text` on its own searches the page front-most layer first — an open dropdown menu, then an open dialog, then the page — so a confirm dialog's `Delete` is clicked over the grid's `Delete` cell buttons behind its mask. This makes grid cell buttons, confirm dialogs, modal footers and menu items addressable by `lowdefy_run_journey`, `POST /lowdefy-docs/journey` and `lowdefy test`. Unknown target keys are rejected before a browser opens, and a failed step names the target the way it was written (`block "grid" row 1 control "Edit" to be actionable`).

  A `click`, `open`, `fill` or `select` whose `text` or `containing` target has no `nth` must match exactly one visible element, or the step fails and says how to narrow it:

  ```
  Matched 3 controls with text "Delete" in the page; add nth: 0..2, or a blockId/row to narrow it.
  ```

  Expectations do not need one match: `expect.visible` passes when any match is visible and `expect.hidden` when none is.

- 855ae02: A journey can set `timeout`: how long each step may wait, in milliseconds (a whole number from 1 to 60000, default 5000). Raise it on a slow machine or CI runner instead of padding the journey with `wait: { ms }` steps. Page opens get at least 15 seconds, or the journey's `timeout` when that is longer. Journey files, `POST /lowdefy-docs/journey` and the `lowdefy_run_journey` tool all accept it.
- 2e757a2: feat(server-dev): Add the `lowdefy_restart` MCP tool and `POST /lowdefy-docs/restart` route so an agent can restart the dev server process itself (via a `build/.restart` sentinel consumed by the manager), and watch every local plugin `lowdefy.yaml` lists. Editing a local plugin rebuilds the config, so a new block, action, operator or request type is defined and a build a broken plugin failed clears once the plugin is fixed; editing a plugin with server-side types (connections, requests, server operators, agents, websockets, notifications, auth) also restarts the dev server instead of serving a stale module.
- f1dc820: feat(server-dev): Add `lowdefy_run_journey` and `POST /lowdefy-docs/journey` — drive a page of the running dev server headless through declarative steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`, `expect: { state | visible | text | url }`, blocks addressed by `blockId`) and assert what happens, so an agent can verify behaviour and not just layout. `expect: { text }` and `expect: { state }` wait up to the step timeout for the text or value to match, as `url` and `title` do, and `state` with `equals: null` also passes when the path does not exist. After an interaction the runner lets the page settle for at most 5 seconds, whatever the step timeout. A failing step stops the journey and returns `passed: false` with `failure: { index, step, expected, actual, message }`, the remaining steps `skipped`, any screenshots taken (MCP image content) and the final page `state`. `lowdefy_run_journey` returns a count of what the run exercised; pass `exercised: true` for the full block, or `exercised: false` to leave it out. The headless page URL also accepts `urlQuery`.
- 6dc9114: feat: Page routes match request paths to pages

  - The HTML page route and `/api/page/*` take the request path and match it to a page, so a page with a `path` pattern such as `{space}/tickets/{ticket_id}` is served at `/support/tickets/1234`. A page without `path` is still served at its id, so `/api/page/{pageId}` keeps working.
  - `/` (home) and `/404` stay fixed routes ahead of the matcher. When `homePageId` is unset, `/` redirects to the first menu link's URL built with its `pathParams`; a configured home page with a fixed `path` is served at `/`.
  - The first-load payload and the `/api/page/*` response carry `pageId`, `pathParams` and `matchedPath` (the matched path without `basePath` or one trailing `/`) next to `pageConfig`.
  - The sign-in and two-factor enrolment `callbackUrl` is the requested path plus query on every route; the `/api/page/*` sign-in redirect used to drop the query.
  - The dev server matches the path against the route table, JIT-builds the matched page, and returns `{ pageId, pathParams, matchedPath, pageConfig }`.
  - In `@lowdefy/e2e-utils`, `goto` and `waitForPage` take `{ pageId, path, pathParams, urlQuery }` and build the URL under the app's `basePath`; a string target is used as written. The ready check and the state, request, validation and `setUrlQuery` helpers read the page instance on screen, so a patterned page's instances are told apart.

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

- ebe820b: Mark every dev docs response stale while the last build failed.

  When a rebuild fails the dev server keeps serving the previous successful build, so `/lowdefy-docs` routes and the dev MCP tools could keep answering from a build that predates your latest edits. While `build/buildStatus.json` reports `error`, every response now says so: MCP tool results start with a `STALE: ...` text item, JSON responses carry `stale`, `staleSince` and `staleReason`, markdown responses get a `> STALE: ...` banner, and every `/lowdefy-docs` response carries `X-Lowdefy-Stale` and `X-Lowdefy-Stale-Since` headers. Nothing is refused — the flag informs, it does not gate — and it clears as soon as a build succeeds.

- 537bf54: New table blocks: `Table`, `TableInput` and `TableLight`

  Three blocks with the antd look, sharing one column model and one set of cell types. The ag-grid blocks are unchanged.

  - **`Table`** (new package `@lowdefy/blocks-table`, installed by default) is built for large datasets and record lists. Rows and columns are virtualised, so 100k rows × 50 columns scroll smoothly. It has:

    - sort, column resize and reorder, pinned columns, a header menu with column filters, and a column manager, all on by default;
    - an optional toolbar with search, quick filters, a nested And/Or filter builder, grouping, density and CSV export (cells that start like a spreadsheet formula, `=`, `+`, `-` or `@`, are exported as text, so an opened file never runs them);
    - saved views, and optional persistence in the browser or the URL (browser persistence,
      `persist.storage: local`, is kept per signed-in user and cleared at sign-out);
    - row selection with a bulk-action bar;
    - grouping with per-group totals, tree rows, expandable detail rows, and a summary footer;
    - keyboard navigation and inline editing;
    - row drag reorder, and server mode.

    Its value is the table's state (`{ view, selected, expanded }`), so `_state: <id>.selected` is always the selection and `_state: <id>.view` the current view.

  - **`TableInput`** edits rows in a form. Its value is a changeset of only what changed (`{ updated, added, removed, moved?, order? }`), never the rows themselves, so page state stays small. Row drag uses fractional positions, so moving a row writes one field.
  - **`TableLight`** (in `@lowdefy/blocks-antd`) is antd's own `Table` for small tables and adds no dependencies. Its config is a strict subset of `Table`'s: to switch, change the `type`.
  - **Columns** declare a `type` that drives display, sorting, filter operators, totals, the editor and export:

    - text, number, currency, percent, date, datetime, boolean;
    - tag, tags, status, avatar, people;
    - link, email, phone, url, relation;
    - progress, rating, image, html (nunjucks templates), json;
    - buttons, menu.

    An `avatar` column takes `descriptionField`, a row path shown as a second line under the name,
    such as a person's email; the table then needs `size: default` or `size: comfortable`.
    `options` give enum values a label and colour in one place. `rules` and `rowRules` add conditional formatting with the same condition language as filters, with no `_function` needed. `rowLink` makes rows real links.

  - `@lowdefy/block-utils` exports `getHtmlEnhancements`, so blocks can navigate the same way the `Link` action does, and it reuses `Intl.NumberFormat` instances when formatting.

- 4f37391: feat: Webhook endpoints answer with the HTTP status their routine sets

  - **`:reject` takes `:status` and `:body`.** In a webhook endpoint, `:status` (400 to 499) sets the HTTP status and `:body` the body, sent as is. A `:reject` without `:status` answers 400 with `{ error: { code: 'rejected', message } }`.
  - **Through `CallApi`.** A `:reject` in an `InternalApi` endpoint the webhook calls sets the answer the same way, so the work can live in the called endpoint.
  - **Clear statuses for the rest.** A failed `ValidateSchema` step answers 400 (`invalid_request`, naming the failing path), a failed verifier 401 (`unauthorized`), and any other error 500 (`internal_error`) with nothing from the error. A successful routine still answers 200 with its return value.
  - **Build check.** `:status` and `:body` on a `:reject` in any endpoint other than a webhook or an `InternalApi` endpoint is a build error.

- 5d951af: feat: Webhook endpoints can answer with plain text

  - **`:return` takes `:content_type: text/plain`.** In a webhook endpoint, the endpoint answers `200` with the returned string as the body, `Content-Type: text/plain; charset=UTF-8` and `X-Content-Type-Options: nosniff`. This completes subscription handshakes that want the token echoed as text, such as Microsoft Graph's `validationToken` check.
  - **Strings only.** The returned value must be a string; any other value fails the run with the `500` answer.
  - **Build check.** `:content_type` on a `:return` outside a webhook endpoint, or with any value other than `text/plain`, is a build error.
  - A `:return` without `:content_type` answers JSON exactly as before.

- 4b3f5bd: feat: Webhook verifiers get the raw request body as `rawBody`.

  A webhook endpoint's `verify` request now receives `{ body, rawBody, query, headers }`, where `rawBody` is the request body exactly as received, as a string. Senders such as GitHub (`X-Hub-Signature-256`), Stripe and Slack sign the exact bytes they post, which serialising the parsed `body` again does not reproduce, so a signature check reads `_payload: rawBody`. A body that is not JSON reaches the verifier as `rawBody` too. `rawBody` is given only to the verifier: the routine's payload stays `{ body, query, headers }`.

### Patch Changes

- 88eaee5: fix: `<basePath>/` serves the app, and the screenshot viewport is capped

  - With `config.basePath` set, `<basePath>/` (with a trailing slash) serves the app root in `lowdefy dev`, in production and in the e2e server. It answered 404 before.
  - The screenshot tool's viewport `width` and `height` are at most 4096.

- 1766343: feat: Typed decisions outside a request, and dev errors that know which browser caused them

  `@lowdefy/ai-utils` exports `decide({ model, backend, state, questions, options })`, the typed-decision call behind the `Decide` request, for code that holds a model but has no connection or request. It returns the answers, the token usage and the provider metadata, which on the AI Gateway carries the call's cost.

  In the development server, browser and server errors now record which browser context caused them. Errors caused by the dev server's own headless browser during a journey run stay out of the build status and the agent event stream. Tabs that the dev server's own browser opens are still counted, but the agent tools that read state from a live tab no longer pick them over your own tab.

- 660157b: Add app events. The `events` object at the root of `lowdefy.yaml` takes `onInit` and `onInitAsync` actions that run once each time the app loads in the browser, whichever page opens first, and do not run again on navigation. The app `onInit` runs before the first page's own events and keeps the page in its loading state until it finishes, so a page's `onInit` can read the global values it set. The app `onInitAsync` runs after it without blocking the page, and pages re-render when it sets global values. Use them to set up `global`, for example user settings fetched with `CallAPI`. App events run outside any page, so the build fails if one uses a page-scoped action (`SetState`, `Request`, `Validate`, `Reset`, `CallMethod`, ...) or operator (`_state`, `_input`, `_request`, ...). Errors display and log like page event errors, run the `catch` actions, and do not stop the page from loading.

  Closes #815.

- 5ad581d: fix(build,server-dev): auth.dev alone is not an auth stack, and the dev mock user reaches \_user in the browser

  An `auth` block whose only key is `dev` declares no login method, no session store
  and no adapter, so it is no longer treated as an auth configuration: it demands no
  mechanism, no secret and no database, and the app builds and runs signed out in
  production. The block is still schema-checked, and adding any other `auth` key
  declares a real auth stack that is validated as before. In the dev server the mock
  user is now also passed to the client, so `_user` reads the same identity in the
  browser as on the server.

- 4d08b55: fix: A role or sign-in refusal from a request or endpoint is an expected outcome in the browser

  When an auth gate refused a request or endpoint an action called (a 401 for a signed-out caller, a 403 for a caller without the role or without an enrolled second factor), the browser lost the error's class. The action failed as an `ActionError`, the refusal was posted to `/api/client-error` and logged at error level, and a journey that clicked the action failed with an app error.

  The browser now keeps the class of an expected outcome the server answers itself: `AuthenticationError`, `AuthorizationError`, `TwoFactorEnrolmentRequiredError`, and a `UserError` answered with a 400. The action still stops, its error message still shows and its `catch` actions still run, but the error logs to the browser console only, and journeys pass over it.

  This changes what a `catch` list reads. For a refused `Request` or `CallAPI`, `_error.name` (and `_actions.<id>.error.name`) is now the refusal's class (`AuthorizationError`, `AuthenticationError`, `TwoFactorEnrolmentRequiredError`, or `UserError` for a 400), not `ActionError`, with the same message and no `cause`, so a catch list can branch on the refusal. A page's own `CallAPI` payload that the endpoint's `payloadSchema` refuses is a `ConfigError`, not a `UserError`.

- d7b2029: chore: Update the MCP SDK to 1.31.0 and `@hono/mcp` to 0.3.2.
- e3e74d5: Browser-only POST routes (`/api/client-error`, and `/api/feedback` in the dev server) now share one cross-site defence instead of copies of the same check, and additionally refuse a request the browser itself marks as cross-site via `Sec-Fetch-Site`, so a page on another site can no longer post to your log sink with the user's cookies attached.
- db1a4d3: fix(client): Keep browser storage per app and clear user data at sign-out

  Every key Lowdefy writes to the browser's local storage now names the app it belongs to (its `slug` and base path), so apps served from one origin no longer read or overwrite each other's values. The dark mode, locale and sider open preferences are kept per app and stay across sign-outs; a preference stored before this change is moved to the app's key the first time it is read.

  Data that belongs to a person is also kept per signed-in user: the `Search` block's recent searches. It is cleared when the user signs out with `Logout`, and on page load when a different user, or nobody, is signed in on the browser. The scroll positions Lowdefy keeps in session storage are cleared at the same time.

  Blocks reach the keys through two new block methods, `methods.getAppStorageKey(name)` and `methods.getUserStorageKey(name)`, and actions through `methods.getAppStorageKey(name)`.

- ebf95f8: fix(server-dev): Cheaper rebuilds and restarts in the dev server

  - **Restarts no longer fail with "Port in use".** A restart now waits for the old server process to exit before it starts the new one (up to 10 s, then a forced stop and up to 5 s more), so the new process never finds the port still taken and the server no longer stays down until the next restart.
  - **No more endless rebuild loop.** An app whose own local plugin package is its config directory (its plugin lives next to `lowdefy.yaml`) rebuilt itself every few seconds when its ref resolvers wrote into `public/`. The local plugin watcher now reacts only to code files (`.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx`, `.json`) and ignores `public/`, `node_modules` and the build directories. YAML and Markdown edits stay with the config watcher, so a page edit no longer runs a full build as well.
  - **Page builds no longer rewrite the whole key maps.** Every page the dev server built rewrote `keyMap.json` and `refMap.json` twice, and the files only grew (tens of MB on large apps, with a full parse after each edit). They now hold only what the config build wrote; each page build writes the keys it added to a small file under `build/jitMaps/`. Error locations, `/lowdefy-docs/find` and the file watcher read those files. A key from a page built before the last two page edits may resolve without a location.
  - **Unchanged build files are left alone.** After a config build, artifacts whose bytes did not change are no longer replaced, so Vite does not reload modules that did not change.
  - **Agents restart less.** The MCP tools and agent guidance now say to restart the dev server only when it seems stuck or build status looks stale, or after secrets a wrapper injects have changed. `.env` edits and local plugin code are picked up without a restart.

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

- 8c68631: feat: Opt-in Content-Security-Policy and no-store caching for pages and API responses

  - **`config.security.contentSecurityPolicy`.** Set `true` to send a Content-Security-Policy header with every app page, or an object with `reportOnly: true` to send it as `Content-Security-Policy-Report-Only`, and `directives` to add sources per directive (for example `script-src: ['https://www.googletagmanager.com']`). Sources are added to the default policy, never replace it. The build checks the option and writes the resolved policy to `build/security.json`. Off by default: without the option nothing changes.
  - **A nonce per render.** With the policy on, every page render draws a new 128-bit nonce. Lowdefy's inline scripts, the page config script, and every `<script>` and `<style>` element in `app.html.appendHead` and `appendBody` carry it, and antd's style tags take it through `ConfigProvider`. Styles allow `'unsafe-inline'`, since parts of antd (the modal and drawer scroll lock, text area auto size, watermarks) add styles that cannot carry a nonce.
  - **Dev server too.** `lowdefy dev` sends the same header, and allows the page's own websocket origin for hot reload.
  - **No-store responses.** HTML pages, `/api/page`, `/api/user`, `/api/request` and `/api/endpoints` (and `/api/root` in dev) send `Cache-Control: private, no-store`, so neither the browser nor a shared proxy stores them. Hashed assets under `/assets` keep their long-lived immutable caching.

- dda12e3: fix(api,servers): detached calls release the dispatcher at once. The `/api/detached` route awaited the target's whole routine before replying, and the dispatching invocation keeps itself alive (`waitUntil`) until that reply arrives — so every parent stayed in flight for as long as its detached children ran (a cron tick that answers in milliseconds was held open by its slowest dispatched job, keeping its instance's memory billed), and a chain of detached hops was a chain of nested in-flight requests. The route now answers `202` as soon as the call is authorized and runs the target after the response under its own `waitUntil` (new `acceptDetachedEndpoint` in `@lowdefy/api`); the outcome is logged as `detached_run_done` / `detached_run_failed`.
- 2ef077f: fix: `lowdefy dev` works with `config.basePath`, dev warns about inline page links, and the agent docs are complete

  - `lowdefy dev` now boots an app that sets `config.basePath`. The dev server used to answer `<basePath>/@vite/client` and the client entry with the page HTML, so the app never loaded. The app, its API and the `/lowdefy-docs` agent tools are all served under the base path (`/app/lowdefy-docs` for `basePath: /app`), and `.lowdefy/instance.json` records the URL with the base path, so `lowdefy mcp`, the hub and `lowdefy test` reach the dev server without extra setup. The dev server also reports itself ready and opens the browser at the base path.
  - `lowdefy dev` now reports the same warnings as `lowdefy build` for pages written directly in `lowdefy.yaml`: a `Link` to a page that does not exist, a `CallAPI` to a missing or `InternalApi` endpoint, websocket and dynamic block references, and `_state`, `_payload` and request state references. Before, only pages in their own `_ref` files were checked in dev.
  - `@lowdefy/docs-content` holds 20 pages it was missing, among them theming, blocks, page and app state, roles, auth configuration, websockets and notifications. The extractor now renders docs pages written as `_nunjucks` templates, and the content is regenerated from the current docs. The docs site's notifications, AxiosHttp and v3-to-v4 migration pages now show their `{{ ... }}` template examples instead of dropping them; the notifications page failed to render before.

- 0ba1937: fix(server-dev): A `lowdefy.yaml` with a YAML syntax error no longer leaves the build status at the last build's `ok`. The config watcher skipped the build when it could not read the Lowdefy version from the file, and reading the plugin list from `lowdefy.yaml` ran outside the part of the build that reports errors. The build now runs and `lowdefy_build_status` returns the parse error.
- fc8a168: fix(server-dev): Keep error locations right across config rebuilds in dev

  The dev server rebuilds config without restarting. A page loaded, or a request started,
  before a rebuild reported errors with the earlier build's config keys, and since every
  build numbered its keys from 1, such an error could name a different block, action or
  endpoint of the new build. Each dev build now gives its keys a fresh prefix, so a key from
  an earlier build never matches a node of the current one. A page build that was still
  running when the config rebuilt no longer writes its key and ref maps over the new ones.

- f550a8e: fix(server-dev): A `.env` edit made while the config build fails now reaches the server. The server restarted only when the build after the edit succeeded, and a later successful build does not restart it, so the new environment was not used until something else restarted the server.
- 9fc8d21: fix(server-dev): Dev server frees unused memory when it goes quiet

  The dev server's two processes grow their JavaScript heap during config builds and page loads, and Node did not give that memory back while the server sat idle. The dev server now runs one full garbage collection when it goes quiet: the build process 5 seconds after a build ends, and the Vite server process once nothing has used the server for 10 seconds and nothing is in flight. It runs again only after the server is used again, and never during a build or a request.

- 3c08142: fix(server-dev): Optimise client dependencies in a short-lived process so the dev server does not keep the optimiser's memory

  Vite's dependency optimiser keeps about 500 MB of native memory after it runs, and only ending the process gives it back. The dev server's Vite process used to run it whenever its cache was cold (every new checkout or worktree, and after every plugin install) and then held that memory for the rest of the session. The dev server now runs the optimiser in a separate process that exits before the Vite server starts, at start-up and before the restart that follows a plugin install, so the Vite server always starts with a warm cache. Measured on a small app after a page load and a screenshot from a cold cache: the Vite process took 627 MB instead of 1,248 MB. No extra restart happens, so open browser tabs are not reloaded for it. If the separate step fails, the dev server warns and optimises as before.

- a354a1f: fix(server-dev): Dev server rebuilds no longer break requests, websockets or plugin types, and the file watch covers every file the build reads

  - **Requests during a rebuild.** A config rebuild emptied the build folder and wrote the new build back file by file, so a request that arrived in that window failed with `API Endpoint "x" does not exist.` or `Connection "x" does not exist.`. The dev server now builds into a separate folder and moves each file over the live build, so every request finds a complete build, old or new. A failed build leaves the running build in place. On Windows, moving a file another process holds open is retried for a few seconds; a move that still fails is reported in build status, and the next change rebuilds.
  - **Websocket upgrades.** The request context of a websocket upgrade is now passed along with the upgrade request instead of through a module shared between the upgrade handler and the websocket route, which could stop live connections from connecting after a rebuild. A refused upgrade now answers with the route's status and logs why.
  - **Adding a page to the pages list rebuilds.** The file that holds the pages list (`pages: { _ref: pages.yaml }`, or a module's pages list) is now treated as app config, so adding a page to it rebuilds and the page is served.
  - **Files outside the app folder are watched.** Files the build reads outside the config folder and local module folders, such as a file a local module refs with `../`, now trigger a rebuild or page reload when edited. Local modules outside the config folder are watched by the same watcher.
  - **Apps inside a dot-folder are watched.** Dotfiles are now ignored relative to the watched folder, so an app in a git worktree under a folder such as `.claude/worktrees/` sees its edits.
  - **New plugin types after a restart.** Plugin type lists are read fresh on every build, and a restart from the dev tools (`lowdefy_restart`, or `lowdefy_dev_start` with `restart: true` on a terminal-started server) rebuilds the config first, so a block, request or operator type added to a local plugin is defined without stopping the dev server.

- 40f1ba7: The dev server applies `config.requestTimeout`

  The production server cuts off requests after `config.requestTimeout` (30 seconds by default), but the dev server applied no timeout, so a slow request only failed once deployed. The dev server now applies the same timeout to requests, API endpoints, cron and detached endpoint runs, and cancels the upstream calls a timed-out request leaves behind, as production does. JIT page builds and the dev-only docs, MCP and live-reload routes are not affected.

- 2fa700e: fix: Lowdefy apps no longer install Next.js.

  The production server still listed `@sentry/nextjs`, and the MongoDB connection still listed `@next-auth/mongodb-adapter`. Neither was used: Sentry already runs on `@sentry/node`, `@sentry/browser` and `@sentry/vite-plugin`, and the MongoDB auth adapter is built on BetterAuth. `@sentry/nextjs` requires Next.js as a peer, and `@next-auth/mongodb-adapter` requires `next-auth`, which requires Next.js, so every app installed Next.js (and `next-auth` with the MongoDB connection) for nothing. They are removed, along with the unused Next.js lint plugin. Sentry setup and configuration are unchanged.

  The production and development servers also no longer list `webpack` as a dev dependency. Nothing used it since the move to Vite, but the CLI installs a server's dev dependencies along with it, so every app installed webpack too.

- 550be9f: feat(api,client,build): email one-time code sign-in, and the magic-link email carries the code

  Magic-link sign-in fails behind corporate mail security that opens links before the
  person does: the scanner follows the link, the single-use token is spent, and the
  click that follows is rejected. Apps can now offer a one-time code instead. Enable
  `auth.emailOTP` and the app emails a short code the person types into the tab they
  started from, which no link scanner can consume, and which also works when the email
  is read on a different device from the one signing in. Two new actions drive it,
  `EmailOtpSend` and `EmailOtpVerify`.

  With both `auth.magicLink` and `auth.emailOTP` enabled, the magic-link email carries
  the code as well, so one email serves both paths and nothing about the existing
  `Login` flow changes: the person clicks the button, or falls back to typing the code.

- 8398345: fix(api,build,servers): Model caller-less system contexts on a single `context.system` trust property, and correct the per-runner trust scope for cron, webhook, and detached endpoint runs.

  Scheduled (cron), webhook, and detached endpoint runs execute with no user session. Nested
  `CallApi` steps in those routines were re-authorized against that session-less context, so any
  call to a protected (`auth.public: false`) endpoint failed — silently breaking runs that compose
  other endpoints. This replaces the previous blanket `system` flag with one run-level trust
  marker, `context.system`, read by every authorization layer, and scopes trust correctly per
  runner:

  - **Cron** is trusted at the transport (`CRON_SECRET`) and holds a system context from
    construction — nested `CallApi` steps blanket-pass (endpoint role-authorization is undefined
    without a caller, so it is skipped, not denied). Unchanged in behaviour.
  - **Webhook** now starts caller-less **and untrusted**: its public transport proves nothing, so a
    nested protected `CallApi` fails closed until the run earns trust. An endpoint declares trust
    through a `webhook.verify` request plugin that runs as a gate against the raw request before the
    routine body; on success the run becomes trusted, on failure the route returns 401 and the
    routine never runs. A webhook with no verifier runs untrusted throughout. The build now requires
    a webhook endpoint to be declared explicitly public (listed in `auth.api.public`) — an implicit
    or protected webhook is a build error.
  - **Detached** now carries the dispatching run's identity across the loopback hop instead of
    forcing a system context. A user-dispatched detached run authorizes nested calls against the
    user's roles exactly as a synchronous call would; a cron-, hook-, or verified-webhook-dispatched
    run inherits the system context and blanket-passes.

  User-session behaviour is unchanged: a user-initiated `CallApi` chain still re-authorizes each
  target against the user's roles.

- a71634f: fix(server-dev): Refuse to start a second dev manager for the same app

  Two dev managers on one app raced each other's incremental builds - both watched the
  config and rewrote the same build directory, so one wedged on a half-deleted pages
  directory (ENOTEMPTY) and kept serving a stale build with no error anywhere. The
  manager now takes a pid lock in the server directory and a second instance refuses
  loudly, naming the running pid; a lock whose pid is dead is taken over.

- 2fb125a: fix(server-dev): Rebuild the config on any change while the last build failed.

  The dev server decides whether an edit needs a config rebuild from the list of files the last successful build read. A file that only the failed build read, such as a new endpoint file whose error you are fixing, was not on that list, so fixing it only reloaded pages and the build status kept reporting the fixed error until `lowdefy.yaml` was touched. While the last config build failed, every change now rebuilds the config.

- ba80023: fix: Send a route's own HTTP answer (hono `HTTPException`) instead of a 500.

  The MCP transport refuses an unsupported `MCP-Protocol-Version` header with a 404 carrying a JSON-RPC body that the client SDK falls back on to negotiate a version both sides know — Claude Code probes with a newer protocol revision than the server's SDK supports and then downgrades. The error handler turned that into a logged internal error and a 500 on every connection. It now sends the exception's own response with one warning line, no structured error log and no Sentry capture.

- aa1736d: fix: Accept a repeated `MCP-Protocol-Version` header on `/api/mcp`.

  Claude Code sends the negotiated protocol version under two spellings of the header, which the Fetch Headers constructor folds into one comma-joined value (`2025-11-25, 2025-11-25`). The MCP transport compared that raw string against its supported list and answered 404 "Unsupported protocol version" — shown by Claude Code as "MCP endpoint not found". The route now collapses a repeated value to the single version it names before the transport reads it; a header naming two different versions is still refused.

- bfc6a00: fix: Endpoint responses no longer carry build markers, and the dev run-endpoint tool reports a failed routine's own error.

  - Endpoint and request responses built from config (a `:return` object, a `:set_state` value read back) no longer include `~k`, `~r` and `~l` keys or wrap arrays as `{ "~arr": [...] }`. A webhook endpoint now sends its `:return` value to the caller in exactly the shape the config gives it.
  - The dev server's run-endpoint and run-request tools (`lowdefy_run_endpoint`, `lowdefy_run_request`) no longer answer with `TypeError: Cannot read properties of undefined (reading 'length')` when a routine fails or ends without `:return`. They return the routine's result, including its error and the error's config source.
  - `serializer.serialize` accepts `skipMarkers`, as `serializeToString` already does.

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

- 2640121: fix(servers): Answer unserved /.well-known/\* paths with 404 instead of the app shell

  Well-known URIs are machine-facing, but any path outside the deployment's own OAuth
  discovery documents fell through to the page catch-all and answered 200 text/html.
  Clients probing discovery documents - an MCP client's OAuth probe, for example -
  failed with "Failed to parse JSON" instead of learning there is nothing to discover.
  Unserved well-known paths now answer 404 JSON; the real discovery documents are
  unchanged.

- 0fd3e8b: fix: Headless dev tools wait for a client navigation to land before reading the page

  A page whose `onInit` runs a `Link` changes the URL straight away, but the app keeps naming the page it is leaving until the next page's config has loaded and rendered. The dev server's headless page wait (screenshots, state inspection and journeys) treated that leaving page as ready, so a tool or journey step could read the page being left instead of the page it redirects to. The wait now holds until the next page has rendered and settled.

- 07ecdf5: Update `hono` to 4.13.7 in the servers, a release with published security fixes.
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

- 53e633f: fix(server-dev): A dev tool call that names a `user` acts as that user while a mock user is active

  `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator` and `lowdefy_load_state` acted as `auth.dev.mockUser` (or `--mock-user`) whenever one was set, ignoring the `user` passed to the call. An explicit `user` now wins; a call with no `user` still acts as the mock user.

- 08f76bb: Heavy blocks load their code when they first mount.

  - `createLazyBlock` in `@lowdefy/block-utils` lets any plugin block load its implementation on first mount. A hidden block, or one in a closed panel, unopened tab or modal, never downloads it. The block's methods (declared in `meta.methods`) can be called from mount: calls made before the code arrives run in order once it loads, or fail with the usual error. Implementation modules are named `*.lazy.js`, and the production server prefetches them at low priority.
  - `AgentChat` is lazy. Its drawer launcher paints immediately, and a click before load opens the drawer when the chat arrives. Mermaid diagrams, code highlighting and LaTeX load only when a message uses them. `setInput` is now listed in the block's methods, and `renderLatex` works in the browser build.
  - `EChart` loads the charting library inside its own sized box, so pages paint without it and the layout does not move.
  - `HtmlComponent` no longer re-sanitizes and re-renders HTML that has not changed.

  No config changes.

- 5355d30: fix: A POST whose body is not a JSON object is answered with 400 and logged as a warning, instead of a 500 logged as a server error. This covers `/api/endpoints/*`, `/api/request/*`, `/api/agent/*`, `/api/detached/*`, `/api/usage` and `/api/client-error` on every server, plus the dev server's `/api/dev-inspect`, `/lowdefy-feedback` and `/lowdefy-docs/state-checkpoints/{load,snapshot}`. The dev tool routes that already treat a missing or unreadable body as empty keep doing so.
- f33e96a: `lowdefy mcp` works in every project and worktree you open an agent session in, and one session can run the dev servers of several projects.

  - **Register once for every project.** `lowdefy agent-setup --user` adds the `lowdefy` MCP server to Claude Code's user scope, so every session has the Lowdefy tools — in a repository nobody set up, in a directory above several projects, anywhere. It needs no app. On Windows it registers `cmd /c npx ...`. A rerun whose add fails keeps your existing registration. Without Claude Code on your `PATH` it prints the entry for your agent client.
  - **Tools in a fresh worktree.** `agent-setup` writes `npx --prefer-offline --yes lowdefy@<version> mcp` into `.mcp.json`, pinned to the version of the CLI running agent-setup, so every app in a repository writes the same entry. A worktree nobody has installed yet still starts the server: npx serves the pinned version from the shared npm cache, offline, in under a second. agent-setup first runs the pinned version through npx and refuses one npm cannot serve, so a committed entry never leaves teammates without tools.
  - **Agents install what is missing.** When an app lists `lowdefy` in its `package.json` but its dependencies are not installed, `lowdefy_dev_start` answers with the install command and where to run it (for example `pnpm install` at the workspace root), instead of running a dev script that cannot start.
  - **Trust a repository once.** Approving an app outside the session's checkout offers **Always allow this repository**, which covers all of its git worktrees in every later session. Trust is per git repository and only comes from you: the question, or `lowdefy hub trust [directory]`, which runs only in an interactive terminal so an agent cannot run it. `lowdefy hub untrust [directory]` and `lowdefy hub trusted` manage the list.
  - **The MCP server is renamed `lowdefy`** (was `lowdefy-docs`), so its tools are `mcp__lowdefy__*`. Rerunning `lowdefy agent-setup` replaces the `lowdefy-docs` entry 6.x wrote in `.mcp.json` (an entry pointing at a `localhost` port; a `lowdefy-docs` entry pointing anywhere else is left as it is) and renames the server in `.claude/settings.json` and `.claude/settings.local.json`: in `enabledMcpjsonServers` and `disabledMcpjsonServers`, and in the `permissions.allow`, `ask` and `deny` tool rules (`mcp__lowdefy-docs__lowdefy_get_schema`, or `mcp__lowdefy-docs` for all its tools, become `mcp__lowdefy__…`), so tool approvals carry over. It also updates the name in the skill and `AGENTS.md` section it wrote, and `agent-setup --user` removes an old `lowdefy-docs` user registration. Update any other place that names `mcp__lowdefy-docs__` tools, such as hooks. The dev server's `/lowdefy-docs` routes are unchanged.
  - **Mixed Lowdefy versions.** When `lowdefy mcp` and the dev server it calls run different Lowdefy versions, a tool call either works or fails with the fix spelled out. `lowdefy mcp` adds the tools it does not know to the session's tool list, and shared tools follow the newest comparable server: a dev server on a newer Lowdefy version replaces their descriptions and schemas. Versions are compared only when both are releases or share a major, so an experimental build is never overridden by an older release line. The client is told to list the tools again. A successful call notes both versions once a session, and every failed call carries the note, with the pinned fix `npx lowdefy@<dev server version> agent-setup` for the agent to pass to the developer rather than run. A dev server `lowdefy mcp` cannot reach is reported with its URL.

- 33f4bba: fix(server-dev): The dev server rebuilds only the pages an edit changed

  - **Built pages survive edits.** Editing a config file no longer makes the dev server throw away every page it has built. It remembers which files each page was built from, and what they contained, and after an edit rebuilds only the pages whose files changed. Open tabs and pages an agent checks after the edit no longer each pay for a rebuild. Pages built with the app's own resolvers, transformers or `.js` refs are still rebuilt after every edit, because the server cannot see what that code reads.
  - **Build status sees edits straight away.** `lowdefy_build_status` and `/lowdefy-docs/build-status` list the pages an edit touched even before anything requests them, and `wait: true` builds exactly the pages a request would rebuild.
  - **A page no longer keeps content from just before an edit.** An edit that landed while the page was building could leave the page built from the old content until the next edit.
  - **One page's unknown block type no longer breaks other pages.** A page with a misspelt block, action or operator type made every page built after it fail with its error until the next edit.
  - **Edits made while the config build fails reach the page.** A page edit made while `lowdefy.yaml` failed to build was not picked up; the page now shows it.
  - A page that is rebuilt lists its warnings again, and warnings are logged again after an edit.
  - **App code is loaded again only when it changes.** The build loaded a resolver, transformer or `.js` ref as a new module on every page build, and each copy stayed in memory. It now loads a file again only when its content changed. When `@lowdefy/build` is linked from a local checkout, an edited resolver or transformer was never loaded again, so pages kept its old output until a restart; they now show the edit.
  - **A transformer on a page's own `_ref` runs in the dev server.** A page listed as `_ref: { path, transformer }` (or with a resolver and a transformer) was built in development without its transformer, so it differed from the production build.
  - **Module var default files are watched.** Editing a file that a module var's default refs (`vars: { greeting: { default: { _ref: defaults/greeting.yaml } } }`) changed nothing in the dev server until it restarted. Now the config is rebuilt when the module's pages use the var, and the pages that use it through a module component are rebuilt.
  - **Pages keep their `_js` when the dev server recreates its build context.** A page requested while another request picked up a config build (or the dev server recreated its build context to free memory) could be served without its `_js` functions and icons, failing with "\_js function not found" until reloaded. A page build that finished on the old context could also overwrite the `_js` maps written by newer page builds. The page now gets its `_js` and icons from the context it was built on, and builds on an old context no longer write the `_js` maps.

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

- ce0efc7: fix(server-dev): A Link that only changes the query on a static page no longer flashes the Building page screen

  In the dev server, a Link to the page that is already open with only the query changed hid the whole page behind the "Building page..." screen for a moment, which looked like a page reload. A static page's config does not depend on the query, so it now stays cached across query changes and the address updates in place. Pages with Dynamic blocks still re-resolve on every navigation, and the first navigation to one now fetches its config once instead of twice.

  The production server no longer fetches `/api/page/<pageId>` for a Link that stays on the open static page. The page re-renders so it sees the new URL.

- 949dc48: Headless pages (screenshots, state inspection, journeys) open about 15 seconds faster. Every dev page keeps the reload event stream open, so waiting for the network to go idle always ran out its timeout first. Pages now wait for the page load and then for the page the app shows to settle, so a page that redirects, such as a protected page opened signed out, settles on the sign-in page instead of waiting another 15 seconds and reporting it did not settle. Images still loading are waited for, except lazy images below the fold, which never load until scrolled to.
- 386318b: refactor(server-dev): the headless tools' ready check takes no argument and always reads the page instance on screen.
- 8d91850: The dev server no longer runs a machine out of network ports under heavy headless use. Its proxy opened an extra connection to check the server before every request, and a page load is hundreds of requests, so running journeys or screenshots for a minute could leave no free local ports and connections failed with `EADDRNOTAVAIL`. The proxy now checks a server once, and again only after a restart or a failed request. After a restart it waits for the old server to stop before checking the new one, and a page or module request that never reached a server that was going away waits for the next one instead of failing.
- cfc8f71: chore(servers): Remove dependencies the servers do not import

  `@lowdefy/server-dev` no longer depends on `process`, `@lowdefy/engine` and `postcss`, and
  `@lowdefy/server` and `@lowdefy/server-e2e` no longer depend on `pino` directly (it still
  comes with `@lowdefy/logger`, and `postcss` with `vite`). This trims the install in every
  app's server directory.

- 6d6fa5f: A linked workspace plugin pinned to another Lowdefy release no longer brings its own copies of the Lowdefy libraries into the client. The dev server could load the plugin's older `@lowdefy/helpers` or `@lowdefy/block-utils` for the whole client and fail with "does not provide an export named ...", and a production build bundled both copies, so the plugin's blocks missed the HTML enhancements the client registers. Every `@lowdefy` package the server depends on now resolves from the server.
- ccff0a3: fix(servers): Update `tailwindcss` and `@tailwindcss/postcss` to 4.3.3.

  `@tailwindcss/postcss` 4.3.1 pinned `postcss` 8.5.15, which has a published advisory for reading source map files named in CSS comments. 4.3.3 allows a patched `postcss`. The 4.3.2 and 4.3.3 releases also fix a number of small class generation issues, and Preflight now names explicit platform fonts so CJK text renders correctly on Windows.

- 7623c86: The server resolves each request's client address itself, and a new `config.trustedProxies` setting names the proxies it believes.

  - Auth rate limits (sign-in and sign-up: 3 attempts per 10 seconds per address), the session's recorded address and the captcha check use the address the server resolved, not the `X-Forwarded-For` header a client sent. A self-hosted server takes the address from the connection. Behind a reverse proxy, load balancer or ingress, every connection comes from the proxy, so list its addresses or CIDR ranges in `config.trustedProxies`; the server then reads `X-Forwarded-For` from the right, skips trusted hops and takes the first untrusted address. Without it every client shares the proxy's rate limits. The server logs a warning the first time a request carries `X-Forwarded-For` while `trustedProxies` is not set.
  - On Vercel the function entry `lowdefy vercel-output` writes takes the address from `x-real-ip`, which the platform sets on every request.
  - The production request and error logs record the resolved address as `client_address`.
  - `lowdefy build` fails when a `config.trustedProxies` entry is not an IP address or CIDR range.
  - In `lowdefy test` journeys, each actor keeps its own client address.

- 6d71d20: fix(server): The client build shares one copy of `antd`, `@ant-design/x`, `@ant-design/cssinjs` and `dayjs` with linked plugin packages (pnpm `link:` or workspace plugins), as it already did for React. A linked block package resolved its own `antd`, so its components never saw the server's `App`, `ConfigProvider` and `StyleProvider`. For example, action messages failed with `message.error is not a function`. A linked `dayjs` also missed the locale the client sets.
- b8beaa3: Websocket upgrades from another origin are refused. `/api/websocket` accepts an upgrade whose `Origin` matches the `Host` it arrived on, the first `X-Forwarded-Host`, or the app's configured public URL (`BETTER_AUTH_URL`, the current environment's `url`, or an auth trusted origin), and one that sends no `Origin` (a server or script). Any other upgrade gets a 403, and the server logs a warning with its `Origin` and `Host`. Behind a proxy or CDN, pass the original `Host` or set `X-Forwarded-Host`. Hosts compare without case and without default ports. In `lowdefy dev`, the upgrade's `Host` must also be `localhost`, a `*.localhost` name or an IP address, as for every other dev request. The rule lives in `@lowdefy/api` (`isSameOriginRequest`, `isWebSocketOriginAllowed`), shared by every server.
- f160307: fix(api): Websockets re-check their caller and close when it changes

  An open websocket now follows the session it was opened with. The server resolves the caller again from the connection's upgrade headers before every subscribe and at least once a minute. When the user signed out, the session ended, the membership was removed, the roles changed or the user switched organization, the server closes the connection with code `4401`. The client reconnects straight away, which authenticates afresh, and resubscribes as the current caller (a connection closed this way again within 30 seconds of opening reconnects with the normal backoff); a subscription that caller may not hold fails as it would on a freshly loaded page.

  Subscriptions now run the connection `read` check, as requests do: a connection with `read: false` refuses a `MongoDBChangeStream` subscription. A websocket type on a connection is checked unless its meta sets `checkRead: false`.

- 242746a: Fixes for apps built and developed on Windows. Apps with local modules now build on Windows: the build used to reject every module `_ref` as escaping the module's package root, because it compared paths using `/` separators. The page scaffold hint and annotated screenshot paths given to agents now use `/` separators on every platform.
- Updated dependencies [81bd4f0]
- Updated dependencies [cf25c09]
- Updated dependencies [08d8938]
- Updated dependencies [d3e1ee1]
- Updated dependencies [14c4764]
- Updated dependencies [b3ba6fb]
- Updated dependencies [f7fa621]
- Updated dependencies [aad166b]
- Updated dependencies [9cd5a44]
- Updated dependencies [099d412]
- Updated dependencies [0a1f07a]
- Updated dependencies [07a67b5]
- Updated dependencies [ac9db75]
- Updated dependencies [d12c7cc]
- Updated dependencies [2dab826]
- Updated dependencies [f0162f4]
- Updated dependencies [2735310]
- Updated dependencies [80b5cbf]
- Updated dependencies [26a1894]
- Updated dependencies [6f20e75]
- Updated dependencies [7c4879b]
- Updated dependencies [7836aa2]
- Updated dependencies [2bdb855]
- Updated dependencies [80c0ad2]
- Updated dependencies [cad92af]
- Updated dependencies [660157b]
- Updated dependencies [5ad581d]
- Updated dependencies [4d08b55]
- Updated dependencies [6d311c8]
- Updated dependencies [99a4f35]
- Updated dependencies [d7b2029]
- Updated dependencies [ce95773]
- Updated dependencies [1227e62]
- Updated dependencies [ae6afbf]
- Updated dependencies [6144814]
- Updated dependencies [c377065]
- Updated dependencies [cfc8f71]
- Updated dependencies [81bd4f0]
- Updated dependencies [10bee50]
- Updated dependencies [81bd4f0]
- Updated dependencies [cb3551c]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [baf6576]
- Updated dependencies [d42f420]
- Updated dependencies [e024e63]
- Updated dependencies [3be51e0]
- Updated dependencies [7636cca]
- Updated dependencies [ebf95f8]
- Updated dependencies [24383b5]
- Updated dependencies [575a5ee]
- Updated dependencies [b2cdc5a]
- Updated dependencies [81a5ad3]
- Updated dependencies [2595439]
- Updated dependencies [8c68631]
- Updated dependencies [71fef2d]
- Updated dependencies [26d905c]
- Updated dependencies [460fdaa]
- Updated dependencies [badaa49]
- Updated dependencies [dda12e3]
- Updated dependencies [a6e7e42]
- Updated dependencies [2ef077f]
- Updated dependencies [fc8a168]
- Updated dependencies [8348aa9]
- Updated dependencies [a354a1f]
- Updated dependencies [f9e483f]
- Updated dependencies [588344b]
- Updated dependencies [abb3f27]
- Updated dependencies [73642f1]
- Updated dependencies [8d1ea50]
- Updated dependencies [5852b65]
- Updated dependencies [2fa700e]
- Updated dependencies [d2c8e01]
- Updated dependencies [f889c26]
- Updated dependencies [eab310c]
- Updated dependencies [2746b40]
- Updated dependencies [550be9f]
- Updated dependencies [238cba5]
- Updated dependencies [eaf9cf8]
- Updated dependencies [0f56696]
- Updated dependencies [eaf9cf8]
- Updated dependencies [42bc1ac]
- Updated dependencies [b308c78]
- Updated dependencies [3688c5f]
- Updated dependencies [a1367df]
- Updated dependencies [7c20d1b]
- Updated dependencies [6b3a9bb]
- Updated dependencies [3f5c274]
- Updated dependencies [1855a25]
- Updated dependencies [4a35ba2]
- Updated dependencies [36f864c]
- Updated dependencies [eaa6517]
- Updated dependencies [b56bb7a]
- Updated dependencies [1d31a29]
- Updated dependencies [09717e8]
- Updated dependencies [1bb3012]
- Updated dependencies [2baefc1]
- Updated dependencies [6b4bd99]
- Updated dependencies [662eaa9]
- Updated dependencies [2ffac21]
- Updated dependencies [8398345]
- Updated dependencies [a2b5466]
- Updated dependencies [f30e559]
- Updated dependencies [8c50bfc]
- Updated dependencies [18f70ca]
- Updated dependencies [705498c]
- Updated dependencies [760b660]
- Updated dependencies [4943f2d]
- Updated dependencies [9c9b3d7]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [f278706]
- Updated dependencies [c744e40]
- Updated dependencies [de6a268]
- Updated dependencies [239a3a7]
- Updated dependencies [49490b6]
- Updated dependencies [ec6d2e7]
- Updated dependencies [a79fb1d]
- Updated dependencies [7bd38cb]
- Updated dependencies [4fa189f]
- Updated dependencies [d5f7f3f]
- Updated dependencies [4cc0f36]
- Updated dependencies [ef64856]
- Updated dependencies [cb0acad]
- Updated dependencies [9a92898]
- Updated dependencies [0205b5a]
- Updated dependencies [316f5be]
- Updated dependencies [ba86509]
- Updated dependencies [f9d8520]
- Updated dependencies [e5b2f83]
- Updated dependencies [69c31e8]
- Updated dependencies [da76905]
- Updated dependencies [9953932]
- Updated dependencies [1766343]
- Updated dependencies [9ed1386]
- Updated dependencies [73c5e14]
- Updated dependencies [c3e0d79]
- Updated dependencies [2c04c5b]
- Updated dependencies [08f76bb]
- Updated dependencies [e5cffa6]
- Updated dependencies [1d547f3]
- Updated dependencies [5355d30]
- Updated dependencies [d46ce43]
- Updated dependencies [f33e96a]
- Updated dependencies [5e6bed8]
- Updated dependencies [60fb714]
- Updated dependencies [ee7285c]
- Updated dependencies [371a4a6]
- Updated dependencies [c6b598a]
- Updated dependencies [d455e25]
- Updated dependencies [aa510ca]
- Updated dependencies [5400fcf]
- Updated dependencies [537bf54]
- Updated dependencies [3a28594]
- Updated dependencies [31605fb]
- Updated dependencies [959ec32]
- Updated dependencies [856e65d]
- Updated dependencies [c1bb9a0]
- Updated dependencies [81bd4f0]
- Updated dependencies [409c918]
- Updated dependencies [5060cdf]
- Updated dependencies [05b66f2]
- Updated dependencies [b368cfe]
- Updated dependencies [a34939d]
- Updated dependencies [cda22c0]
- Updated dependencies [366ed1e]
- Updated dependencies [33f4bba]
- Updated dependencies [5634e63]
- Updated dependencies [db99f9f]
- Updated dependencies [e6302c6]
- Updated dependencies [43e5dc4]
- Updated dependencies [1f58d7f]
- Updated dependencies [aa6bb38]
- Updated dependencies [a9442cc]
- Updated dependencies [3c2258c]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [3eb3691]
- Updated dependencies [5017abe]
- Updated dependencies [99fcb06]
- Updated dependencies [06a3a4a]
- Updated dependencies [588ca93]
- Updated dependencies [493a1e6]
- Updated dependencies [effdeb3]
- Updated dependencies [25ce8ba]
- Updated dependencies [6dc9114]
- Updated dependencies [ae3541c]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
- Updated dependencies [3aa6f39]
- Updated dependencies [99c9dac]
- Updated dependencies [44e8f29]
- Updated dependencies [fa02e14]
- Updated dependencies [537bf54]
- Updated dependencies [9de3cf9]
- Updated dependencies [3f3a320]
- Updated dependencies [ecdfb65]
- Updated dependencies [4a69885]
- Updated dependencies [7623c86]
- Updated dependencies [26d905c]
- Updated dependencies [56dfd8e]
- Updated dependencies [2486253]
- Updated dependencies [7ab8964]
- Updated dependencies [712d6ef]
- Updated dependencies [afd1fa2]
- Updated dependencies [4f37391]
- Updated dependencies [5d951af]
- Updated dependencies [4b3f5bd]
- Updated dependencies [b8beaa3]
- Updated dependencies [36c9d6a]
- Updated dependencies [088b117]
- Updated dependencies [f160307]
- Updated dependencies [31911e7]
- Updated dependencies [242746a]
- Updated dependencies [aca0ddf]
  - @lowdefy/actions-core@7.0.0
  - @lowdefy/api@7.0.0
  - @lowdefy/build@7.0.0
  - @lowdefy/blocks-antd-x@7.0.0
  - @lowdefy/operators-js@7.0.0
  - @lowdefy/node-utils@7.0.0
  - @lowdefy/docs-content@7.0.0
  - @lowdefy/helpers@7.0.0
  - @lowdefy/client@7.0.0
  - @lowdefy/blocks-aggrid@7.0.0
  - @lowdefy/blocks-antd@7.0.0
  - @lowdefy/engine@7.0.0
  - @lowdefy/errors@7.0.0
  - @lowdefy/connection-axios-http@7.0.0
  - @lowdefy/blocks-basic@7.0.0
  - @lowdefy/blocks-markdown@7.0.0
  - @lowdefy/block-utils@7.0.0
  - @lowdefy/plugin-better-auth@7.0.0
  - @lowdefy/blocks-table@7.0.0
  - @lowdefy/blocks-tiptap@7.0.0
  - @lowdefy/e2e-utils@7.0.0
  - @lowdefy/connection-mongodb@7.0.0
  - @lowdefy/operators-dayjs@7.0.0
  - @lowdefy/operators-nunjucks@7.0.0
  - @lowdefy/operators-change-case@7.0.0
  - @lowdefy/operators-cron@7.0.0
  - @lowdefy/operators-diff@7.0.0
  - @lowdefy/operators-mql@7.0.0
  - @lowdefy/operators-uuid@7.0.0
  - @lowdefy/operators-yaml@7.0.0
  - @lowdefy/blocks-echarts@7.0.0
  - @lowdefy/blocks-loaders@7.0.0
  - @lowdefy/layout@7.0.0
  - @lowdefy/blocks-captcha@7.0.0
  - @lowdefy/websockets-core@7.0.0
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

- 6d6f8fa: Improved error handling: each reader of a server error now gets its own view of it.

  - **Users and app config see the author's message or one generic message.** A server error the app author did not write now reaches the browser as "Something went wrong.", with its `name`, `code`, `statusCode`, `configKey` and a `requestId`. Messages written with `:throw` or `:reject`, failed `ValidateSchema` steps, a plugin's `UserError`, and authentication refusals, are shown as before. This applies to the error toast, `_actions`, `_request_details`, websocket errors, MCP tool results and the AgentChat stream, the same way in development and production. An action whose error toast showed a connection's own message now shows the generic one.
    - The generic message is the built-in `server.genericError` i18n string. Override it per locale under `config.i18n.messages`, for example `server.genericError: 'Etwas ist schiefgelaufen.'`.
    - To show different text for one action, set `messages.error` on the action.
    - To show the real message, read it with the new `_error` operator in the endpoint's `:catch` and send it on, for example `:throw: { _error: message }`.
  - **The dev server shows the full error.** In `lowdefy dev`, the error bar, the browser console and the dev MCP tools show the full server error, with its config location, while app config sees the same generic error as in production. Different failures of the same action are now each shown, instead of only the first.
  - **The browser console prints the request id** under a server error, to find the matching server log line and Sentry event.
  - **Production logs and Sentry keep a fixed set of error fields.** Each logged error keeps its name, message, stack, `code`, `statusCode` and cause, plus Lowdefy's own fields (`configKey`, `source`, `received`, ...) on Lowdefy errors. Fields a library attaches, such as an HTTP client's request config and response, are no longer logged. Values of the app's secrets (`LOWDEFY_SECRET_*`, `CRON_SECRET`, `AUTH_SECRET`) are replaced with `[REDACTED]` in production log lines and Sentry events, and credential-named keys in `received` are masked. Sentry events now carry the error's fields under `extra.error` and a `requestId` tag, and no longer attach incoming request bodies.
  - **An AxiosHttp request that gets a 5xx response now fails with a `ServiceError`**, where it used to fail with a `RequestError`. AxiosHttp now sets `statusCode` on its error, and a 5xx status marks an error as a service failure, like a network error or timeout. Config that checks `name` for `RequestError` on these failures, for example `_eq: [{ _error: name }, 'RequestError']`, should also accept `ServiceError`, or check `statusCode` instead. The server log event for these failures is now `service_error`.

- Updated dependencies [f92aa11]
- Updated dependencies [ae9803e]
- Updated dependencies [ea69869]
- Updated dependencies [08e05f9]
- Updated dependencies [6d6f8fa]
- Updated dependencies [1d3a0b8]
- Updated dependencies [9592255]
- Updated dependencies [d1bd356]
- Updated dependencies [5ad2b62]
- Updated dependencies [08cbf21]
- Updated dependencies [1bbaab7]
- Updated dependencies [5657441]
- Updated dependencies [6d6f8fa]
- Updated dependencies [2b2b27a]
  - @lowdefy/blocks-antd-x@6.1.0
  - @lowdefy/blocks-aggrid@6.1.0
  - @lowdefy/blocks-antd@6.1.0
  - @lowdefy/blocks-basic@6.1.0
  - @lowdefy/block-utils@6.1.0
  - @lowdefy/blocks-tiptap@6.1.0
  - @lowdefy/operators-js@6.1.0
  - @lowdefy/helpers@6.1.0
  - @lowdefy/api@6.1.0
  - @lowdefy/engine@6.1.0
  - @lowdefy/docs-content@6.1.0
  - @lowdefy/build@6.1.0
  - @lowdefy/blocks-echarts@6.1.0
  - @lowdefy/blocks-markdown@6.1.0
  - @lowdefy/connection-axios-http@6.1.0
  - @lowdefy/plugin-next-auth@6.1.0
  - @lowdefy/node-utils@6.1.0
  - @lowdefy/client@6.1.0
  - @lowdefy/errors@6.1.0
  - @lowdefy/logger@6.1.0
  - @lowdefy/layout@6.1.0
  - @lowdefy/blocks-loaders@6.1.0
  - @lowdefy/operators-change-case@6.1.0
  - @lowdefy/operators-dayjs@6.1.0
  - @lowdefy/operators-diff@6.1.0
  - @lowdefy/operators-mql@6.1.0
  - @lowdefy/operators-nunjucks@6.1.0
  - @lowdefy/operators-uuid@6.1.0
  - @lowdefy/operators-yaml@6.1.0
  - @lowdefy/actions-core@6.1.0
  - @lowdefy/websockets-core@6.1.0

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

- 5ad9fd5: feat: Per-call `user` for the agent tools that render a page headless

  The headless renderer signs in as a roleless user, so any page or request gated on a role rendered empty or refused for an agent — and the only lever was `--mock-user`, which bypasses login for the whole dev server, the developer's own browser included.

  `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator` and `lowdefy_load_state` now accept a `user` — merged over the default headless user, so `{"roles": ["admin"]}` is usually all you need:

  ```json
  { "pageId": "users", "user": { "roles": ["admin"] } }
  ```

  Each call opens its own browser context, so one call can act as an admin and the next as a plain member. Since no auth engine runs for an injected caller, nothing derives the rest of the record — pass `email`, `profile` or `attributes` too when a page reads them.

  `user` is headless-only, because a page the developer opens in their own browser carries their real session. Passing `user` to `lowdefy_inspect_state`/`lowdefy_eval_operator` therefore selects the headless source, and combining it with `source: "tab"` is an error rather than a silently ignored role — as is combining it with `lowdefy_load_state`'s `mode: "registry-only"`, which hands the developer a URL to open themselves.

  The plain HTTP routes take the same param — `?user={"roles":["admin"]}` on the GET routes, a `user` key in the body of `POST /lowdefy-docs/eval-operator` and `POST /lowdefy-docs/state-checkpoints/load`. A malformed or contradictory `user` answers `400`, distinct from the `502` a failed render returns, so an agent can tell "fix your call" from "retry".

- ea4de26: feat: Live state x-ray, state & data checkpoints, request execution, and app map for AI agents

  The dev server's agent toolbelt grows from discovery and build feedback to full runtime visibility — 23 MCP tools total at `/lowdefy-docs/mcp`.

  **Live state x-ray (`@lowdefy/server-dev`)**

  - `lowdefy_inspect_state`: read the ACTUAL state, request results, and event log of a running page. When you have the page open in your browser it reads your live tab — reproduce a bug by clicking through the app, then let the agent look at exactly what you see. Falls back to a headless run otherwise.
  - `lowdefy_eval_operator`: evaluate any operator expression (like `{"_state": "customer.name"}`) against live page state — a REPL for config, running in the real browser runtime.

  **State & data checkpoints**

  - `lowdefy_snapshot_state` captures a page's state and every request's recorded response into a committable `checkpoints/<name>/` folder — one file per part, one file per request, easy to review in git.
  - `lowdefy_load_state` puts the app back into that state: recorded request data is served by the dev server automatically, and `?_checkpoint=<name>` on any page URL restores the state in a normal browser tab — hand a teammate a URL that opens the app mid-scenario.
  - `lowdefy_checkpoint_to_mocks` converts a checkpoint into `@lowdefy/e2e-utils` `mocks.yaml` fixtures for e2e tests.
  - `lowdefy_checkpoint` / `lowdefy_revert_checkpoint` snapshot and restore config files around risky edits.

  **Request execution and app understanding**

  - `lowdefy_run_request` executes a request with a test payload to verify data shape. Read-only types always run; write requests need `cli.agentTools.allowWriteRequests: true` in lowdefy.yaml (dev-only opt-in).
  - `lowdefy_app_map`: every page, menu, connection, endpoint, and agent in one call — onboard to a large app instantly.

  **@lowdefy/e2e-utils**

  - New `@lowdefy/e2e-utils/runtime` export: the runner-agnostic surface (navigation, state/request getters, mocking, page manager) usable outside the Playwright test runner. Assertions moved to `src/assertions/` — the package's public API is unchanged.
  - Fixed `setState` silently doing nothing — it now uses the engine's real state primitives.

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

- 37c8c14: feat: `auth.strategies` — apiKey and JWT header authentication for API callers.

  - New `auth.strategies` config block: apiKey (default `X-API-Key` header) and jwt strategies, each granting the caller the strategy's `roles`.
  - MCP and service clients that cannot hold a session cookie authenticate per request; a matched strategy yields a caller (`apiKey:{strategyId}:{keyId}`) that flows through the existing authorization and `_user` machinery.
  - Unauthenticated calls to role-gated endpoints now return 401 (`AuthenticationError`) instead of a masked error.

- 079b7d6: feat: Option/Alt+click any element to open its yaml in VS Code

  Hold Option (macOS) or Alt (Windows/Linux) and click any element in the running dev app to open the yaml file that defines its block in VS Code, at the exact line. While the modifier is held, the hovered block shows a blue highlight with its blockId and the cursor becomes a pointer, so you see exactly what a click will open. Blocks generated at runtime (list items, dynamic content) resolve to their nearest configured ancestor, and blocks defined in modules open the module file that defines them. Plain clicks, Option/Alt+clicks outside any block, and Cmd/Ctrl+clicks (the browser's open-in-new-tab) keep their normal behaviour. Dev server only.

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

- 28cb944: feat: Dev server docs and MCP endpoint for AI coding agents

  The dev server now always serves documentation for everything installed in your project — every block, operator, action, connection and request type, from core plugins and your own local plugins — plus the full Lowdefy docs as markdown.

  **Docs API and MCP endpoint (`@lowdefy/server-dev`)**

  - Plain GET routes under `/lowdefy-docs`: list all available types per kind, JSON schemas per type, block usage examples, docs pages as markdown, and search.
  - An MCP endpoint (streamable HTTP) at `/lowdefy-docs/mcp` exposing the same as tools (`lowdefy_list_types`, `lowdefy_get_schema`, `lowdefy_get_examples`, `lowdefy_get_doc`, ...) so agents like Claude Code can look up exact type contracts instead of guessing.
  - The `/lowdefy-docs` page path prefix is now reserved in dev.

  **Discovery build artifacts (`@lowdefy/build`)**

  - Dev builds now write `plugins/availableTypes.json` (every installed type, used or not) and `plugins/connectionSchemas.json` + `plugins/requestSchemas.json` (collected from connection definitions).
  - Fixed custom/local plugin schemas being silently missing from all schema maps — plugin modules now also resolve from the server directory.

  **Docs content package (`@lowdefy/docs-content`)**

  - New package shipping the Lowdefy docs extracted as markdown with a manifest, generated from the docs app build (`pnpm docs:content`).

  **Block plugins**

  - Block packages now publish their `gallery.yaml`/`examples.yaml`/`tests.yaml` files in `dist/`, so the docs API can serve real examples.

- ae5f618: feat(server-dev): Send feedback annotations directly from the annotation panel.

  The separate review step is gone: "Copy for agent" now sends straight from the panel and always includes the annotation you are writing, "Add another" banks it and returns to picking, and banked annotations stay visible in a pending tray where they can be removed before sending. Enter triggers the send in both states.

- 6f87741: feat: Authenticate the dev server as a mock user for headless rendering and agent tools

  The dev server's headless renderer (used by the AI-agent screenshot and state-inspection tools) now authenticates, so auth-protected pages render instead of returning 404.

  - **New `lowdefy dev --mock-user [user]` flag** — start the development server authenticated as a mock user. Pass a JSON user object to set the identity and roles (e.g. `--mock-user '{"sub":"dev","roles":["admin"]}'`), or use the bare flag for a default user. This drives the same `auth.dev.mockUser` mechanism from the command line.
  - **Headless renderer authenticates** — the docs/MCP headless browser now carries an authenticated session, so `lowdefy_screenshot_page` and headless state inspection work on pages with `auth.public: false`. The developer's real browser session is unaffected. To render role-gated pages, configure `auth.dev.mockUser` (or `--mock-user`) with matching roles.

- e0a06a2: feat: Dynamic page content — server-resolved blocks at page load.

  Pages can now include a `Dynamic` block whose content is resolved on the server at page load by an api endpoint routine. The routine returns block config; the server builds and validates it, splices it into the page, and the client renders the result like any other page.

  **`Dynamic` block (`@lowdefy/blocks-basic`)**

  - New container block configured with `properties.endpointId`, static `params`, an optional `fallback` slot rendered when resolution fails, and `required: true` to fail the page load instead.
  - `properties.types` declares extra block, action and operator types the endpoint may return, so build includes them in the client bundle.

  **Server resolution (`@lowdefy/api`, `@lowdefy/server`, `@lowdefy/server-dev`)**

  - The endpoint is called in-process during page get with a payload of `{ params, pageId, blockId, urlQuery }` — the page request's query string is forwarded on both initial loads and SPA navigations.
  - Returned blocks are validated before reaching the client: types must be in the client bundle, block properties are checked against plugin schemas (operator values are exempt), and `Request` and `CallAPI` action references are verified.
  - Nested `Dynamic` blocks resolve recursively up to 5 levels; endpoint auth is enforced per resolution.
  - Client-evaluated operators in returned config are escaped with one extra underscore (`__state` → `_state`), the same deferral convention as `_function` args — a plain `_state` evaluates against the routine's own state.

  **Build (`@lowdefy/build`)**

  - Validates `Dynamic` block config, flags dynamic pages in the page artifact, and bundles declared types.
  - New `@lowdefy/build/dynamic` entry builds and validates runtime block config with the same pipeline as static pages.

  **Engine (`@lowdefy/engine`)**

  - Dynamic pages build a fresh context on every navigation, since the server may resolve different content per request.

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

- 7f49378: feat: Annotation helper — point, draw, copy, and paste feedback to your agent

  Press **Cmd+/** (macOS) / **Ctrl+/** (Windows/Linux) on any page of your running dev app: an overlay appears where you hover-highlight blocks, click to select, draw rectangles/arrows/freehand, comment, and batch several annotations. No browser extension — it's injected by the dev server.

  Hitting **Copy** puts an agent-readable feedback block on your clipboard, **each annotation enriched with the blockId and the exact yaml file and line that defines it**, plus drawn geometry and, by default, **an annotated PNG screenshot of the page with your drawings on it** (saved under `.lowdefy/annotations/`, path included in the block — untick "Include annotated screenshot" to skip). Paste it into whichever agent session you want. Press Enter to drive the primary action (save annotation, then copy).

  Also:

  - `lowdefy_screenshot_page` gains `clip` + `scrollX`/`scrollY` params to capture exactly an annotated region.
  - New reserved dev route prefix: `/lowdefy-feedback` (the overlay's enrichment endpoint).
  - The generated AGENTS.md and Claude Code skill (`lowdefy agent-setup`) teach agents to recognize pasted feedback blocks.

- a858f8f: feat: MCP server exposing API endpoints as tools.

  - New root `mcp` config block (`name`, `version`, `endpoints`) — listed `Api` endpoints are served as MCP tools at `POST /api/mcp` over streamable HTTP.
  - Endpoint `description` and `payloadSchema` become the tool description and inputSchema; both are required for exposed endpoints, and `InternalApi` endpoints cannot be exposed.
  - Tool listing and calls are authorized per request with the caller's session; the build always writes an `mcp.json` artifact (`configured: false` when no endpoints are listed).

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

- efd1967: feat: Add websockets — a first-class realtime primitive.

  Define channels under a new top-level `websockets:` key and subscribe pages to them with `subscriptions:` — live dashboards, notifications, and chat without polling or an external socket service. The same Lowdefy server that serves your pages pushes messages over a single multiplexed WebSocket connection, locally and on Vercel (native WebSocket support on Fluid compute). Authentication uses your existing session, with per-channel `auth.websockets` roles.

  **Channels (`websockets:`)**

  - Websocket types are plugins: `Channel` (client pub/sub relay) and `Interval` (timed ticks) ship in the new `@lowdefy/websockets-core` package; `MongoDBChangeStream` in `@lowdefy/connection-mongodb` pushes MongoDB change events to subscribed pages.
  - Channel `properties` are evaluated server-side per subscription — `_payload` and `_user` make channels user-specific. Subscribers with identical evaluated properties share one running source.

  **Page subscriptions (`subscriptions:`)**

  - Pages subscribe on mount and unsubscribe on navigation — no wiring needed.
  - React to messages with `onMessage`, `onSubscribe` and `onError` events, or read channel state anywhere with the new `_websocket` operator (`connected`, `messages`, `lastMessage`, `messageCount`, `error`).
  - Renders are throttled (`client.throttleRender`) and message history is bounded (`client.maxMessages`).

  **Actions**

  - New `Publish`, `Subscribe` and `Unsubscribe` actions in `@lowdefy/actions-core` — publish messages to a channel or control subscriptions dynamically.

  The client reconnects with backoff and resubscribes automatically, so serverless connection limits (e.g. Vercel function `maxDuration`) are invisible to users. See the new WebSockets section in the docs for a quick start.

### Patch Changes

- 082acec: chore: Bump `yaml` to 2.9.0, clearing vite's `yaml@^2.4.2` peer warning.
- 59190b5: Refresh dependencies and require Node.js 22 or newer.

  Updated a range of libraries across the project to current versions (including the MongoDB driver, the
  MQL/aggregation engine, and various build and CLI tooling) and set the minimum supported Node.js version
  to 22, matching what is tested in CI. Most changes are internal with no effect on your app. One small
  behaviour note: in `_mql` expressions, adding to a missing or null field now returns `null` (matching
  MongoDB) instead of `NaN`.

- da0c62c: chore: Update pino from 8.16.2 to 10.3.1.

  No behavior change — the log output format, levels, and configuration are unchanged. The pino 9 and 10 majors only drop support for Node.js versions below 20, and Lowdefy already requires Node.js 22 or newer.

- a2b0f93: fix(server-dev): a dev tab now holds one event-stream connection instead of two. The dev server runs on HTTP/1.1, where browsers allow six connections per host, and each open event stream keeps one for the life of the tab. With the config-reload stream and the inspector stream both open per tab, three tabs of the same app saturated the pool and the next request on any of them queued forever — the page sat on its loading skeleton with a request pending and no server error. The inspector now listens on the reload stream and reports page navigation with a small POST instead of reconnecting. The manager's proxy also now closes the upstream request when a browser tab disconnects, so closed tabs leave the inspectable-tab registry instead of lingering and shadowing live ones.
- 0407d43: feat(build): Deferred-content records — one registry for all module deferral.

  Module deferral (component bodies, menu links, var defaults, entry
  vars/connections) moves from fragile in-tree markers onto a build-level record
  registry with demand-driven, wait-graph-guarded resolution. Entry order no
  longer matters for mutually-embedding modules, cycle errors name the actual
  value chain (e.g. `a:consumerVars.x → b:vars.y.default → a:consumerVars.x`),
  and the entry state machine, `~deferredModuleRef`/`~deferredFrom` markers, and
  per-context resolve chains are deleted. A new `deferredRecords.json` build
  artifact carries record bodies for JIT; the dev server hydrates the registry
  from it.

  User-visible changes:

  - New config errors: `~deferred` is a reserved key; `_module.var` in manifest
    headers or component/menu ids errors (export names are module-static); `_var`
    inside an operator-generated `components:` section errors (var-free operator
    composition keeps working).
  - Module ref errors now list available component/menu ids and distinguish a
    missing export from an empty one.
  - Lazy semantics: a broken var default or a cyclic menu that nothing consumes
    no longer fails the build — errors surface at consumption.

  Also includes the buildRefs cleanups: single marker-preserving clone
  (`cloneWithMarkers`), no redundant clones or duplicate `lowdefy.yaml`
  re-resolution in the app pass, `validateModuleSecrets` walks instead of
  cloning, and a shared `expectTerminates` test guard.

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

- 6730996: feat: Provider-neutral file storage — upload and download files to S3-compatible providers, Google Cloud Storage, and Azure Blob Storage.

  **Generic file blocks (`@lowdefy/blocks-files`, new)**

  - New `Upload`, `UploadPhoto`, `UploadDragger`, and `Download` blocks that work with any storage provider. Upload blocks call an upload-policy request by id (`uploadPolicyRequestId`) and support both POST form uploads (S3, R2, MinIO, GCS) and PUT body uploads (Azure SAS), with upload progress on both.
  - `emitFileContent: true` reads the file in the browser and emits `{ name, size, type, content }` (base64) as the block value and `onChange` event, for storing files through an API endpoint routine with a server-side write request.

  **S3-compatible providers (`@lowdefy/plugin-aws`)**

  - `AwsS3Bucket` connections accept `endpoint` and `forcePathStyle`, unlocking Cloudflare R2, MinIO, DigitalOcean Spaces, Backblaze B2, and Wasabi with a one-line config change.
  - `AwsS3PresignedGetObject` returns a stable, non-expiring public URL when the request sets `public: true`; the connection-level `publicUrlBase` overrides the constructed URL for CDN domains.
  - New `AwsS3PutObject` write and `AwsS3GetObject` read requests store and read base64 object content from endpoint routines or page requests, so routines can process file content in steps.
  - The `S3UploadButton`, `S3UploadPhoto`, `S3UploadDragger`, and `S3Download` blocks are now deprecated aliases of the generic blocks — existing apps keep working unchanged.

  **Google Cloud Storage (`@lowdefy/plugin-gcp`, new)**

  - `GoogleCloudStorageBucket` connection with `GcsSignedPostPolicy`, `GcsSignedGetUrl`, `GcsGetObject`, and `GcsPutObject` requests.

  **Azure Blob Storage (`@lowdefy/plugin-azure`, new)**

  - `AzureBlobContainer` connection with `AzureBlobUploadSas`, `AzureBlobDownloadSas`, `AzureBlobGet`, and `AzureBlobPut` requests.

  **Editor and chat uploads (`@lowdefy/blocks-tiptap`, `@lowdefy/blocks-antd-x`)**

  - Tiptap editors and AgentChat attachments now upload through the shared provider-neutral flow. New `uploadPolicyRequestId` and `downloadPolicyRequestId` properties replace `s3PostPolicyRequestId` (kept as a deprecated alias). Inline image and attachment URLs resolve through the download request when configured.

  **Servers (`@lowdefy/server`, `@lowdefy/server-dev`)**

  - `/api/endpoints/*` request bodies are capped at 10 MiB (matching the agent route), bounding base64 file payloads sent via `CallAPI`.

  **Codemod (`@lowdefy/codemods`)**

  - Optional `s3-blocks-to-file-blocks` codemod renames the deprecated S3\* blocks and `s3PostPolicyRequestId`/`s3GetPolicyRequestId` properties to the provider-neutral names via `lowdefy upgrade`.

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

- 54882e6: fix: Annotated feedback screenshots now capture the developer's actual tab

  Annotation screenshots (Cmd/Ctrl+/ Feedback Mode) previously re-rendered the page in a headless browser, which could diverge from what the developer was looking at — wrong theme, unsettled loading skeletons, missing client-only state. The overlay now rasterizes the live tab itself (theme, loaded data, exact pixels) with the annotations drawn on, and posts the PNG to the dev server to save under `.lowdefy/annotations/`. The headless render remains as a fallback when the in-tab capture is unavailable.

- ae5f618: fix(server-dev): Annotated screenshots render responsive images correctly.

  Tab captures embedded each image's fallback `src` instead of the variant the browser was displaying, warping `<picture>`/`srcset` images — most visibly the header logo squashed into its mobile mark. Captures now pin every responsive image to the displayed variant and restore the page afterwards.

- ae5f618: fix(server-dev): `/lowdefy-docs/find/{id}?pageId=` only matches config on that page.

  Built pages share identical key paths for same-named block ids, so a page-scoped find could return locations from other pages. Matches are now resolved against the requested page's own config tree, and the no-match message suggests retrying without `pageId` to scan everything. Option/Alt+click open-in-editor no longer sends an empty `pageId`.

- 806e1af: fix: Serve the dev mock session to the browser client

  With a mock user (`auth.dev.mockUser` / `LOWDEFY_DEV_USER` / `lowdefy dev --mock-user`) or a headless renderer session, server-side requests authenticated but the browser client's session stayed empty — `GET /api/auth/session` was answered by Auth.js alone, which knows nothing about dev sessions. Client-side `_user` values (roles, custom userFields like tenant claims) were missing, breaking auth-driven routing; apps could remount-loop between pages whose conditions read `_user`.

  Dev sessions are now built in one place (`getDevSession`) and served from it to both the server request context and the browser session endpoint, so the two can never diverge. The dev user also runs through the identical Auth.js session callback a real sign-in uses — userFields mapping, custom session-callback plugins, roles validation, `hashed_id` — so mock and headless sessions behave exactly like a production authenticated user.

- 49ad033: fix(server-dev): Annotations now work over open modals, plus an annotate hint on dev server startup.

  - The annotation overlay is now rendered into the document body, so its comment box stays clickable and typeable even when a modal is open on the page.
  - On startup the dev server now prints a notice box for coding agents: the docs & MCP endpoint URL with the `lowdefy agent-setup` command to connect an agent, and the Cmd/Ctrl+/ annotation shortcut.
  - `lowdefy agent-setup` now enables the `lowdefy-docs` MCP server in the committed `.claude/settings.json`, so everyone on the project has it approved without a prompt.

- 021dfa8: fix: Resolve list item block ids to their `$` config source

  Blocks inside lists render with array indices applied to their ids (`my_list.0.name`) while config — and the build keyMap — hold the `$` placeholder form (`my_list.$.name`). Config lookups for these ids missed, so Option/Alt+click open-in-editor, annotation location resolution, and the `lowdefy_find_config` tool fell back to the nearest configured ancestor — usually the list block itself. `findConfig` now folds runtime indices back to `$` when the exact id misses, so list content resolves to the yaml that defines the item block.

- 87ac211: fix(server-dev): Build the page JIT before serving a request. Page artifacts are built on `GET /api/page/*` and dropped on every page invalidation, so a client that already held the page config could fire a request during a rebuild and get `Request "x" does not exist.` — a fresh sign-in landing on a protected gate page hit this every time a config file was saved. `POST /api/request/*` now runs the same idempotent `buildPageIfNeeded` the page route runs.
- 36656ce: fix(server-dev): Keep the public port bound across dev-server restarts.

  The manager now owns the public port with a lightweight proxy and runs the
  Vite child on an internal loopback port. Previously every child restart (js
  module change, .env change, plugin install) dropped the TCP listener for the
  whole Vite boot, so long-lived clients — MCP coding agents on
  /lowdefy-docs/mcp, the reload SSE stream, HMR websockets — hit ECONNREFUSED;
  MCP clients in particular latch the failure and demand a manual reconnect
  (sometimes surfacing a spurious authentication prompt). Requests and websocket
  upgrades that arrive while the child is down now wait for it to come back (up
  to 30s) instead of failing, so a restart reads as one slow request.

- Updated dependencies [11662bc]
- Updated dependencies [0201358]
- Updated dependencies [082acec]
- Updated dependencies [59190b5]
- Updated dependencies [da0c62c]
- Updated dependencies [2da4907]
- Updated dependencies [a647873]
- Updated dependencies [e7a9270]
- Updated dependencies [c188656]
- Updated dependencies [b496a77]
- Updated dependencies [60401aa]
- Updated dependencies [37c8c14]
- Updated dependencies [ef707bd]
- Updated dependencies [a6daf0b]
- Updated dependencies [0dccf40]
- Updated dependencies [7ce6e36]
- Updated dependencies [46029df]
- Updated dependencies [0407d43]
- Updated dependencies [28cb944]
- Updated dependencies [082acec]
- Updated dependencies [e0a06a2]
- Updated dependencies [58ae85e]
- Updated dependencies [742a900]
- Updated dependencies [51c3008]
- Updated dependencies [6730996]
- Updated dependencies [596212a]
- Updated dependencies [a858f8f]
- Updated dependencies [c97b1da]
- Updated dependencies [206d947]
- Updated dependencies [660bbfc]
- Updated dependencies [8a82fb0]
- Updated dependencies [efd1967]
- Updated dependencies [1cc1521]
- Updated dependencies [6d38790]
- Updated dependencies [0f9487d]
- Updated dependencies [8398345]
- Updated dependencies [ae5f618]
- Updated dependencies [01d7552]
- Updated dependencies [01d7552]
- Updated dependencies [ae5f618]
- Updated dependencies [7746ce2]
- Updated dependencies [629837d]
- Updated dependencies [6446ae6]
- Updated dependencies [47ba6df]
- Updated dependencies [c9bea1c]
- Updated dependencies [ae5f618]
- Updated dependencies [16fdeb8]
- Updated dependencies [fb80e0a]
- Updated dependencies [0e71ebd]
- Updated dependencies [c2e0823]
- Updated dependencies [704cf4b]
- Updated dependencies [6d7cd8e]
- Updated dependencies [53a36ed]
  - @lowdefy/blocks-antd-x@6.0.0
  - @lowdefy/build@6.0.0
  - @lowdefy/operators-yaml@6.0.0
  - @lowdefy/operators-mql@6.0.0
  - @lowdefy/logger@6.0.0
  - @lowdefy/docs-content@6.0.0
  - @lowdefy/blocks-aggrid@6.0.0
  - @lowdefy/api@6.0.0
  - @lowdefy/client@6.0.0
  - @lowdefy/operators-js@6.0.0
  - @lowdefy/plugin-next-auth@6.0.0
  - @lowdefy/errors@6.0.0
  - @lowdefy/blocks-antd@6.0.0
  - @lowdefy/engine@6.0.0
  - @lowdefy/blocks-basic@6.0.0
  - @lowdefy/blocks-echarts@6.0.0
  - @lowdefy/blocks-loaders@6.0.0
  - @lowdefy/blocks-markdown@6.0.0
  - @lowdefy/blocks-tiptap@6.0.0
  - @lowdefy/node-utils@6.0.0
  - @lowdefy/actions-core@6.0.0
  - @lowdefy/websockets-core@6.0.0
  - @lowdefy/helpers@6.0.0
  - @lowdefy/layout@6.0.0
  - @lowdefy/operators-change-case@6.0.0
  - @lowdefy/operators-dayjs@6.0.0
  - @lowdefy/operators-diff@6.0.0
  - @lowdefy/operators-nunjucks@6.0.0
  - @lowdefy/operators-uuid@6.0.0
  - @lowdefy/block-utils@6.0.0
  - @lowdefy/connection-axios-http@6.0.0

## 5.6.0

### Patch Changes

- 8306262: feat(blocks-aggrid): Add `AgGridLowdefy`, upgrade to AG Grid v33, and theme every grid through the Theming API.

  **Two new blocks.** `AgGridLowdefy` (display) and `AgGridLowdefyInput` (input) are grids themed from the app's antd design tokens — primary colour, surfaces, fonts and radius — so they look like they belong in a Lowdefy app and follow light/dark mode automatically, with no configuration and no separate dark block. They take a `size` property (`small | middle | large`, default `middle`) mirroring antd Table's densities, which sets row and header height to 36 / 44 / 54 pixels. Everything else — properties, events, methods, cell renderers — is identical to the existing grids.

  To adopt, change `type: AgGridBalham` to `type: AgGridLowdefy` (or `type: AgGridInputBalham` to `type: AgGridLowdefyInput`). Every property carries over unchanged and the grid will deliberately look different afterwards. It is a visual opt-in, so there is no codemod.

  Note that `size` loses to an explicit height: `rowHeight` and `headerHeight` are AG Grid grid options, and a grid option beats the theme parameter `size` sets. Setting `size: large` alongside `rowHeight: 30` gives 30 pixel rows under a 54 pixel header — use one or the other.

  **AG Grid v33.** The package moves from `@ag-grid-community/*@32` to `ag-grid-community` + `ag-grid-react@33.3.2`, with `AllCommunityModule` registered explicitly. The Theming API is v33's default and class-based file themes are gone, so no block imports AG Grid CSS any more.

  **The Balham, Alpine and Material blocks change appearance slightly.** They are kept indefinitely with the same API and the same names, but they now render AG Grid's prebuilt Theming API equivalents of those themes, with the antd colour mapping carried across as theme parameters. No config change is needed. What shifts:

  - Spacing and header weight move a little — Balham rows go 28px to 29px, cell horizontal padding tightens on Balham and Alpine, the wrapper corner radius now comes from each theme (Balham 2px, Alpine 3px, Material 0) rather than a uniform 6px, and Balham's header weight goes from 600 to bold. Icons come from each theme's own SVG set, so glyph shapes differ from the old icon font.
  - Row height now tracks the app's antd font size on Balham and Material, because v33 derives it from the data font size. It was font-size-independent before. The height only moves once the font size passes the theme's icon size (16px on Balham, 18px on Material), so at antd's default 14px nothing changes — you will see it at 18px or 20px. Alpine is unaffected at any font size.
  - Four colours are re-pointed: row hover is a neutral fill rather than a primary tint, borders are lighter, the checkbox outline tone changes, and popup shadows are softer.
  - Zebra striping, fonts and overall row density are preserved.

  **A new `themeParams` property, on all eight blocks.** `themeParams` takes AG Grid Theming API parameter names and merges them onto the block's theme — the recommended way to retint a single grid:

  ```yaml
  - id: my_table
    type: AgGridLowdefy
    properties:
      themeParams:
        headerBackgroundColor: '#1a1a2e'
        headerTextColor: '#e0e0ff'
        borderColor: var(--ant-color-primary)
  ```

  Values are CSS strings and may reference antd tokens. Neither Lowdefy nor AG Grid validates parameter names, so a misspelled key is a silent no-op — check spelling against AG Grid's theming parameter reference.

  Overriding `--ag-*` variables through a block's `style` — the documented `custom_theme` technique — **still works**; the Theming API honours an ancestor's declaration by design. The one caveat is that v33 renamed or folded away a number of the v32 `--ag-*` variables, and an override naming one of those is now a silent no-op. `--ag-header-foreground-color`, which appears in the documented example, is the case to watch: it is now `headerTextColor` (`--ag-header-text-color`). The AgGrid docs page carries the mapping table.

  **One deprecation warning existing apps may see.** `rowSelection: multiple` / `single` is deprecated in v33 in favour of `rowSelection: { mode: multiRow }` / `{ mode: singleRow }`. The string form still works. If you migrate it, three things must move together:

  - **Set `enableClickSelection: true`.** The string form defaults click-to-select on; the object form defaults it **off**. A bare `{ mode: singleRow }` silently stops clicking a row from selecting it, and `onRowSelected` / `onSelectionChanged` stop firing. The object form is not equivalent without this.
  - **Move the colDef flags in the same edit.** `checkboxSelection` and `headerCheckboxSelection` on a column become `rowSelection.checkboxes` and `rowSelection.headerCheckbox`. v33 only supports `headerCheckboxSelection` alongside the _string_ form, so migrating one without the other breaks the header checkbox.
  - **Six sibling options are read only in the string branch and are silently lost on migration:** `suppressRowClickSelection`, `suppressRowDeselection`, `rowMultiSelectWithClick`, `groupSelectsChildren`, `groupSelectsFiltered` and `isRowSelectable`. All six are deprecated in favour of `rowSelection.*` — move any you use across.

  **Dark-mode apps now get dark browser chrome throughout (`@lowdefy/client`, `@lowdefy/server`, `@lowdefy/server-dev`, `@lowdefy/server-e2e`).** `color-scheme` is now set on `<html>` from the resolved dark-mode state — in the client's dark-mode effect and in each server's pre-hydration inline script, so first paint matches too. Native scrollbars, `<select>` dropdowns, date pickers and autofill backgrounds render dark in a dark app, inside grids and everywhere else. This is an app-wide behaviour change, well beyond AgGrid, and it is what lets the grid's own scrollbars follow dark mode. Apps pinned to light with `theme.darkMode: light` are unaffected, including on a dark OS. Apps that leave `theme.darkMode` unset get the default, `system`, so on a dark OS they resolve to dark and do pick up `color-scheme: dark` — set `theme.darkMode: light` if that is not wanted.

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

- 79bbd84: fix(api): Redact server internals from every client-bound error, not just the 500 response.

  Errors sent to a browser or an API caller now have `received` and `stack` stripped at
  **every** level of the error, and a non-`Error` `cause` dropped unless the error is a
  `UserError`. Two live leaks are closed:

  - The 500 handlers stripped fields from the outermost error only, so `cause.stack` — and
    the absolute server paths in its frames — reached production browsers.
  - An endpoint result body (`callEndpoint` and the agent route) and a request response body
    (`callRequest`) were not redacted at all. They carried `received`, which on the request
    path holds the **evaluated** request properties, so a `_secret` resolved into a request
    header crossed the wire at HTTP 200.

  `source` is now guaranteed config-relative (`pages/home.yaml:5`, never `/var/task/...`),
  and `configKey` is kept again: the browser deduplicates errors on `message:configKey`, so
  stripping it collapsed two different errors that happened to share a message and silently
  dropped the second.

  **Breaking for app config that reads `error.received`.** Server-originated errors no longer
  carry it, so `_actions` and `_request_details` expose `received` as `undefined`, and the
  browser console no longer prints the `Received: <json>` line for them. This is deliberate —
  the field can contain your own resolved secrets. The error `message` is unchanged, and
  server logs still record `received` and `stack` in full in every environment, including dev.

  Also fixes internal errors being logged twice. A `LowdefyInternalError` never gets a
  `source`, and the browser used `source` to decide whether the server had already logged an
  error, so it POSTed every internal error back to `/api/client-error` for a second log. The
  browser now reads the `handled` flag the server sets when it logs.

- b09ad62: fix: Allow dependency build scripts via pnpm-workspace.yaml so installs succeed on pnpm 11.

  `lowdefy dev` and `lowdefy build` failed with `Dependency installation failed.` on pnpm 11 (`ERR_PNPM_IGNORED_BUILDS`), because dependency build scripts (sharp, better-sqlite3) were only allowed via the `pnpm.onlyBuiltDependencies` field in the server package.json — a field pnpm no longer reads (and strips at publish), while pnpm 11 turns ignored build scripts into a hard install error. The CLI now writes a `pnpm-workspace.yaml` with the build allowlist into the server directory before installing, covering pnpm 9 (`packages`), pnpm 10 (`onlyBuiltDependencies`), and pnpm 10.29+/11 (`allowBuilds`). An existing file is never overwritten, so users can extend the allowlist for their own plugins' native dependencies. When the app lives inside a pnpm workspace (e.g. `apps/*/.lowdefy/*` in the workspace globs, plugins pinned as `workspace:*`), the CLI writes nothing — the server installs as part of the parent workspace, where isolating it would break `workspace:*` plugin resolution and the root's `overrides`/`packageExtensions`, and build allowlists belong in the workspace root's `pnpm-workspace.yaml`. `lowdefy-e2e init` used the same dead mechanism for mongodb-memory-server and now writes the same allowlist to `pnpm-workspace.yaml` (the workspace root's if the app is inside a workspace, otherwise a new file in the app directory). The dead `pnpm` fields were removed from the server packages. Fixes #2191.

- Updated dependencies [3d59f5f]
- Updated dependencies [3d59f5f]
- Updated dependencies [5b590c7]
- Updated dependencies [8306262]
- Updated dependencies [0ec9154]
- Updated dependencies [3ead269]
- Updated dependencies [9399e4e]
- Updated dependencies [9e19a21]
- Updated dependencies [7d97d03]
- Updated dependencies [79bbd84]
- Updated dependencies [508708d]
- Updated dependencies [842d71c]
- Updated dependencies [291b4cf]
- Updated dependencies [508708d]
- Updated dependencies [bb02f06]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [4ae3fb9]
- Updated dependencies [3ead269]
- Updated dependencies [5b4c305]
  - @lowdefy/blocks-antd-x@5.6.0
  - @lowdefy/blocks-aggrid@5.6.0
  - @lowdefy/client@5.6.0
  - @lowdefy/engine@5.6.0
  - @lowdefy/helpers@5.6.0
  - @lowdefy/api@5.6.0
  - @lowdefy/build@5.6.0
  - @lowdefy/node-utils@5.6.0
  - @lowdefy/blocks-antd@5.6.0
  - @lowdefy/layout@5.6.0
  - @lowdefy/operators-js@5.6.0
  - @lowdefy/logger@5.6.0
  - @lowdefy/connection-axios-http@5.6.0
  - @lowdefy/blocks-markdown@5.6.0
  - @lowdefy/blocks-tiptap@5.6.0
  - @lowdefy/actions-core@5.6.0
  - @lowdefy/blocks-basic@5.6.0
  - @lowdefy/blocks-loaders@5.6.0
  - @lowdefy/operators-change-case@5.6.0
  - @lowdefy/operators-dayjs@5.6.0
  - @lowdefy/operators-diff@5.6.0
  - @lowdefy/operators-mql@5.6.0
  - @lowdefy/operators-nunjucks@5.6.0
  - @lowdefy/operators-uuid@5.6.0
  - @lowdefy/operators-yaml@5.6.0
  - @lowdefy/block-utils@5.6.0
  - @lowdefy/plugin-next-auth@5.6.0
  - @lowdefy/blocks-echarts@5.6.0
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- Updated dependencies [33e062f]
- Updated dependencies [59cae71]
  - @lowdefy/build@5.5.1
  - @lowdefy/blocks-antd@5.5.1
  - @lowdefy/engine@5.5.1
  - @lowdefy/blocks-aggrid@5.5.1
  - @lowdefy/blocks-tiptap@5.5.1
  - @lowdefy/api@5.5.1
  - @lowdefy/client@5.5.1
  - @lowdefy/layout@5.5.1
  - @lowdefy/actions-core@5.5.1
  - @lowdefy/blocks-antd-x@5.5.1
  - @lowdefy/blocks-basic@5.5.1
  - @lowdefy/blocks-echarts@5.5.1
  - @lowdefy/blocks-loaders@5.5.1
  - @lowdefy/blocks-markdown@5.5.1
  - @lowdefy/connection-axios-http@5.5.1
  - @lowdefy/operators-change-case@5.5.1
  - @lowdefy/operators-dayjs@5.5.1
  - @lowdefy/operators-diff@5.5.1
  - @lowdefy/operators-js@5.5.1
  - @lowdefy/operators-mql@5.5.1
  - @lowdefy/operators-nunjucks@5.5.1
  - @lowdefy/operators-uuid@5.5.1
  - @lowdefy/operators-yaml@5.5.1
  - @lowdefy/plugin-next-auth@5.5.1
  - @lowdefy/block-utils@5.5.1
  - @lowdefy/errors@5.5.1
  - @lowdefy/helpers@5.5.1
  - @lowdefy/logger@5.5.1
  - @lowdefy/node-utils@5.5.1

## 5.5.0

### Patch Changes

- Updated dependencies [c5cc340]
- Updated dependencies [6dcdb6a]
- Updated dependencies [b368e15]
- Updated dependencies [f88fe33]
- Updated dependencies [7ab09d6]
  - @lowdefy/blocks-aggrid@5.5.0
  - @lowdefy/blocks-tiptap@5.5.0
  - @lowdefy/blocks-antd-x@5.5.0
  - @lowdefy/build@5.5.0
  - @lowdefy/api@5.5.0
  - @lowdefy/client@5.5.0
  - @lowdefy/engine@5.5.0
  - @lowdefy/layout@5.5.0
  - @lowdefy/actions-core@5.5.0
  - @lowdefy/blocks-antd@5.5.0
  - @lowdefy/blocks-basic@5.5.0
  - @lowdefy/blocks-echarts@5.5.0
  - @lowdefy/blocks-loaders@5.5.0
  - @lowdefy/blocks-markdown@5.5.0
  - @lowdefy/connection-axios-http@5.5.0
  - @lowdefy/operators-change-case@5.5.0
  - @lowdefy/operators-dayjs@5.5.0
  - @lowdefy/operators-diff@5.5.0
  - @lowdefy/operators-js@5.5.0
  - @lowdefy/operators-mql@5.5.0
  - @lowdefy/operators-nunjucks@5.5.0
  - @lowdefy/operators-uuid@5.5.0
  - @lowdefy/operators-yaml@5.5.0
  - @lowdefy/plugin-next-auth@5.5.0
  - @lowdefy/block-utils@5.5.0
  - @lowdefy/errors@5.5.0
  - @lowdefy/helpers@5.5.0
  - @lowdefy/logger@5.5.0
  - @lowdefy/node-utils@5.5.0

## 5.4.0

### Minor Changes

- f11addd: feat: Extend i18n coverage to Lowdefy agents.

  Builds on the i18n / locale support from
  `feat-i18n-locale-support.md`. End-user-visible strings in the agent
  runtime and the `AgentChat` block now localize automatically when
  `config.i18n` is configured.

  **Agent runtime errors.** HTTP 4xx/5xx responses from the agent
  endpoint (`Only POST requests are supported.`, `Invalid agent path`,
  `Agent "X" does not exist.`, `Agent type "Y" can not be found.`,
  `Endpoint execution failed`, etc.) translate per request via the
  `Accept-Language` header against `agent.runtime.*` builtin keys.

  **AgentChat block UI.** Framework-rendered strings in the chat UI go
  through `methods.translate` against new `agent.*` builtin keys:

  - `agent.sender.placeholder` — `'Type a message...'`
  - `agent.toolApproval.{approve,reject}` — `'Approve'` / `'Reject'`
  - `agent.message.{copy,feedback,regenerate,delete}` — message actions
  - `agent.toolResult.{completed,completedNoData,empty,emptyList,showMore,showLess}` — tool result captions

  Override per locale via `config.i18n.messages.{locale}` — same
  mechanism as any other built-in message.

  **antd X locale wiring.** The app shell now uses
  `@ant-design/x@2.7.x`'s `XProvider` at the root (drop-in superset of
  antd's `ConfigProvider`) with a merged antd + antd-X locale pack.
  antd X ships only `en_US` and `zh_CN` packs; other locales fall back
  to `en_US` for X-native strings (`'New chat'`, `'Stop loading'`,
  `'Like'`/`'Dislike'`, bubble edit `'OK'`/`'Cancel'`). Apps can
  override these in unsupported locales via the new `agent.antdx.*`
  reference keys.

  **Plugin-author surface.** Agent hook endpoints (`onStart`,
  `onStepStart`, `onToolCallStart`, `onToolCallFinish`, `onStepFinish`,
  `onFinish`) now receive `locale: <activeCode>` in their payload, so
  hook routines can branch on the user's locale.

  **System prompt translation.** `agent.properties.instructions` passes
  through the operator parser at request time — `_t:` works there for
  locale-aware system prompts.

  ```yaml
  agents:
    - id: assistant
      type: AISDKAgent
      connectionId: anthropic
      properties:
        agent:
          model: claude-sonnet-4
          instructions:
            _t: agent.systemPrompt
  ```

  **What stays English** (explicit choices):

  - Built-in tool descriptions used in the model prompt (English-trained
    models perform best with English tool descriptions).
  - Build-time agent validation errors (developer diagnostics).
  - Console warnings (ops diagnostics).
  - The `[File truncated — showing first NKB...]` notice in the
    `read-file` built-in tool (model-facing).
  - Model-streamed natural-language output (owned by the model).

- 0108f38: feat: First-class i18n / locale support for Lowdefy apps.

  Apps can now declare supported locales and message catalogs under
  `config.i18n`, switch language at runtime, and translate their own
  strings with ICU MessageFormat. Ant Design's component strings (date
  pickers, modal Ok/Cancel, pagination, form validation messages),
  dayjs date formatting, and the engine's built-in framework strings
  (loading toasts, validation summaries, popup blocker warnings, error
  page) all localize automatically once `config.i18n` is set.

  ```yaml
  config:
    i18n:
      defaultLocale: en-US
      locales:
        - { code: en-US, label: English, antd: en_US, dayjs: en }
        - { code: de-DE, label: Deutsch, antd: de_DE, dayjs: de }
      messages:
        en-US: { greeting: 'Hello, {name}!' }
        de-DE: { greeting: 'Hallo, {name}!' }
  ```

  **New schema** — `config.i18n` with `defaultLocale`, `locales[]`, and
  `messages`. Validated at build time; only declared locales are bundled
  (antd and dayjs locale imports are codegen'd, no ~150KB unused). The
  missing-key fallback is always `en-US`, so plugin and module authors
  should ship `en-US` translations as a baseline.

  **New operators**

  - [`_t`](/_t) — translate operator with ICU MessageFormat. Resolution
    order: active locale → fallback locale → built-in framework message
    → key.

    ```yaml
    _t:
      key: cart.items
      values: { count: { _state: itemCount } }
    ```

  - [`_locale`](/_locale) — read `active` / `default` / `fallback`
    (always `'en-US'`) / `supported` locale state. Use with `Selector`
    to build a language picker.

  **New action** — [`SetLocale`](/SetLocale) sets the user's preferred
  locale (persisted to `localStorage`). Pass `'auto'` to clear the
  preference and fall back to the browser language or default.

  **Built-in framework strings.** Engine and client strings (`'Loading'`,
  `'Success'`, `'This field is required'`, validation summaries, popup
  blocker, error page) live in a built-in catalog and surface as English
  by default. Authors override per-locale by adding the same key to
  `config.i18n.messages`:

  ```yaml
  messages:
    de-DE:
      engine.action.loading: 'Laden'
      engine.validation.fieldRequired: 'Pflichtfeld'
  ```

  See the [Internationalization concept page](/i18n) for the full list
  of overridable keys.

  **Ant Design block cleanup.** `Modal`/`ConfirmModal` `okText`/`cancelText`
  and date picker placeholders (`DateSelector`, `DateRangeSelector`,
  `DateTimeSelector`, `MonthSelector`, `WeekSelector`) no longer hardcode
  English defaults — they fall through to antd's `ConfigProvider locale`,
  so a German app gets `'OK'` / `'Abbrechen'` / `'Datum auswählen'`
  without per-block configuration. The antd `ConfigProvider` block
  itself now accepts a `locale` prop for subtree overrides.

  **Server-side translation.** API requests resolve the user's active
  locale from the `Accept-Language` header and thread it into the server
  operator parser, so `_t` works the same in server-side actions and
  requests as on the client.

  **Translation engine.** A new `translate()` helper in `@lowdefy/helpers`
  backs both the `_t` operator and the engine/client adapter (installed
  on `lowdefy._internal.translate`). One source of truth for the lookup
  chain; no duplication. Adds `intl-messageformat` as a foundational dep.

  **Plugin-author surface.** Action and block plugins receive
  `methods.translate(key, values)` and `methods.getLocale()` for runtime
  translation in their JS code. Plugin packages can ship default
  messages via a `./messages` export — the build merges them into the
  app's i18n catalog (user app messages > plugin messages > framework
  builtins > key).

  **DatePicker and NumberInput auto-localization.** Date selector blocks
  (`DateSelector`, `DateRangeSelector`, `DateTimeSelector`,
  `MonthSelector`) and `NumberInput` derive their default `format` /
  `decimalSeparator` from the active locale via `Intl.DateTimeFormat` /
  `Intl.NumberFormat`. A German user sees `DD.MM.YYYY` and `1234,56`
  automatically; an en-US user sees `MM/DD/YYYY` and `1234.56`.

### Patch Changes

- d1fb1d7: feat: Plugin-driven `serverExternalPackages` for Next.js.

  Plugins can now declare which of their dependencies need to be passed
  through to Next.js's `serverExternalPackages` config — used for CJS
  packages whose runtime `require()` chains Turbopack can't resolve
  through pnpm's isolated symlink layout (e.g. `turndown` →
  `@mixmark-io/domino`, `@aws-sdk/client-s3` → `fast-xml-parser` →
  `strnum`).

  Declare in the plugin's `package.json`:

  ```json
  {
    "lowdefy": {
      "serverExternalPackages": ["turndown"]
    }
  }
  ```

  Build aggregates declarations from every plugin the app actually uses
  (across blocks, connections, operators, actions, agents, auth, icons,
  requests) and writes a per-app `serverExternalPackages.json` artifact,
  read by `server`, `server-dev`, and `server-e2e` Next.js configs.

  Replaces a hardcoded list in the three server configs. Apps not using
  `blocks-tiptap` or `plugin-aws` no longer carry their externals.

  Initial declarations:

  - `@lowdefy/blocks-tiptap` → `turndown`
  - `@lowdefy/plugin-aws` → `@aws-sdk/client-s3`

- dc1d13a: fix(server-dev): Stop false "non-existent endpoint" warnings for CallAPI actions in dev.

  Under `lowdefy dev`, every `CallAPI` action logged a `ConfigWarning` that its endpoint did not exist, even when the endpoint was correctly defined under `api:` and worked at runtime. A full `lowdefy build` was unaffected.

  The JIT page builder validates CallAPI references against `context.components.api`, but the dev server's build context (`getBuildContext`) is rebuilt from disk artifacts and never restored the api endpoints, so the endpoint set was always empty and every reference was flagged. The dev context now hydrates the endpoints from the persisted `build/api/<endpointId>.json` artifacts (written by the skeleton build), so the non-existent-endpoint and InternalApi-not-client-callable checks behave the same in dev as in a full build.

  Module endpoints are written to nested paths (`build/api/<moduleId>/<endpointId>.json`) because their scoped `endpointId` contains a `/`. The artifact reader now walks the api directory recursively so these endpoints are hydrated too; previously every module CallAPI was still flagged as referencing a non-existent endpoint.

- Updated dependencies [ff7ed66]
- Updated dependencies [5e498dd]
- Updated dependencies [60401aa]
- Updated dependencies [c2c3a7f]
- Updated dependencies [25225ab]
- Updated dependencies [2aaf365]
- Updated dependencies [ba1d3bd]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [5f00be7]
- Updated dependencies [1db0ef9]
- Updated dependencies [302e330]
- Updated dependencies [d1fb1d7]
- Updated dependencies [27659ef]
- Updated dependencies [4e189a0]
- Updated dependencies [0027a41]
- Updated dependencies [b182517]
- Updated dependencies [7c97d3b]
- Updated dependencies [27659ef]
- Updated dependencies [42db297]
- Updated dependencies [e324c72]
- Updated dependencies [b6e555f]
- Updated dependencies [f8a5d80]
- Updated dependencies [60c193c]
- Updated dependencies [86919df]
  - @lowdefy/blocks-antd-x@5.4.0
  - @lowdefy/api@5.4.0
  - @lowdefy/build@5.4.0
  - @lowdefy/client@5.4.0
  - @lowdefy/operators-js@5.4.0
  - @lowdefy/blocks-antd@5.4.0
  - @lowdefy/helpers@5.4.0
  - @lowdefy/actions-core@5.4.0
  - @lowdefy/block-utils@5.4.0
  - @lowdefy/engine@5.4.0
  - @lowdefy/errors@5.4.0
  - @lowdefy/blocks-tiptap@5.4.0
  - @lowdefy/connection-axios-http@5.4.0
  - @lowdefy/operators-change-case@5.4.0
  - @lowdefy/operators-dayjs@5.4.0
  - @lowdefy/operators-diff@5.4.0
  - @lowdefy/operators-mql@5.4.0
  - @lowdefy/operators-nunjucks@5.4.0
  - @lowdefy/operators-uuid@5.4.0
  - @lowdefy/operators-yaml@5.4.0
  - @lowdefy/layout@5.4.0
  - @lowdefy/blocks-aggrid@5.4.0
  - @lowdefy/blocks-basic@5.4.0
  - @lowdefy/blocks-loaders@5.4.0
  - @lowdefy/logger@5.4.0
  - @lowdefy/node-utils@5.4.0
  - @lowdefy/blocks-echarts@5.4.0
  - @lowdefy/blocks-markdown@5.4.0
  - @lowdefy/plugin-next-auth@5.4.0

## 5.3.0

### Minor Changes

- 6955341: feat: Add AI agent support with multi-provider chat and tool use

  **Agent Runtime (`@lowdefy/ai-utils`)**

  - `handleAgentChat` orchestrates the full agent lifecycle: tool merging, MCP client lifecycle, hook callbacks, and stream composition
  - `ToolLoopAgent` handles multi-turn tool calling, streaming responses, and artifact cleaning
  - `createAgentUIStreamResponse` converts agent output to a streaming HTTP response for the client
  - `buildAgentTools` merges endpoint tools, MCP tools, and sub-agent tools into AI SDK tool objects
  - `buildPrepareStep` enables dynamic tool phasing per step
  - `buildUpdatePageStateTool` provides a built-in tool for the agent to write to page state via the AgentChat block
  - File system agent tools: `listFiles`, `readFile`, `searchFiles`, `statFile`, `resolvePath` for sandboxed access to agent-scoped file directories
  - `pruneMessages` for context compaction
  - `experimental_repairToolCall` integration
  - Sub-agent support — agents can be exposed as tools to other agents
  - Reserved tool name collision detection (e.g. `update-page-state`)
  - Server-side hooks (`instructions`, `onStart`, `onStepStart`, `onToolCallStart`, `onToolCallFinish`, `onStepFinish`, `onFinish`) callable as Lowdefy endpoints
  - Provider-agnostic design using the Vercel AI SDK — supports reasoning/thinking display, `providerOptions` passthrough, and source citation streaming via `sendSources`
  - Strip `data:` URL prefix from file attachments before AI SDK processing

  **AgentChat Block (`@lowdefy/blocks-antd-x`)**

  - New `AgentChat` composite block built on Ant Design X with real-time streaming display
  - Sequential message part rendering with configurable reasoning/thinking display
  - Tool approval UI for endpoint and MCP tools marked `confirm: true`
  - File attachment support (configurable accept types and max size) with S3 upload integration
  - Drawer display mode with a `FloatButton` trigger for embedding chat on any page
  - Source citation rendering for `source-url` and `source-document` parts
  - Mermaid diagrams, LaTeX, and syntax-highlighted code blocks (with copy + language label) — toggled via `renderMermaid` and `codeHighlighter`
  - Copy, feedback, regenerate, and delete message actions
  - Suggestions and `Sender.Header` / `Sender.Switch` UI affordances
  - Configurable roles, avatars, and names per message role
  - Event bridging for agent lifecycle events (`onSuccess`, `onError`, `onFinish`, `onFeedback`)
  - `sharedState` two-way binding lets the agent read and write page state via the `update-page-state` tool

  **`AgentConversations` Block (`@lowdefy/blocks-antd-x`)**

  - New standalone conversations sidebar block, extracted from AgentChat for independent placement

  **Connection Plugins**

  - `@lowdefy/connection-anthropic`: Anthropic connection with `AnthropicAgent` resolver supporting Claude models
  - `@lowdefy/connection-openai`: OpenAI connection with `OpenAIAgent` resolver supporting GPT models
  - `@lowdefy/connection-google`: Google AI connection with `GeminiAgent` resolver, including `thinkingConfig` and `safetySettings` sugar props
  - `@lowdefy/connection-ai-gateway`: Vercel AI Gateway connection with `AIGatewayAgent` resolver for routing to multiple providers through a single endpoint

  **MCP Integration (`@lowdefy/connection-mcp`, `@lowdefy/ai-utils`, `@lowdefy/build`)**

  - New `Mcp` connection type for HTTP, SSE, and stdio transport config
  - Agents can reference MCP connections via `connectionId` or inline config with build-time validation
  - Runtime MCP client creation with automatic tool discovery, merging, and cleanup
  - Tool approval support via `confirm: true` on both endpoint tools and MCP sources

  **Build Pipeline (`@lowdefy/build`)**

  - `buildAgents` validates agent config (model, tools, sub-agents, MCP) and normalizes tool definitions
  - `writeAgents` writes agent artifacts for server consumption
  - Sub-agent circular reference detection
  - Tool object format with `confirm` support
  - MCP `connectionId` normalization (inline config vs reference)
  - Lazy module variable resolution for agent properties referenced from modules
  - Agent schema validation integrated into the build pipeline
  - `copyAgentFileSystems` emits an `agentFileSystems.json` manifest so the production server can include each agent's `fileSystem.basePath` directory in Next.js file tracing — agents that read files now work on Vercel and standalone (`output: 'standalone'`) deployments without manual `next.config.js` configuration

  **API (`@lowdefy/api`)**

  - Agent route handler (`callAgent`) for streaming agent responses
  - Endpoint tool execution context with operator evaluation
  - Sub-agent resolver methods for agents-as-tools
  - MCP `connectionId` resolution at request time
  - `getAgentConfig` and `getAgentResolver` helpers for runtime agent resolution

  **Servers (`@lowdefy/server`, `@lowdefy/server-dev`)**

  - Agent API route (`/api/agent/[...path]`) added to both production and development servers
  - `urlQuery` validation
  - 10 MB request body limit for file attachments
  - Server-side hooks for agent lifecycle callbacks (`instructions`, `onFinish`)

### Patch Changes

- Updated dependencies [6955341]
- Updated dependencies [99fe9b8]
- Updated dependencies [7f40746]
- Updated dependencies [e3a08cc]
- Updated dependencies [28e2913]
- Updated dependencies [54d30f7]
  - @lowdefy/blocks-antd-x@5.3.0
  - @lowdefy/api@5.3.0
  - @lowdefy/build@5.3.0
  - @lowdefy/blocks-aggrid@5.3.0
  - @lowdefy/blocks-markdown@5.3.0
  - @lowdefy/blocks-antd@5.3.0
  - @lowdefy/engine@5.3.0
  - @lowdefy/blocks-tiptap@5.3.0
  - @lowdefy/client@5.3.0
  - @lowdefy/layout@5.3.0
  - @lowdefy/actions-core@5.3.0
  - @lowdefy/blocks-basic@5.3.0
  - @lowdefy/blocks-echarts@5.3.0
  - @lowdefy/blocks-loaders@5.3.0
  - @lowdefy/connection-axios-http@5.3.0
  - @lowdefy/operators-change-case@5.3.0
  - @lowdefy/operators-dayjs@5.3.0
  - @lowdefy/operators-diff@5.3.0
  - @lowdefy/operators-js@5.3.0
  - @lowdefy/operators-mql@5.3.0
  - @lowdefy/operators-nunjucks@5.3.0
  - @lowdefy/operators-uuid@5.3.0
  - @lowdefy/operators-yaml@5.3.0
  - @lowdefy/plugin-next-auth@5.3.0
  - @lowdefy/block-utils@5.3.0
  - @lowdefy/errors@5.3.0
  - @lowdefy/helpers@5.3.0
  - @lowdefy/logger@5.3.0
  - @lowdefy/node-utils@5.3.0

## 5.2.0

### Minor Changes

- 0f38c9f: feat: First-class module system for reusable config packages

  Modules are reusable bundles of Lowdefy config — pages, connections, API endpoints, menus, and exposed components — hosted in GitHub repositories or local directories. Apps install modules in `lowdefy.yaml` and configure them through `vars`, replacing the copy-paste-between-projects pattern with a declarative dependency.

  **Module entries (`@lowdefy/build`)**

  - Apps declare entries in the `modules` array of `lowdefy.yaml` with `id`, `source`, and optional `vars`, `connections`, and `dependencies`.
  - The entry `id` namespaces the module's content and forms the URL prefix for its pages (e.g. `/team-users/users-list`).
  - Multi-instance: the same module source can be installed multiple times under different entry IDs, each with its own vars and namespace.
  - GitHub sources (`github:owner/repo[/path]@ref`) are fetched as tarballs and locally cached. Private repos use `GITHUB_TOKEN`, the `gh` CLI, or git credential helpers.
  - Local sources (`file:./relative/path`) resolve relative to the project root.

  **Module manifest (`module.lowdefy.yaml`)**

  - Declares the module's interface: `name`, `description`, `vars`, `connections`, `pages`, `api`, `components`, `menus`, `dependencies`, `exports`, `plugins`, and `secrets`.
  - `vars` declarations validate consumer values with `type`, `required`, `default`, and `description`. Consumer values override manifest defaults; omitted values fall back to the declared default.
  - `exports` declares the module's public interface — the IDs other modules and apps may reference. The build validates cross-module references against exports.
  - `plugins` declarations are validated against the app's installed plugins with semver compatibility checks.
  - `secrets` is an allowlist of secrets the module may access; undeclared `_secret` references fail the build. Remapped connections skip the module's secret references for that connection.

  **Module operators**

  - `_module.var` — read manifest-validated vars, including consumer overrides and declared defaults.
  - `_module.pageId`, `_module.connectionId`, `_module.endpointId` — produce scoped IDs from a module-author's unscoped ID.
  - `_module.id` — the entry ID of the current module.

  **Auto-scoped IDs**

  Page, connection, API endpoint, and menu item IDs are auto-prefixed with the entry ID. Block and request IDs inherit page scope and are not rewritten.

  **Consuming module resources**

  - Pages and APIs are auto-included and auto-scoped — they appear in the app under the entry-ID prefix.
  - Components are reusable config fragments included with `_ref: { module, component, vars }`. They can export any config — UI blocks, enum maps, config templates, schema fragments — and accept vars at the call site.
  - Menus are included with `_ref: { module, menu }`, typically wrapped in a `MenuGroup`.

  **Connection remapping**

  Apps can redirect a module connection to an existing app connection via the entry's `connections` map. The module's connection definition and its declared secrets are skipped — the app connection handles them.

  **Cross-module dependencies**

  Modules can reference each other's pages, components, menus, connections, and APIs via abstract dependencies declared in `module.lowdefy.yaml`.

  - Auto-wiring: when a module entry's `id` matches a declared dependency name, the build wires it automatically.
  - Explicit wiring: the entry's `dependencies` map overrides auto-wiring and supports multi-instance topologies where each instance points at a different partner.
  - The build validates every wiring, detects dependency cycles, and reports unmapped or undeclared dependencies with remediation hints.

  **Auth page rules**

  Picomatch glob patterns in auth page rules (e.g. `team-users/*`) for wildcard module page matching.

  **Slashed page IDs (`@lowdefy/server`, `@lowdefy/server-dev`)**

  Server routes support module page IDs containing `/` (e.g. `/team-users/users-list`).

### Patch Changes

- 596fddc: chore(connection-knex): update knex and SQL drivers; replace `sqlite3` with `better-sqlite3`; replace `mysql` with `mysql2`.

  Bumped knex and its dialect drivers, and consolidated onto the actively-maintained drivers — replaced `sqlite3` with `better-sqlite3` and `mysql` with `mysql2`. Subsumes the prior `sqlite3@5.1.7` darwin-arm64 fix.

  `@lowdefy/connection-knex` dependency changes:

  - `knex` `2.5.1` → `3.2.9`. Knex 3.x drops Node < 16; Lowdefy already requires Node 18+. The `knex(config)`, `.raw()`, and dynamic query-builder API surface used by `KnexRaw` / `KnexBuilder` is unchanged.
  - `pg` `8.11.3` → `8.20.0`.
  - **Removed** `mssql`. Knex's `mssql` dialect actually requires `tedious` (not the `mssql` package), and Lowdefy never imported `mssql` directly — it was only ever a vehicle for pulling tedious into the install tree. `client: mssql` in user YAML is unchanged: the knex client name stays the same, only the underlying npm package shipped with `connection-knex` changes.
  - **Added** `tedious` `19.2.1` as the SQL Server driver — the package knex actually loads when `client: mssql` is used.
  - **Removed** `sqlite3`. The driver is in maintenance-only mode upstream (the v6 release marked the repo unmaintained).
  - **Added** `better-sqlite3` `12.9.0` as the SQLite driver. Selectable as `client: better-sqlite3` (or `client: sqlite`, which is now an alias of `better-sqlite3` — see runtime client handling below).
  - **Removed** `mysql`. Unmaintained upstream since 2020.
  - **Added** `mysql2` `3.22.3` as the MySQL / MariaDB driver. Selectable as `client: mysql2` in connection YAML.

  Runtime client handling (in `createKnex`):

  - `client: sqlite` is silently remapped to `client: better-sqlite3`. `sqlite` was historically a knex-level alias of `sqlite3`; this preserves the YAML alias while the underlying driver changes.
  - `client: sqlite3` now throws a `ConfigError` with a migration message: `Knex connection "client: sqlite3" is no longer supported. Use "client: better-sqlite3" or "client: sqlite" instead.` Existing apps using `client: sqlite3` need to update their connection YAML.
  - `client: mysql` now throws a `ConfigError` with a migration message: `Knex connection "client: mysql" is no longer supported. Use "client: mysql2" instead.` Existing apps using `client: mysql` need to update their connection YAML. `mysql` is **not** silently remapped because knex treats `mysql` and `mysql2` as separate dialects with subtly different SQL formatters, not aliases — the migration is a deliberate user choice.

  `pnpm.onlyBuiltDependencies` allowlist for `better-sqlite3`:

  `better-sqlite3` runs a native-binding install script (`prebuild-install` with a `node-gyp rebuild` fallback). pnpm 10 silently suppresses postinstall scripts for unapproved packages, which leaves the binding unbuilt and crashes `KnexRaw` / `KnexBuilder` at runtime.

  - Added `better-sqlite3` to the allowlist on `@lowdefy/server`, `@lowdefy/server-dev`, and `@lowdefy/server-e2e`. These are the install roots in the CLI fetch flow under `.lowdefy/{dev,build}/`, where pnpm honors the per-package `pnpm.onlyBuiltDependencies` field.
  - Also added the same allowlist to the monorepo root `package.json`. The per-package field is ignored at workspace-root install (pnpm 10 only honors it on the install root), so contributors running `pnpm install` at the repo root would otherwise have to `pnpm rebuild better-sqlite3` manually.

- 762755c: feat(blocks-tiptap): Add new default block package with `TiptapInput` and `TiptapMentionInput` rich-text editors.

  `@lowdefy/blocks-tiptap` ships two rich-text editor blocks built on [TipTap](https://tiptap.dev):

  - **`TiptapInput`** — standard rich-text editor with bold/italic/strike-through, multi-color highlight, headings, lists, tables, links, and a bubble menu.
  - **`TiptapMentionInput`** — everything `TiptapInput` does, plus an @-mention dropdown populated from a static options list or a Lowdefy request. Resolved mentions are returned on the block value as `mentions: [...]`.

  Both blocks emit an object value shaped `{ html, text, markdown, fileList, mentions? }` and register `clear`, `setContent`, and `focus` methods.

  **Configurable extensions** — defaults preserve the bundled editor; override any of these to trim the editor down or tune it:

  - `properties.starterKit` — object forwarded to TipTap [StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit), e.g. `{ heading: false, codeBlock: false }`.
  - `properties.image` — `{ enabled, maxWidth, zoom }`
  - `properties.table` — `{ enabled, resizable }`
  - `properties.link` — `{ enabled, autolink, linkOnPaste, openOnClick, defaultProtocol }`
  - `properties.highlight` — `{ enabled, multicolor }`
  - `properties.mentions.char` / `properties.mentions.allowSpaces` — change the trigger char (e.g. `#` for hashtags) or disable spaces inside a mention query (`TiptapMentionInput` only).

  Image drag/drop and paste are supported by pointing `properties.s3PostPolicyRequestId` at a request that returns an S3 presigned POST policy (e.g. `AwsS3PresignedPostPolicy`). The file handler is optional — omit the request id to disable uploads entirely.

  The blocks are registered in the default types map and are available out of the box on `@lowdefy/server-dev`. No private-registry tokens are required: the blocks use the open-source [`@tiptap/extension-file-handler`](https://www.npmjs.com/package/@tiptap/extension-file-handler) instead of `@tiptap-pro/extension-file-handler`, so projects that migrated from a custom TipTap plugin can drop their `TIPTAP_PRO_TOKEN` environment variable and `.npmrc` scoped-registry config.

- Updated dependencies [1d18a13]
- Updated dependencies [01e249b]
- Updated dependencies [762755c]
- Updated dependencies [73fa2b9]
- Updated dependencies [69a59c0]
- Updated dependencies [6ec2cd9]
- Updated dependencies [0d44433]
- Updated dependencies [fd1604f]
- Updated dependencies [186a57d]
- Updated dependencies [a4ecee5]
- Updated dependencies [d105b81]
- Updated dependencies [6ec0dd4]
- Updated dependencies [e3fc007]
- Updated dependencies [cea34ac]
- Updated dependencies [0f38c9f]
- Updated dependencies [c91003d]
- Updated dependencies [72b6159]
  - @lowdefy/actions-core@5.2.0
  - @lowdefy/engine@5.2.0
  - @lowdefy/operators-js@5.2.0
  - @lowdefy/blocks-antd@5.2.0
  - @lowdefy/client@5.2.0
  - @lowdefy/blocks-tiptap@5.2.0
  - @lowdefy/build@5.2.0
  - @lowdefy/api@5.2.0
  - @lowdefy/blocks-aggrid@5.2.0
  - @lowdefy/logger@5.2.0
  - @lowdefy/blocks-loaders@5.2.0
  - @lowdefy/operators-change-case@5.2.0
  - @lowdefy/operators-dayjs@5.2.0
  - @lowdefy/operators-diff@5.2.0
  - @lowdefy/operators-mql@5.2.0
  - @lowdefy/operators-nunjucks@5.2.0
  - @lowdefy/operators-uuid@5.2.0
  - @lowdefy/operators-yaml@5.2.0
  - @lowdefy/layout@5.2.0
  - @lowdefy/blocks-basic@5.2.0
  - @lowdefy/blocks-echarts@5.2.0
  - @lowdefy/blocks-markdown@5.2.0
  - @lowdefy/connection-axios-http@5.2.0
  - @lowdefy/plugin-next-auth@5.2.0
  - @lowdefy/block-utils@5.2.0
  - @lowdefy/errors@5.2.0
  - @lowdefy/helpers@5.2.0
  - @lowdefy/node-utils@5.2.0

## 5.1.0

### Patch Changes

- 081d79634: feat(client): Per-mode theme tokens for dark/light customization.

  `theme.antd` now accepts four new sibling keys so apps can soften base surfaces without juggling two theme files. Each is merged on top of the shared equivalent only when the matching mode is active:

  - `lightToken` / `darkToken` — override antd design tokens (e.g. `colorBgLayout`, `colorBgContainer`, `colorBgElevated`) per mode.
  - `lightComponents` / `darkComponents` — override component-level tokens per mode (e.g. `Layout.siderBg`, `Layout.headerBg`, `Menu.darkItemBg`) that aren't reachable via seed tokens.

  The `<html>` pre-hydration inline script now reads `darkToken.colorBgLayout` / `lightToken.colorBgLayout` from the built theme, so the first paint matches your configured surface color with no flash of `#000` or `#fff`.

  ```yaml
  theme:
    antd:
      token:
        colorPrimary: '#6366f1'
      darkToken:
        colorBgLayout: '#131419'
        colorBgContainer: '#1a1b22'
      darkComponents:
        Layout:
          headerBg: '#0e0f13'
          siderBg: '#0e0f13'
        Menu:
          darkItemBg: '#0e0f13'
          darkItemSelectedBg: '#252731'
    darkMode: system
  ```

  Backwards compatible — apps that only use `theme.antd.token` keep antd's default base colors (dark `#000`, light browser-default).

- f56a47d87: fix(server): Prevent white flash on page navigation in dark mode.

  Pages no longer flash white when navigating between pages in dark mode. A synchronous inline script now sets the correct background color before the page paints, matching the user's dark mode preference from config, localStorage, or system settings.

- c6f45a1ac: fix(server): Escape theme values embedded in the pre-hydration inline script.

  `_document.js` interpolates `configColorMode`, `darkToken.colorBgLayout`, and `lightToken.colorBgLayout` from `theme.json` into a synchronous `<script>` block to set the `<html>` background before hydration. Previously the values went through `JSON.stringify` only — enough to escape JS-string-context characters, but not enough to prevent a value containing `</script>` (or U+2028 / U+2029 line separators) from breaking out of the enclosing `<script>` tag.

  Added a `safeScriptJson` helper that additionally escapes `<`, `>`, control chars, and U+2028 / U+2029 to `\uXXXX` sequences after `JSON.stringify`. For every valid color value (`#1e293b`, `rgb(...)`, `slategray`, `oklch(...)`, etc.) the output is byte-identical to the previous behavior; only payloads that would have tripped `<script>` breakout or JS-line-terminator injection are now neutralized.

  Closes the six `js/bad-code-sanitization` CodeQL alerts (89 – 94) opened against the per-mode-theme PR.

- Updated dependencies [b2a2a981d]
- Updated dependencies [72625593e]
- Updated dependencies [95388a581]
- Updated dependencies [573b90369]
- Updated dependencies [be367bebd]
- Updated dependencies [b1e0c9944]
- Updated dependencies [447f8ce57]
- Updated dependencies [36a2d1bca]
- Updated dependencies [081d79634]
- Updated dependencies [72fbd4bab]
- Updated dependencies [a7f2480b4]
- Updated dependencies [797ab5b2d]
- Updated dependencies [f56a47d87]
- Updated dependencies [6c6aab961]
- Updated dependencies [af8ef77cb]
  - @lowdefy/blocks-aggrid@5.1.0
  - @lowdefy/blocks-antd@5.1.0
  - @lowdefy/client@5.1.0
  - @lowdefy/build@5.1.0
  - @lowdefy/operators-js@5.1.0
  - @lowdefy/engine@5.1.0
  - @lowdefy/api@5.1.0
  - @lowdefy/layout@5.1.0
  - @lowdefy/actions-core@5.1.0
  - @lowdefy/blocks-basic@5.1.0
  - @lowdefy/blocks-echarts@5.1.0
  - @lowdefy/blocks-loaders@5.1.0
  - @lowdefy/blocks-markdown@5.1.0
  - @lowdefy/connection-axios-http@5.1.0
  - @lowdefy/operators-change-case@5.1.0
  - @lowdefy/operators-dayjs@5.1.0
  - @lowdefy/operators-diff@5.1.0
  - @lowdefy/operators-mql@5.1.0
  - @lowdefy/operators-nunjucks@5.1.0
  - @lowdefy/operators-uuid@5.1.0
  - @lowdefy/operators-yaml@5.1.0
  - @lowdefy/plugin-next-auth@5.1.0
  - @lowdefy/block-utils@5.1.0
  - @lowdefy/errors@5.1.0
  - @lowdefy/helpers@5.1.0
  - @lowdefy/logger@5.1.0
  - @lowdefy/node-utils@5.1.0

## 5.0.0

### Major Changes

- 29eb199c7f: Restructure block metadata from component static properties to dedicated `meta.js` files.

  ### Breaking Changes

  - **`schema.js` renamed to `meta.js`**: Block definitions moved from `schema.js` to `meta.js`. The `meta.js` files export `category`, `icons`, `valueType`, `cssKeys`, `events`, and `properties` (JSON Schema).
  - **`schemas.js` barrel renamed to `metas.js`**: Block packages export `./metas` instead of `./schemas`.
  - **`.meta` removed from components**: Block components no longer have a `.meta` static property. Metadata is loaded from the `blockMetas.json` build artifact at runtime.
  - **`blockMetas.json` build artifact**: The build pipeline writes `plugins/blockMetas.json` containing category, valueType, and initValue for each block type.
  - **`buildBlockSchema(meta)`**: New function in `@lowdefy/block-utils` generates complete JSON Schema from meta objects with operator support and CSS slot key validation.

- f430f02dde: Upgrade Next.js to 16 with Turbopack.

  ### Breaking Changes

  - **Next.js 16**: Both production and development servers run on Next.js 16 with Turbopack as the default bundler.
  - **Less removed**: `next-with-less` wrapper is removed. Styling uses CSS Modules and antd CSS-in-JS.
  - **SWC 1.15.18**: Updated SWC compiler.
  - **Dynamic transpilePackages**: Server resolves block packages for transpilation from a build artifact, supporting custom block plugins with CSS imports.
  - **antd as direct server dependency**: Both server packages list `antd` and `@ant-design/cssinjs` as direct dependencies for pnpm strict mode compatibility.

### Minor Changes

- f430f02dde: Add ErrorBar component to the development server that displays build errors and warnings in a fixed bottom bar. Build warnings now propagate from the build pipeline to the browser for immediate developer feedback.
- c8f4a41063: Add `theme.darkMode` config with system preference support.

  **System Dark Mode (`theme.darkMode`)**

  - New `theme.darkMode` config key accepts `'system'` (default), `'light'`, or `'dark'`
  - When set to `'system'`, the app follows the OS dark mode preference and updates live when it changes
  - When set to `'light'` or `'dark'`, the developer locks the mode — user preferences are stored but not applied

  **SetDarkMode Action**

  - Now accepts string params: `darkMode: 'system' | 'light' | 'dark'`
  - Without params, cycles through light, dark, and system preferences

  **`_media` Operator**

  - New `_media: darkModePreference` returns the user's preference (`'system'`, `'light'`, or `'dark'`)
  - `_media: darkMode` continues to return the effective boolean state

  **Dark Mode Rendering**

  - Notification, Message, and ConfirmModal render with correct dark mode colors via `App.useApp()` hooks
  - Loader blocks (Skeleton, Spinner) use antd design tokens instead of hardcoded colors
  - 404 page and loading states use theme-aware backgrounds
  - Mobile menu drawer background matches the active theme

- f430f02dde: Extract Tailwind utility classes from block properties for CSS generation. All string values in block properties (HTML content, markdown, class names) are scanned at build time and written to per-page content files so Tailwind v4's Oxide engine generates CSS for all used utilities. Content files are regenerated on each JIT rebuild for hot reload.

  Block plugin source files are resolved using `require.resolve` to follow pnpm symlinks correctly. The server package includes `postcss.config.js` so Tailwind compiles in production builds.

- f430f02dde: Add theme token system. Use `_theme` operator to access Ant Design v6 design tokens (colors, spacing, typography) at runtime. Theme is configured via `theme.antd.token` and `theme.antd.algorithm` in `lowdefy.yaml`. The `_theme` operator resolves the full computed token set including antd defaults.

### Patch Changes

- Updated dependencies [45964f1506]
- Updated dependencies [52ea769811]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [29eb199c7f]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [8b9f926d1]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [155c0b9724]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [0fe1bc38dd]
- Updated dependencies [130a569d36]
- Updated dependencies [e3e922538]
- Updated dependencies [c3b5b45ec5]
- Updated dependencies [c8f4a41063]
- Updated dependencies [fd8225b7a1]
- Updated dependencies [43528a8b9]
- Updated dependencies [905d5d406]
- Updated dependencies [c1b5ddb33a]
- Updated dependencies [f430f02dde]
- Updated dependencies [8b9f926d1]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [c570982e0f]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
  - @lowdefy/blocks-aggrid@5.0.0
  - @lowdefy/blocks-basic@5.0.0
  - @lowdefy/blocks-antd@5.0.0
  - @lowdefy/build@5.0.0
  - @lowdefy/engine@5.0.0
  - @lowdefy/client@5.0.0
  - @lowdefy/layout@5.0.0
  - @lowdefy/block-utils@5.0.0
  - @lowdefy/blocks-loaders@5.0.0
  - @lowdefy/blocks-echarts@5.0.0
  - @lowdefy/blocks-markdown@5.0.0
  - @lowdefy/operators-dayjs@5.0.0
  - @lowdefy/operators-js@5.0.0
  - @lowdefy/actions-core@5.0.0
  - @lowdefy/helpers@5.0.0
  - @lowdefy/connection-axios-http@5.0.0
  - @lowdefy/operators-mql@5.0.0
  - @lowdefy/operators-nunjucks@5.0.0
  - @lowdefy/operators-uuid@5.0.0
  - @lowdefy/operators-yaml@5.0.0
  - @lowdefy/operators-change-case@5.0.0
  - @lowdefy/operators-diff@5.0.0
  - @lowdefy/plugin-next-auth@5.0.0
  - @lowdefy/node-utils@5.0.0
  - @lowdefy/api@5.0.0
  - @lowdefy/logger@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- 8779686f9: fix(build,server-dev): Improved accuracy of dev server skeleton rebuild detection.

  The dev server previously used a path-based heuristic to decide which file changes required a skeleton rebuild. This could miss changes to API endpoints referenced from page directories, and unnecessarily rebuild for non-skeleton page templates. Skeleton rebuild classification now uses the build's ref map as the source of truth, ensuring only the correct file changes trigger skeleton rebuilds.

- Updated dependencies [c5ce5b972]
- Updated dependencies [9de3276dc]
- Updated dependencies [8779686f9]
  - @lowdefy/operators-js@4.7.3
  - @lowdefy/api@4.7.3
  - @lowdefy/build@4.7.3
  - @lowdefy/engine@4.7.3
  - @lowdefy/client@4.7.3
  - @lowdefy/layout@4.7.3
  - @lowdefy/actions-core@4.7.3
  - @lowdefy/blocks-aggrid@4.7.3
  - @lowdefy/blocks-antd@4.7.3
  - @lowdefy/blocks-basic@4.7.3
  - @lowdefy/blocks-color-selectors@4.7.3
  - @lowdefy/blocks-echarts@4.7.3
  - @lowdefy/blocks-loaders@4.7.3
  - @lowdefy/blocks-markdown@4.7.3
  - @lowdefy/blocks-qr@4.7.3
  - @lowdefy/operators-change-case@4.7.3
  - @lowdefy/operators-diff@4.7.3
  - @lowdefy/operators-moment@4.7.3
  - @lowdefy/operators-mql@4.7.3
  - @lowdefy/operators-nunjucks@4.7.3
  - @lowdefy/operators-uuid@4.7.3
  - @lowdefy/operators-yaml@4.7.3
  - @lowdefy/plugin-next-auth@4.7.3
  - @lowdefy/block-utils@4.7.3
  - @lowdefy/errors@4.7.3
  - @lowdefy/helpers@4.7.3
  - @lowdefy/logger@4.7.3
  - @lowdefy/node-utils@4.7.3

## 4.7.2

### Patch Changes

- 30616048d: fix: Fix dev server build hang when page files contain top-level \_ref.

  The dev server could hang indefinitely at "Building config..." when a page YAML file's entire content was a `_ref`. This caused a self-referencing parent in the ref map, leading to an infinite loop during page source resolution. Also fixed null `lowdefy.yaml` handling in custom plugin type map generation.

- Updated dependencies [30616048d]
  - @lowdefy/build@4.7.2
  - @lowdefy/engine@4.7.2
  - @lowdefy/api@4.7.2
  - @lowdefy/client@4.7.2
  - @lowdefy/layout@4.7.2
  - @lowdefy/actions-core@4.7.2
  - @lowdefy/blocks-aggrid@4.7.2
  - @lowdefy/blocks-antd@4.7.2
  - @lowdefy/blocks-basic@4.7.2
  - @lowdefy/blocks-color-selectors@4.7.2
  - @lowdefy/blocks-echarts@4.7.2
  - @lowdefy/blocks-loaders@4.7.2
  - @lowdefy/blocks-markdown@4.7.2
  - @lowdefy/blocks-qr@4.7.2
  - @lowdefy/operators-change-case@4.7.2
  - @lowdefy/operators-diff@4.7.2
  - @lowdefy/operators-js@4.7.2
  - @lowdefy/operators-moment@4.7.2
  - @lowdefy/operators-mql@4.7.2
  - @lowdefy/operators-nunjucks@4.7.2
  - @lowdefy/operators-uuid@4.7.2
  - @lowdefy/operators-yaml@4.7.2
  - @lowdefy/plugin-next-auth@4.7.2
  - @lowdefy/block-utils@4.7.2
  - @lowdefy/errors@4.7.2
  - @lowdefy/helpers@4.7.2
  - @lowdefy/logger@4.7.2
  - @lowdefy/node-utils@4.7.2

## 4.7.1

### Patch Changes

- 1ce9f9a56: fix(build): Dev server dynamically loads icons discovered during JIT page builds.

  Icons referenced only inside page blocks (e.g., `icon: FiAperture` on a Button) were not available in the dev server's static bundle, causing a fallback icon to render. The JIT page builder now detects missing icons when a page is compiled, extracts their SVG data from react-icons, and serves it via a dynamic API endpoint. The client fetches and merges these icons at runtime without triggering a Next.js rebuild or server restart.

- Updated dependencies [18d1c3bfa]
- Updated dependencies [fac48c10a]
- Updated dependencies [1ce9f9a56]
- Updated dependencies [ca26d3441]
  - @lowdefy/blocks-antd@4.7.1
  - @lowdefy/operators-js@4.7.1
  - @lowdefy/build@4.7.1
  - @lowdefy/blocks-color-selectors@4.7.1
  - @lowdefy/api@4.7.1
  - @lowdefy/engine@4.7.1
  - @lowdefy/blocks-aggrid@4.7.1
  - @lowdefy/blocks-basic@4.7.1
  - @lowdefy/blocks-echarts@4.7.1
  - @lowdefy/blocks-loaders@4.7.1
  - @lowdefy/blocks-markdown@4.7.1
  - @lowdefy/blocks-qr@4.7.1
  - @lowdefy/client@4.7.1
  - @lowdefy/layout@4.7.1
  - @lowdefy/actions-core@4.7.1
  - @lowdefy/operators-change-case@4.7.1
  - @lowdefy/operators-diff@4.7.1
  - @lowdefy/operators-moment@4.7.1
  - @lowdefy/operators-mql@4.7.1
  - @lowdefy/operators-nunjucks@4.7.1
  - @lowdefy/operators-uuid@4.7.1
  - @lowdefy/operators-yaml@4.7.1
  - @lowdefy/plugin-next-auth@4.7.1
  - @lowdefy/block-utils@4.7.1
  - @lowdefy/errors@4.7.1
  - @lowdefy/helpers@4.7.1
  - @lowdefy/logger@4.7.1
  - @lowdefy/node-utils@4.7.1

## 4.7.0

### Patch Changes

- e2666d58c: fix(cli): Fix port availability check for start command

  The CLI's `checkPortAvailable` was called with `undefined` port when no `--port` flag was passed, causing `net.listen(undefined)` to bind a random port instead of checking port 3000. Added default `port: 3000` in `getOptions`. Removed redundant `checkPortAvailable` from server-dev manager since the CLI now catches port conflicts before the server starts.

- Updated dependencies [4543688f7]
- Updated dependencies [e1274566b]
- Updated dependencies [5716be2c8]
- Updated dependencies [5a556b918]
- Updated dependencies [811f80760]
- Updated dependencies [dea6651a1]
  - @lowdefy/build@4.7.0
  - @lowdefy/helpers@4.7.0
  - @lowdefy/blocks-antd@4.7.0
  - @lowdefy/blocks-basic@4.7.0
  - @lowdefy/engine@4.7.0
  - @lowdefy/api@4.7.0
  - @lowdefy/operators-change-case@4.7.0
  - @lowdefy/operators-diff@4.7.0
  - @lowdefy/operators-js@4.7.0
  - @lowdefy/operators-moment@4.7.0
  - @lowdefy/operators-mql@4.7.0
  - @lowdefy/operators-nunjucks@4.7.0
  - @lowdefy/operators-uuid@4.7.0
  - @lowdefy/operators-yaml@4.7.0
  - @lowdefy/client@4.7.0
  - @lowdefy/layout@4.7.0
  - @lowdefy/actions-core@4.7.0
  - @lowdefy/blocks-aggrid@4.7.0
  - @lowdefy/blocks-loaders@4.7.0
  - @lowdefy/block-utils@4.7.0
  - @lowdefy/logger@4.7.0
  - @lowdefy/node-utils@4.7.0
  - @lowdefy/blocks-color-selectors@4.7.0
  - @lowdefy/blocks-echarts@4.7.0
  - @lowdefy/blocks-markdown@4.7.0
  - @lowdefy/blocks-qr@4.7.0
  - @lowdefy/plugin-next-auth@4.7.0
  - @lowdefy/errors@4.7.0

## 4.6.0

### Minor Changes

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

- af61715d5: feat: JIT page building for dev server

  **Shallow Refs and JIT Build (`@lowdefy/build`)**

  - Shallow `_ref` resolution stops at configured JSON paths, leaving `~shallow` markers for on-demand resolution
  - `shallowBuild` produces a page registry with dependency tracking instead of fully built pages
  - `buildPageJit` fully resolves a single page on demand using the shallow build output
  - File dependency map tracks which config files affect which pages for targeted rebuilds
  - Build package reorganized: `jit/` folder for dev-server-only files, `full/` folder for production-only files

  **JIT Page Building (`@lowdefy/server-dev`)**

  - Pages are built on-demand when requested instead of all at once during initial build
  - Page cache with file-watcher invalidation for fast rebuilds
  - `/api/page/[pageId]` endpoint triggers JIT build if page not cached
  - `/api/js/[env]` endpoint serves operator JS maps
  - Build error page component displays errors inline in the browser

  **Operator JS Hash Check (`@lowdefy/operators-js`)**

  - Added hash validation for jsMap to detect stale operator definitions

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

- 43a5243da: feat(server-dev): Add mock user support for e2e testing

  Set `LOWDEFY_DEV_USER` env var or `auth.dev.mockUser` in config to bypass login in dev server.

### Patch Changes

- 8250d8d3e: fix(errors): Remove redundant try/catch in operator runners, add cause chains to remaining throws
- aa0d6d363e: fix: Add missing uuid dependency to servers
- Add port-in-use check with clear error message before starting server.
- Updated dependencies [fb7910f62]
- Updated dependencies [aeae7f0c83]
- Updated dependencies [c62468b98]
- Updated dependencies [7936ee3fd8]
- Updated dependencies [5e03091ee]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8250d8d3e]
- Updated dependencies [bb3222a5a]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [af61715d5]
- Updated dependencies [f673e3ab3d]
- Updated dependencies [43a5243da]
- Updated dependencies [cacbb4d189]
- Updated dependencies [338ea04b9f]
- Updated dependencies [f673e3ab3]
  - @lowdefy/blocks-antd@4.6.0
  - @lowdefy/blocks-basic@4.6.0
  - @lowdefy/build@4.6.0
  - @lowdefy/blocks-color-selectors@4.6.0
  - @lowdefy/engine@4.6.0
  - @lowdefy/client@4.6.0
  - @lowdefy/api@4.6.0
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0
  - @lowdefy/node-utils@4.6.0
  - @lowdefy/block-utils@4.6.0
  - @lowdefy/operators-js@4.6.0
  - @lowdefy/operators-change-case@4.6.0
  - @lowdefy/operators-diff@4.6.0
  - @lowdefy/operators-moment@4.6.0
  - @lowdefy/operators-mql@4.6.0
  - @lowdefy/operators-nunjucks@4.6.0
  - @lowdefy/operators-uuid@4.6.0
  - @lowdefy/operators-yaml@4.6.0
  - @lowdefy/actions-core@4.6.0
  - @lowdefy/logger@4.6.0
  - @lowdefy/layout@4.6.0
  - @lowdefy/blocks-aggrid@4.6.0
  - @lowdefy/blocks-loaders@4.6.0
  - @lowdefy/blocks-echarts@4.6.0
  - @lowdefy/blocks-markdown@4.6.0
  - @lowdefy/blocks-qr@4.6.0
  - @lowdefy/plugin-next-auth@4.6.0

## 4.5.2

### Patch Changes

- Updated dependencies [d573e8ff8]
  - @lowdefy/client@4.5.2
  - @lowdefy/api@4.5.2
  - @lowdefy/build@4.5.2
  - @lowdefy/engine@4.5.2
  - @lowdefy/layout@4.5.2
  - @lowdefy/actions-core@4.5.2
  - @lowdefy/blocks-aggrid@4.5.2
  - @lowdefy/blocks-antd@4.5.2
  - @lowdefy/blocks-basic@4.5.2
  - @lowdefy/blocks-color-selectors@4.5.2
  - @lowdefy/blocks-echarts@4.5.2
  - @lowdefy/blocks-loaders@4.5.2
  - @lowdefy/blocks-markdown@4.5.2
  - @lowdefy/blocks-qr@4.5.2
  - @lowdefy/connection-axios-http@4.5.2
  - @lowdefy/operators-change-case@4.5.2
  - @lowdefy/operators-diff@4.5.2
  - @lowdefy/operators-js@4.5.2
  - @lowdefy/operators-moment@4.5.2
  - @lowdefy/operators-mql@4.5.2
  - @lowdefy/operators-nunjucks@4.5.2
  - @lowdefy/operators-uuid@4.5.2
  - @lowdefy/operators-yaml@4.5.2
  - @lowdefy/plugin-next-auth@4.5.2
  - @lowdefy/block-utils@4.5.2
  - @lowdefy/helpers@4.5.2
  - @lowdefy/node-utils@4.5.2

## 4.5.1

### Patch Changes

- 51f7f9dbe: Use uuid instead of crypto.randomUUID(), update uuid to v13.
- Updated dependencies [51f7f9dbe]
  - @lowdefy/operators-uuid@4.5.1
  - @lowdefy/build@4.5.1
  - @lowdefy/api@4.5.1
  - @lowdefy/client@4.5.1
  - @lowdefy/engine@4.5.1
  - @lowdefy/layout@4.5.1
  - @lowdefy/actions-core@4.5.1
  - @lowdefy/blocks-aggrid@4.5.1
  - @lowdefy/blocks-antd@4.5.1
  - @lowdefy/blocks-basic@4.5.1
  - @lowdefy/blocks-color-selectors@4.5.1
  - @lowdefy/blocks-echarts@4.5.1
  - @lowdefy/blocks-loaders@4.5.1
  - @lowdefy/blocks-markdown@4.5.1
  - @lowdefy/blocks-qr@4.5.1
  - @lowdefy/connection-axios-http@4.5.1
  - @lowdefy/operators-change-case@4.5.1
  - @lowdefy/operators-diff@4.5.1
  - @lowdefy/operators-js@4.5.1
  - @lowdefy/operators-moment@4.5.1
  - @lowdefy/operators-mql@4.5.1
  - @lowdefy/operators-nunjucks@4.5.1
  - @lowdefy/operators-yaml@4.5.1
  - @lowdefy/plugin-next-auth@4.5.1
  - @lowdefy/block-utils@4.5.1
  - @lowdefy/helpers@4.5.1
  - @lowdefy/node-utils@4.5.1

## 4.5.0

### Minor Changes

- d9512d9be: - Refactor build to create individual block instances.
  - Add hybrid block type to extend block functionality.
- 16084c1bd: Adds Lowdefy APIs. Lowdefy APIs allow you to create custom server-side API endpoints within your Lowdefy application. See https://docs.lowdefy.com/lowdefy-api for more info.

### Patch Changes

- Updated dependencies [abc90f3f7]
- Updated dependencies [d9512d9be]
- Updated dependencies [4f610de5c]
- Updated dependencies [d6c58fe97]
- Updated dependencies [09ae496d8]
- Updated dependencies [b3a2e6662]
  - @lowdefy/build@4.5.0
  - @lowdefy/client@4.5.0
  - @lowdefy/engine@4.5.0
  - @lowdefy/blocks-antd@4.5.0
  - @lowdefy/blocks-color-selectors@4.5.0
  - @lowdefy/api@4.5.0
  - @lowdefy/operators-change-case@4.5.0
  - @lowdefy/operators-diff@4.5.0
  - @lowdefy/operators-js@4.5.0
  - @lowdefy/operators-moment@4.5.0
  - @lowdefy/operators-mql@4.5.0
  - @lowdefy/operators-nunjucks@4.5.0
  - @lowdefy/operators-uuid@4.5.0
  - @lowdefy/operators-yaml@4.5.0
  - @lowdefy/layout@4.5.0
  - @lowdefy/actions-core@4.5.0
  - @lowdefy/blocks-aggrid@4.5.0
  - @lowdefy/blocks-basic@4.5.0
  - @lowdefy/blocks-echarts@4.5.0
  - @lowdefy/blocks-loaders@4.5.0
  - @lowdefy/blocks-markdown@4.5.0
  - @lowdefy/blocks-qr@4.5.0
  - @lowdefy/connection-axios-http@4.5.0
  - @lowdefy/plugin-next-auth@4.5.0
  - @lowdefy/block-utils@4.5.0
  - @lowdefy/helpers@4.5.0
  - @lowdefy/node-utils@4.5.0

## 4.4.0

### Patch Changes

- a491106b7: Fix spawnProcess options on Windows
- Updated dependencies [bcfbb1a9b]
- Updated dependencies [1a81e100e]
  - @lowdefy/blocks-antd@4.4.0
  - @lowdefy/blocks-echarts@4.4.0
  - @lowdefy/api@4.4.0
  - @lowdefy/build@4.4.0
  - @lowdefy/operators-nunjucks@4.4.0
  - @lowdefy/blocks-color-selectors@4.4.0
  - @lowdefy/engine@4.4.0
  - @lowdefy/connection-axios-http@4.4.0
  - @lowdefy/client@4.4.0
  - @lowdefy/layout@4.4.0
  - @lowdefy/actions-core@4.4.0
  - @lowdefy/blocks-aggrid@4.4.0
  - @lowdefy/blocks-basic@4.4.0
  - @lowdefy/blocks-loaders@4.4.0
  - @lowdefy/blocks-markdown@4.4.0
  - @lowdefy/blocks-qr@4.4.0
  - @lowdefy/operators-change-case@4.4.0
  - @lowdefy/operators-diff@4.4.0
  - @lowdefy/operators-js@4.4.0
  - @lowdefy/operators-moment@4.4.0
  - @lowdefy/operators-mql@4.4.0
  - @lowdefy/operators-uuid@4.4.0
  - @lowdefy/operators-yaml@4.4.0
  - @lowdefy/plugin-next-auth@4.4.0
  - @lowdefy/block-utils@4.4.0
  - @lowdefy/helpers@4.4.0
  - @lowdefy/node-utils@4.4.0

## 4.3.2

### Patch Changes

- Updated dependencies [efefb8ca0]
  - @lowdefy/blocks-antd@4.3.2
  - @lowdefy/build@4.3.2
  - @lowdefy/blocks-color-selectors@4.3.2
  - @lowdefy/api@4.3.2
  - @lowdefy/client@4.3.2
  - @lowdefy/engine@4.3.2
  - @lowdefy/layout@4.3.2
  - @lowdefy/actions-core@4.3.2
  - @lowdefy/blocks-aggrid@4.3.2
  - @lowdefy/blocks-basic@4.3.2
  - @lowdefy/blocks-echarts@4.3.2
  - @lowdefy/blocks-loaders@4.3.2
  - @lowdefy/blocks-markdown@4.3.2
  - @lowdefy/blocks-qr@4.3.2
  - @lowdefy/connection-axios-http@4.3.2
  - @lowdefy/operators-change-case@4.3.2
  - @lowdefy/operators-diff@4.3.2
  - @lowdefy/operators-js@4.3.2
  - @lowdefy/operators-moment@4.3.2
  - @lowdefy/operators-mql@4.3.2
  - @lowdefy/operators-nunjucks@4.3.2
  - @lowdefy/operators-uuid@4.3.2
  - @lowdefy/operators-yaml@4.3.2
  - @lowdefy/plugin-next-auth@4.3.2
  - @lowdefy/block-utils@4.3.2
  - @lowdefy/helpers@4.3.2
  - @lowdefy/node-utils@4.3.2

## 4.3.1

### Patch Changes

- Updated dependencies [3e574857c]
  - @lowdefy/blocks-antd@4.3.1
  - @lowdefy/build@4.3.1
  - @lowdefy/blocks-color-selectors@4.3.1
  - @lowdefy/api@4.3.1
  - @lowdefy/client@4.3.1
  - @lowdefy/engine@4.3.1
  - @lowdefy/layout@4.3.1
  - @lowdefy/actions-core@4.3.1
  - @lowdefy/blocks-aggrid@4.3.1
  - @lowdefy/blocks-basic@4.3.1
  - @lowdefy/blocks-echarts@4.3.1
  - @lowdefy/blocks-loaders@4.3.1
  - @lowdefy/blocks-markdown@4.3.1
  - @lowdefy/blocks-qr@4.3.1
  - @lowdefy/connection-axios-http@4.3.1
  - @lowdefy/operators-change-case@4.3.1
  - @lowdefy/operators-diff@4.3.1
  - @lowdefy/operators-js@4.3.1
  - @lowdefy/operators-moment@4.3.1
  - @lowdefy/operators-mql@4.3.1
  - @lowdefy/operators-nunjucks@4.3.1
  - @lowdefy/operators-uuid@4.3.1
  - @lowdefy/operators-yaml@4.3.1
  - @lowdefy/plugin-next-auth@4.3.1
  - @lowdefy/block-utils@4.3.1
  - @lowdefy/helpers@4.3.1
  - @lowdefy/node-utils@4.3.1

## 4.3.0

### Patch Changes

- fe1347f6d: VSCode extention to read activeAppRoot from local dev server for clickable \_ref links.
  - @lowdefy/api@4.3.0
  - @lowdefy/build@4.3.0
  - @lowdefy/client@4.3.0
  - @lowdefy/engine@4.3.0
  - @lowdefy/layout@4.3.0
  - @lowdefy/actions-core@4.3.0
  - @lowdefy/blocks-aggrid@4.3.0
  - @lowdefy/blocks-antd@4.3.0
  - @lowdefy/blocks-basic@4.3.0
  - @lowdefy/blocks-color-selectors@4.3.0
  - @lowdefy/blocks-echarts@4.3.0
  - @lowdefy/blocks-loaders@4.3.0
  - @lowdefy/blocks-markdown@4.3.0
  - @lowdefy/blocks-qr@4.3.0
  - @lowdefy/connection-axios-http@4.3.0
  - @lowdefy/operators-change-case@4.3.0
  - @lowdefy/operators-diff@4.3.0
  - @lowdefy/operators-js@4.3.0
  - @lowdefy/operators-moment@4.3.0
  - @lowdefy/operators-mql@4.3.0
  - @lowdefy/operators-nunjucks@4.3.0
  - @lowdefy/operators-uuid@4.3.0
  - @lowdefy/operators-yaml@4.3.0
  - @lowdefy/plugin-next-auth@4.3.0
  - @lowdefy/block-utils@4.3.0
  - @lowdefy/helpers@4.3.0
  - @lowdefy/node-utils@4.3.0

## 4.2.2

### Patch Changes

- Updated dependencies [e4ec43505]
  - @lowdefy/blocks-antd@4.2.2
  - @lowdefy/build@4.2.2
  - @lowdefy/blocks-color-selectors@4.2.2
  - @lowdefy/api@4.2.2
  - @lowdefy/client@4.2.2
  - @lowdefy/engine@4.2.2
  - @lowdefy/layout@4.2.2
  - @lowdefy/actions-core@4.2.2
  - @lowdefy/blocks-aggrid@4.2.2
  - @lowdefy/blocks-basic@4.2.2
  - @lowdefy/blocks-echarts@4.2.2
  - @lowdefy/blocks-loaders@4.2.2
  - @lowdefy/blocks-markdown@4.2.2
  - @lowdefy/blocks-qr@4.2.2
  - @lowdefy/connection-axios-http@4.2.2
  - @lowdefy/operators-change-case@4.2.2
  - @lowdefy/operators-diff@4.2.2
  - @lowdefy/operators-js@4.2.2
  - @lowdefy/operators-moment@4.2.2
  - @lowdefy/operators-mql@4.2.2
  - @lowdefy/operators-nunjucks@4.2.2
  - @lowdefy/operators-uuid@4.2.2
  - @lowdefy/operators-yaml@4.2.2
  - @lowdefy/plugin-next-auth@4.2.2
  - @lowdefy/block-utils@4.2.2
  - @lowdefy/helpers@4.2.2
  - @lowdefy/node-utils@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/blocks-aggrid@4.2.1
  - @lowdefy/client@4.2.1
  - @lowdefy/layout@4.2.1
  - @lowdefy/api@4.2.1
  - @lowdefy/build@4.2.1
  - @lowdefy/engine@4.2.1
  - @lowdefy/actions-core@4.2.1
  - @lowdefy/blocks-antd@4.2.1
  - @lowdefy/blocks-basic@4.2.1
  - @lowdefy/blocks-color-selectors@4.2.1
  - @lowdefy/blocks-echarts@4.2.1
  - @lowdefy/blocks-loaders@4.2.1
  - @lowdefy/blocks-markdown@4.2.1
  - @lowdefy/blocks-qr@4.2.1
  - @lowdefy/connection-axios-http@4.2.1
  - @lowdefy/operators-change-case@4.2.1
  - @lowdefy/operators-diff@4.2.1
  - @lowdefy/operators-js@4.2.1
  - @lowdefy/operators-moment@4.2.1
  - @lowdefy/operators-mql@4.2.1
  - @lowdefy/operators-nunjucks@4.2.1
  - @lowdefy/operators-uuid@4.2.1
  - @lowdefy/operators-yaml@4.2.1
  - @lowdefy/plugin-next-auth@4.2.1
  - @lowdefy/block-utils@4.2.1
  - @lowdefy/helpers@4.2.1
  - @lowdefy/node-utils@4.2.1

## 4.2.0

### Patch Changes

- Updated dependencies [47d855918]
- Updated dependencies [47d855918]
  - @lowdefy/client@4.2.0
  - @lowdefy/layout@4.2.0
  - @lowdefy/api@4.2.0
  - @lowdefy/build@4.2.0
  - @lowdefy/operators-nunjucks@4.2.0
  - @lowdefy/engine@4.2.0
  - @lowdefy/connection-axios-http@4.2.0
  - @lowdefy/actions-core@4.2.0
  - @lowdefy/blocks-aggrid@4.2.0
  - @lowdefy/blocks-antd@4.2.0
  - @lowdefy/blocks-basic@4.2.0
  - @lowdefy/blocks-color-selectors@4.2.0
  - @lowdefy/blocks-echarts@4.2.0
  - @lowdefy/blocks-loaders@4.2.0
  - @lowdefy/blocks-markdown@4.2.0
  - @lowdefy/blocks-qr@4.2.0
  - @lowdefy/operators-change-case@4.2.0
  - @lowdefy/operators-diff@4.2.0
  - @lowdefy/operators-js@4.2.0
  - @lowdefy/operators-moment@4.2.0
  - @lowdefy/operators-mql@4.2.0
  - @lowdefy/operators-uuid@4.2.0
  - @lowdefy/operators-yaml@4.2.0
  - @lowdefy/plugin-next-auth@4.2.0
  - @lowdefy/block-utils@4.2.0
  - @lowdefy/helpers@4.2.0
  - @lowdefy/node-utils@4.2.0

## 4.1.0

### Patch Changes

- Updated dependencies [221ba93c9]
- Updated dependencies [d040e3005]
- Updated dependencies [f14270465]
- Updated dependencies [f571e90da]
- Updated dependencies [f9d00b4d3]
- Updated dependencies [5b3ccc958]
  - @lowdefy/actions-core@4.1.0
  - @lowdefy/engine@4.1.0
  - @lowdefy/blocks-antd@4.1.0
  - @lowdefy/build@4.1.0
  - @lowdefy/client@4.1.0
  - @lowdefy/blocks-color-selectors@4.1.0
  - @lowdefy/api@4.1.0
  - @lowdefy/layout@4.1.0
  - @lowdefy/blocks-aggrid@4.1.0
  - @lowdefy/blocks-basic@4.1.0
  - @lowdefy/blocks-echarts@4.1.0
  - @lowdefy/blocks-loaders@4.1.0
  - @lowdefy/blocks-markdown@4.1.0
  - @lowdefy/blocks-qr@4.1.0
  - @lowdefy/connection-axios-http@4.1.0
  - @lowdefy/operators-change-case@4.1.0
  - @lowdefy/operators-diff@4.1.0
  - @lowdefy/operators-js@4.1.0
  - @lowdefy/operators-moment@4.1.0
  - @lowdefy/operators-mql@4.1.0
  - @lowdefy/operators-nunjucks@4.1.0
  - @lowdefy/operators-uuid@4.1.0
  - @lowdefy/operators-yaml@4.1.0
  - @lowdefy/plugin-next-auth@4.1.0
  - @lowdefy/block-utils@4.1.0
  - @lowdefy/helpers@4.1.0
  - @lowdefy/node-utils@4.1.0

## 4.0.2

### Patch Changes

- Updated dependencies [628c6e2f6]
- Updated dependencies [126a61267]
- Updated dependencies [126a61267]
- Updated dependencies [7fa709f19]
- Updated dependencies [126a61267]
- Updated dependencies [bbcf07a27]
  - @lowdefy/blocks-antd@4.0.2
  - @lowdefy/blocks-basic@4.0.2
  - @lowdefy/build@4.0.2
  - @lowdefy/blocks-color-selectors@4.0.2
  - @lowdefy/engine@4.0.2
  - @lowdefy/api@4.0.2
  - @lowdefy/client@4.0.2
  - @lowdefy/layout@4.0.2
  - @lowdefy/actions-core@4.0.2
  - @lowdefy/blocks-aggrid@4.0.2
  - @lowdefy/blocks-echarts@4.0.2
  - @lowdefy/blocks-loaders@4.0.2
  - @lowdefy/blocks-markdown@4.0.2
  - @lowdefy/blocks-qr@4.0.2
  - @lowdefy/connection-axios-http@4.0.2
  - @lowdefy/operators-change-case@4.0.2
  - @lowdefy/operators-diff@4.0.2
  - @lowdefy/operators-js@4.0.2
  - @lowdefy/operators-moment@4.0.2
  - @lowdefy/operators-mql@4.0.2
  - @lowdefy/operators-nunjucks@4.0.2
  - @lowdefy/operators-uuid@4.0.2
  - @lowdefy/operators-yaml@4.0.2
  - @lowdefy/plugin-next-auth@4.0.2
  - @lowdefy/block-utils@4.0.2
  - @lowdefy/helpers@4.0.2
  - @lowdefy/node-utils@4.0.2

## 4.0.1

### Patch Changes

- Fix build issue on release.
  - @lowdefy/api@4.0.1
  - @lowdefy/build@4.0.1
  - @lowdefy/client@4.0.1
  - @lowdefy/engine@4.0.1
  - @lowdefy/layout@4.0.1
  - @lowdefy/actions-core@4.0.1
  - @lowdefy/blocks-aggrid@4.0.1
  - @lowdefy/blocks-antd@4.0.1
  - @lowdefy/blocks-basic@4.0.1
  - @lowdefy/blocks-color-selectors@4.0.1
  - @lowdefy/blocks-echarts@4.0.1
  - @lowdefy/blocks-loaders@4.0.1
  - @lowdefy/blocks-markdown@4.0.1
  - @lowdefy/blocks-qr@4.0.1
  - @lowdefy/connection-axios-http@4.0.1
  - @lowdefy/operators-change-case@4.0.1
  - @lowdefy/operators-diff@4.0.1
  - @lowdefy/operators-js@4.0.1
  - @lowdefy/operators-moment@4.0.1
  - @lowdefy/operators-mql@4.0.1
  - @lowdefy/operators-nunjucks@4.0.1
  - @lowdefy/operators-uuid@4.0.1
  - @lowdefy/operators-yaml@4.0.1
  - @lowdefy/plugin-next-auth@4.0.1
  - @lowdefy/block-utils@4.0.1
  - @lowdefy/helpers@4.0.1
  - @lowdefy/node-utils@4.0.1

## 4.0.0

### Minor Changes

- f44cfa0cb: Add built with lowdefy branding to servers.

### Patch Changes

- 0750bf7bc: add NextJs telemetry disabling when Lowdefy telemetry is disabled
- Updated dependencies [a30801983]
- Updated dependencies [925b92f09]
- Updated dependencies [5cfe04a68]
- Updated dependencies [f44cfa0cb]
- Updated dependencies [e694f72ee]
- Updated dependencies [84e479d11]
  - @lowdefy/build@4.0.0
  - @lowdefy/operators-change-case@4.0.0
  - @lowdefy/client@4.0.0
  - @lowdefy/node-utils@4.0.0
  - @lowdefy/engine@4.0.0
  - @lowdefy/api@4.0.0
  - @lowdefy/blocks-antd@4.0.0
  - @lowdefy/layout@4.0.0
  - @lowdefy/actions-core@4.0.0
  - @lowdefy/blocks-aggrid@4.0.0
  - @lowdefy/blocks-basic@4.0.0
  - @lowdefy/blocks-color-selectors@4.0.0
  - @lowdefy/blocks-echarts@4.0.0
  - @lowdefy/blocks-loaders@4.0.0
  - @lowdefy/blocks-markdown@4.0.0
  - @lowdefy/blocks-qr@4.0.0
  - @lowdefy/connection-axios-http@4.0.0
  - @lowdefy/operators-diff@4.0.0
  - @lowdefy/operators-js@4.0.0
  - @lowdefy/operators-moment@4.0.0
  - @lowdefy/operators-mql@4.0.0
  - @lowdefy/operators-nunjucks@4.0.0
  - @lowdefy/operators-uuid@4.0.0
  - @lowdefy/operators-yaml@4.0.0
  - @lowdefy/plugin-next-auth@4.0.0
  - @lowdefy/block-utils@4.0.0
  - @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

### Bug Fixes

- **blocks-antd:** Control tabs using setActiveKey method. ([1d2845c](https://github.com/lowdefy/lowdefy/commit/1d2845c3a73d8cf536fb081f5c61c823ec98375f))
- **deps:** Revert less to 4.1.3. ([ea298c9](https://github.com/lowdefy/lowdefy/commit/ea298c9f49d0a30b7877f28c12cde944e2c1b803))
- Fix server dev plugin dependencies. ([3f14ba0](https://github.com/lowdefy/lowdefy/commit/3f14ba07e121d127bc94462b15b2cae01a911e9d))

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

### Bug Fixes

- **blocks-antd:** Control tabs using setActiveKey method. ([1d2845c](https://github.com/lowdefy/lowdefy/commit/1d2845c3a73d8cf536fb081f5c61c823ec98375f))
- **deps:** Revert less to 4.1.3. ([ea298c9](https://github.com/lowdefy/lowdefy/commit/ea298c9f49d0a30b7877f28c12cde944e2c1b803))

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Update dependency dotenv to v16.3.1 ([82c1f7a](https://github.com/lowdefy/lowdefy/commit/82c1f7aa168cacab4197326c4f000a00e22761fb))
- **deps:** Update dependency next to v13.5.4. ([230a687](https://github.com/lowdefy/lowdefy/commit/230a6876993a0802190a7f33d823fe5630062da9))
- **deps:** Update dependency next-auth to v4.23.1 ([48f9780](https://github.com/lowdefy/lowdefy/commit/48f97809e825fb9afdd169120371184b3e2a98c8))
- **deps:** Update dependency pino to v8.15.0 ([d380b3c](https://github.com/lowdefy/lowdefy/commit/d380b3cfa51387f1602689e353f82c59dc1cd9ed))
- **deps:** Update dependency react-icons to v4.11.0 ([21f23d4](https://github.com/lowdefy/lowdefy/commit/21f23d40cf0a7c4ed1931b55ebf854b2bc239948))
- **deps:** Update dependency swr to v2.2.2 ([017e865](https://github.com/lowdefy/lowdefy/commit/017e865023edafeb52428466d8fa7e0c2b96b9f2))
- **deps:** Update dependency yaml to 2.3.2 ([cbcdc7d](https://github.com/lowdefy/lowdefy/commit/cbcdc7d3e313fca96fa52bc4724344a061d9f444))
- **deps:** Update development dependencies. ([b7d7cca](https://github.com/lowdefy/lowdefy/commit/b7d7cca10e676949957cf6650ec706ab1a08f68a))
- **server-dev:** Update stdOutLineHandler for pino logs ([2cef6d7](https://github.com/lowdefy/lowdefy/commit/2cef6d7e66d8ef7a34d9dec5eb1d6aea2fdb4f3f))
- Update to Next 13 and update Link. ([33c34c3](https://github.com/lowdefy/lowdefy/commit/33c34c3b5b10973bd749b7dc806210aa7d92dbda))

### Features

- **blocks-algolia:** Add DocSearch block. ([701ee87](https://github.com/lowdefy/lowdefy/commit/701ee87ec7f3e5f2b28568e43c14948548b90d9e))
- Update minimum node version to 18 ([0b64fd1](https://github.com/lowdefy/lowdefy/commit/0b64fd1347fc807d79819cc9c2022671088c8921))

### BREAKING CHANGES

- Update minimum node version to 18

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- Logging cleanup. ([30a495c](https://github.com/lowdefy/lowdefy/commit/30a495c3e40fe566af306b54d7c8ece3c79de1b9))

### Features

- **server-dev:** Log errors in dev server. ([cacdc12](https://github.com/lowdefy/lowdefy/commit/cacdc12a3b3773603d61487089ae7061cb483af3))
- Update dev server to work with logger. ([f036a62](https://github.com/lowdefy/lowdefy/commit/f036a623067bdcc225d37137511baacd4f317535))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

### Bug Fixes

- Update serializer util to not clash with \_date operator ([b8cdcb3](https://github.com/lowdefy/lowdefy/commit/b8cdcb3e44a0b1157c111bc7679ac428138c6f97))

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- Add 200 response on auth API head requests ([d51e28f](https://github.com/lowdefy/lowdefy/commit/d51e28f99e9051ca7aba90c05fc325074b08469c))
- **deps:** update dependency yaml to v2.2.2 [security] ([8e015fe](https://github.com/lowdefy/lowdefy/commit/8e015fec47a40bc5233f23d8da345720475d1232))
- Fix initialisation of lowdefy context object. ([2ed4398](https://github.com/lowdefy/lowdefy/commit/2ed4398d59be5b037e7a4d17f7e5a14398e73973))
- Fix next auth session provider base path ([715cdf2](https://github.com/lowdefy/lowdefy/commit/715cdf2cc48da88a55055c4af28435aa789f67ea))
- Fix web manifest and icons with base path. ([9620a2c](https://github.com/lowdefy/lowdefy/commit/9620a2c80133ebcbaedbe08d66fb1387a3fb38f1))
- Reload page if auth session expires ([6223783](https://github.com/lowdefy/lowdefy/commit/6223783b84892f8c9469ee740417ccca1004a16b))
- Server session not passed to session provider ([36f8d5a](https://github.com/lowdefy/lowdefy/commit/36f8d5ae15b0a6aae58fd6b4cab955f91a2d93e7))

### Features

- **actions-core:** Add UpdateSession action. ([c5d6011](https://github.com/lowdefy/lowdefy/commit/c5d601151acbdb791aaf1304ae95b0ccb18b8c03))
- Remove support for setting base path using an environment variable ([ec7052d](https://github.com/lowdefy/lowdefy/commit/ec7052dab152645b4a5ed9098320e46488041034))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **deps:** update dependency next-auth to v4.20.1 [security] ([bcf12a3](https://github.com/lowdefy/lowdefy/commit/bcf12a37ae4fa921abcd6f943e14ace2fd0c5eb8))
- **deps:** update dependency next-auth to v4.20.1 [security] ([7e408a2](https://github.com/lowdefy/lowdefy/commit/7e408a2095e73dca79b9777217aec37e11d4cba3))
- Rename depreciated unstable_getServerSession. ([7dcb0c6](https://github.com/lowdefy/lowdefy/commit/7dcb0c665969bafdf03e082389c9101d00146636))
- **server-dev:** Update reinstall dependencies warning message ([86f4b9f](https://github.com/lowdefy/lowdefy/commit/86f4b9fa0dadac468a97b9aa4169a7ae62a71fc9))

### Features

- **server-dev:** Add building config spinner. ([45fd3f3](https://github.com/lowdefy/lowdefy/commit/45fd3f39ef7d46163b16618a2712c33b1f78c8ac))
- **server-dev:** Ignore _k_ on rebuild check. ([32d89b1](https://github.com/lowdefy/lowdefy/commit/32d89b14755400b1858d8d1d8a1da2e5f32d9658))
- **server-dev:** Only watch package.json. ([cbb1bc6](https://github.com/lowdefy/lowdefy/commit/cbb1bc6ce930c8c1de9e7e5790c46e2d21ff21c7))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

### Bug Fixes

- Add public_default folder to server npm files ([2f1db67](https://github.com/lowdefy/lowdefy/commit/2f1db674f477026d2292d643140dc39b77809753))

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **deps:** Update minor versions of util packages. ([2d7a2a5](https://github.com/lowdefy/lowdefy/commit/2d7a2a55c88f0ee33eff49e5ff541f6296ec4337))
- **deps:** Update patch versions of dependencies ([9edaef7](https://github.com/lowdefy/lowdefy/commit/9edaef7e1aa940ff8aa795e60c25fb6369244ca9))
- **deps:** Update react-icon and add support for new icon packs ([ae9cbf2](https://github.com/lowdefy/lowdefy/commit/ae9cbf23a331ce2945d9e2ff34a53210121c9134))
- **deps:** Update swr to v2.0.0 (major version). ([e16a39a](https://github.com/lowdefy/lowdefy/commit/e16a39a581034e1108ad45d39e26f73c43db7574))
- Reset server package.json to original version on CLI start. ([6fac2aa](https://github.com/lowdefy/lowdefy/commit/6fac2aabc8a8e4d95e6ad0922ff3b82f73427a30))
- **server-dev:** Rename public folder to public_default. ([4bb4285](https://github.com/lowdefy/lowdefy/commit/4bb4285bc5c66fbf19c083618b73871278894253))

### Features

- Update dependency next-auth and add new providers. ([ca72d8c](https://github.com/lowdefy/lowdefy/commit/ca72d8c87b50651c701ea619a5e061210adf3e53))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

### Bug Fixes

- Fix watch path CLI config for relative paths. ([54a5440](https://github.com/lowdefy/lowdefy/commit/54a54409dc5e123c5d1d875770873c72826eec90))

### Features

- Add support for user defined style files ([d33049b](https://github.com/lowdefy/lowdefy/commit/d33049b1b95f6bc84c9b91c2d15b92601210615e))
- Remove support for config.theme.lessVariables ([53a6931](https://github.com/lowdefy/lowdefy/commit/53a693146d1299cff45c81dcefa1315d530b7d98))

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

### Bug Fixes

- Cache API file reads across all requests. ([2b90efb](https://github.com/lowdefy/lowdefy/commit/2b90efb041cf43e5344c5f2f5a8630ae06c8aad6))

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

### Bug Fixes

- **api:** Fix "too many files open" error in api. ([b2d0b63](https://github.com/lowdefy/lowdefy/commit/b2d0b63cceac0b2b3dc870a8b435c6f187ff7a5a))

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

### Bug Fixes

- Fix server pnpm installs. ([c7be221](https://github.com/lowdefy/lowdefy/commit/c7be22150ed14afcb8b6508bd771112a542e0a26))

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

### Features

- Change CLI to use pnpm as package manager. ([e9d7d73](https://github.com/lowdefy/lowdefy/commit/e9d7d73aed2fc9d40699210f2f8846df0170d481))

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

### Bug Fixes

- **server:** Move viewport setting to the \_document. ([4471e49](https://github.com/lowdefy/lowdefy/commit/4471e499cd384491df493c0be6095e27af3a003b))
- **server:** Set page viewport. ([9c05a6d](https://github.com/lowdefy/lowdefy/commit/9c05a6d8d7cc16c723089c6499005945fc2a5aaa))

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

### Features

- **blocks-qr:** Add QRScanner block. ([5778234](https://github.com/lowdefy/lowdefy/commit/5778234f366a030d055f0e1a604cfa27f47617ac))

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

### Bug Fixes

- **server-dev:** Fix server dev file watchers. ([7e3fedd](https://github.com/lowdefy/lowdefy/commit/7e3feddffe017edefcc325a8a146918318a8b329))

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

### Bug Fixes

- **cli:** Improve CLI options specification. ([6d550fd](https://github.com/lowdefy/lowdefy/commit/6d550fd4620cde2ded905c3946ed86500c3efed5))
- Fix dev server auth api route. ([a51af68](https://github.com/lowdefy/lowdefy/commit/a51af68e6291eea9185f65425e480ace6a269103))
- **server-dev:** Remove build retries. ([c27ff36](https://github.com/lowdefy/lowdefy/commit/c27ff36e174f085d00bc0c76f2e2c3d8d2ad9bd2))
- **server-dev:** Simplify server-dev manager code. ([e4101d0](https://github.com/lowdefy/lowdefy/commit/e4101d019b47d8cf1d5065116f003bcdf8a38fdf))

### Features

- Cleanup dev server logs. ([27a22c8](https://github.com/lowdefy/lowdefy/commit/27a22c8d34b822268a834704fe9c022397180386))
- CLI output improvements. ([f00bb9b](https://github.com/lowdefy/lowdefy/commit/f00bb9b32e03e77ef1ef19c69055da4b05880cd8))
- **cli:** Add log level option. ([5903c8e](https://github.com/lowdefy/lowdefy/commit/5903c8e4165334eb31f80580c3816a34ac36592d))
- Improved logging WIP. ([0bbf19d](https://github.com/lowdefy/lowdefy/commit/0bbf19d69926440930995d457514544608ec5b5b))
- **server-dev:** Do not stop process if initial build fails. ([506cbeb](https://github.com/lowdefy/lowdefy/commit/506cbeb090b130cacbbb923aa0fa8d0e3a48ad5a))

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Bug Fixes

- Fix next-auth getServerSession. ([c5ee6ae](https://github.com/lowdefy/lowdefy/commit/c5ee6aef6227b68786b955d83de2a4f733569225))

### Features

- Add support for auth adapters in build and servers. ([5ae6e2b](https://github.com/lowdefy/lowdefy/commit/5ae6e2bb232f5ad634d92b171887066a6f0a57a0))
- Add support for Next-Auth adapters. ([337dbf4](https://github.com/lowdefy/lowdefy/commit/337dbf46278ee8306b603a13357c14130cd6c3e9))
- Implement appendHead and appendBody in v4. ([ba7ef7d](https://github.com/lowdefy/lowdefy/commit/ba7ef7d4000bb0ba757092114a90979387daba8a)), closes [#1047](https://github.com/lowdefy/lowdefy/issues/1047)
- Implement appendHead and appendBody. ([d9ae2ee](https://github.com/lowdefy/lowdefy/commit/d9ae2eef8ef848f335901dd1332b8d995c03bdb0))
- Update next-auth. ([972d5f3](https://github.com/lowdefy/lowdefy/commit/972d5f30ce57886419bc26fd5f19e386418e3dbb))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

### Features

- Add support for auth adapters in build and servers. ([5ae6e2b](https://github.com/lowdefy/lowdefy/commit/5ae6e2bb232f5ad634d92b171887066a6f0a57a0))
- Add support for Next-Auth adapters. ([337dbf4](https://github.com/lowdefy/lowdefy/commit/337dbf46278ee8306b603a13357c14130cd6c3e9))
- Implement appendHead and appendBody in v4. ([ba7ef7d](https://github.com/lowdefy/lowdefy/commit/ba7ef7d4000bb0ba757092114a90979387daba8a)), closes [#1047](https://github.com/lowdefy/lowdefy/issues/1047)
- Implement appendHead and appendBody. ([d9ae2ee](https://github.com/lowdefy/lowdefy/commit/d9ae2eef8ef848f335901dd1332b8d995c03bdb0))

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

### Bug Fixes

- **server-dev:** BatchChanges.newChange to only revolve for strings. ([30a78fb](https://github.com/lowdefy/lowdefy/commit/30a78fbf77b483cb3b039f4ead11004b604346bc))

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

### Bug Fixes

- **deps:** update dependency next-auth to v4.9.0 [security] ([7d07007](https://github.com/lowdefy/lowdefy/commit/7d070078ef171f308359f7cfd534d8a207f76956))

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

### Bug Fixes

- **deps:** Update dependency next-auth to v4.5.0. ([49dd43a](https://github.com/lowdefy/lowdefy/commit/49dd43ae4249129d029fbd8d1135d00fb26a5b7a))
- Fix userFields in production server. ([614d7c9](https://github.com/lowdefy/lowdefy/commit/614d7c915d20c12ad285336a8d6fd0c942c11c48))
- **server-dev:** Add max count in waitForRestartedServer ping. ([d7d8a0b](https://github.com/lowdefy/lowdefy/commit/d7d8a0b221322171096929954376b87d7c8ce838))
- **server-dev:** Should not be minified. ([d61e9e0](https://github.com/lowdefy/lowdefy/commit/d61e9e0db4de869390e3f1992cc30f826a40ec93))

### Features

- Add userFields feature to map auth provider data to usernobject. ([0ab688b](https://github.com/lowdefy/lowdefy/commit/0ab688b7f2c153cd904160a28c91c0581b6e1e07))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

### Bug Fixes

- **deps:** Update dependency next-auth to v4.5.0. ([49dd43a](https://github.com/lowdefy/lowdefy/commit/49dd43ae4249129d029fbd8d1135d00fb26a5b7a))
- Fix userFields in production server. ([614d7c9](https://github.com/lowdefy/lowdefy/commit/614d7c915d20c12ad285336a8d6fd0c942c11c48))
- **server-dev:** Add max count in waitForRestartedServer ping. ([d7d8a0b](https://github.com/lowdefy/lowdefy/commit/d7d8a0b221322171096929954376b87d7c8ce838))

### Features

- Add userFields feature to map auth provider data to usernobject. ([0ab688b](https://github.com/lowdefy/lowdefy/commit/0ab688b7f2c153cd904160a28c91c0581b6e1e07))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Fix auth errors if auth is not configured. ([8a386a8](https://github.com/lowdefy/lowdefy/commit/8a386a867ca92f313b74f785477a48cd7c9a1679))
- **server-dev:** Load .env using dotenv. ([85d7827](https://github.com/lowdefy/lowdefy/commit/85d78277b29e12986a5886e986bd46070c7b28ac))

### Features

- **cli:** Add —no-open option to cli dev command. ([bc5b12f](https://github.com/lowdefy/lowdefy/commit/bc5b12fce379352e6cbf73503154e88b980918e6))
- **engine:** Add payload and blockId to context.requests[requestId]. ([e29d88b](https://github.com/lowdefy/lowdefy/commit/e29d88b326338fdec22db325dcda31ee4f73cf51))
- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- Package Updates. ([0f9d8cd](https://github.com/lowdefy/lowdefy/commit/0f9d8cd89186e12c66e5f833c13c12472f52eaee))
- React 18 update. ([55268e7](https://github.com/lowdefy/lowdefy/commit/55268e74ea08544ce816e85e205cd2093e0f2319))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

### Bug Fixes

- **server-dev:** Fix react hooks used incorrectly. ([0b36cc2](https://github.com/lowdefy/lowdefy/commit/0b36cc20984f48fc53993c51cbaef3bf05133c9d))

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

### Bug Fixes

- Adapt createAuthMethods for client package. ([4675297](https://github.com/lowdefy/lowdefy/commit/467529780bc1c90a089f6b157e264e5fbe10ca63))
- Auth bug fixes. ([3fe249c](https://github.com/lowdefy/lowdefy/commit/3fe249c36e86fe943227f6df4f115d9386ab935b))
- **deps:** Update dependency next to v12.1.6 ([490ea8f](https://github.com/lowdefy/lowdefy/commit/490ea8fda5bc1892eb44ad371b2d95c99ea618fd))
- Fix auth callback import in dev server. ([557669e](https://github.com/lowdefy/lowdefy/commit/557669e79838521f719c64d5addee8c7c4d1547a))
- Remove console logs. ([42ab05b](https://github.com/lowdefy/lowdefy/commit/42ab05bb649c4a9fc8d020ea1591fe6b37c8304b))
- **server-dev:** Fix dev server not running next build. ([27efcdf](https://github.com/lowdefy/lowdefy/commit/27efcdf8c5bc6a0f7c6a0b33ceb8e56ea2114a5a))
- Update operator plugin import locations. ([b65aa48](https://github.com/lowdefy/lowdefy/commit/b65aa482a3de39a6406b2a0948b6b502c84e0498))
- Windows compatibility fixes. ([8ecdfc4](https://github.com/lowdefy/lowdefy/commit/8ecdfc4e377648761e9035e355c7ec777fd63888))

### Features

- Add support for auth callback plugins. ([a16e074](https://github.com/lowdefy/lowdefy/commit/a16e074ca801a5e9e05424fc09cb8c1e1da81cee))
- Create auth plugins types maps. ([6df0010](https://github.com/lowdefy/lowdefy/commit/6df00102032648a3b8d958828a4b5e853cd38da3))
- Import all types exported by plugins in dev server. ([b6e05fb](https://github.com/lowdefy/lowdefy/commit/b6e05fba4479417d9bc8019782b93f8c83515066))
- Include auth event plugins in build. ([4c6d108](https://github.com/lowdefy/lowdefy/commit/4c6d108dffc98a90b9ec0268fe91fb8102cb15de))
- Next auth login and logout working. ([d47f9e5](https://github.com/lowdefy/lowdefy/commit/d47f9e56cd6da7827499ef9cf248dfc64f8bd12b))
- Pass user session to api context from server. ([55f2438](https://github.com/lowdefy/lowdefy/commit/55f2438258bf8bad4b9f03647a00b8f730cacb79))
- **server-dev:** Next auth working in dev server. ([44fbca9](https://github.com/lowdefy/lowdefy/commit/44fbca96e28e4d72f1a406ea122b101016baa3b9))
- Updates to auth configuration. ([8f7abf7](https://github.com/lowdefy/lowdefy/commit/8f7abf7fdb1cbe0dbaabe209787a128854680f7b))

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

### Bug Fixes

- Fix server npm publish files. ([3f5589e](https://github.com/lowdefy/lowdefy/commit/3f5589e434817e712624e31c955b0b741e94f075))

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **server-dev:** Add actions.js to build watcher. ([f9f295e](https://github.com/lowdefy/lowdefy/commit/f9f295e37cc627e1f7f2d414d9e42c7c67f45f23))
- **server-dev:** Do not render page before redirect. ([b4431b1](https://github.com/lowdefy/lowdefy/commit/b4431b17b36576cfc8cd30a5d1e2485502fd337e))
- **server-dev:** Render app rebuild page. ([7895b53](https://github.com/lowdefy/lowdefy/commit/7895b53691f83b81629c2f4dfb174c858571c407))
- **server:** Cleanup from review. ([d4dd1ca](https://github.com/lowdefy/lowdefy/commit/d4dd1cadf30ddc1f9b9700bd8c5699675607c117))
- **server:** Remove block.loading. ([0995109](https://github.com/lowdefy/lowdefy/commit/09951094e15371ed9be1b36a093d0463ec0b8d70))

### Features

- **server-dev:** Client working 🏄‍♂️ ([cafca66](https://github.com/lowdefy/lowdefy/commit/cafca662ee00379ba1d7d38acf886e718174d624))
- **server-dev:** Reload to pass resetContext flag. ([f303bc0](https://github.com/lowdefy/lowdefy/commit/f303bc046164c0d0370af66c3f7741eb04d7a93c))
- **server-dev:** Use Client in dev server. ([4089191](https://github.com/lowdefy/lowdefy/commit/4089191bc84b5e8832e358136c491985872d59fc))
- **server:** Context is now sync, use MountEvents for onInit. ([8f0ed25](https://github.com/lowdefy/lowdefy/commit/8f0ed25401f0f4cb2ee342c6511513f182ab65f5))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- Revert back to react 17.0.2. ([1b38fd3](https://github.com/lowdefy/lowdefy/commit/1b38fd3e743ee7286468c7c1e2f623838dd5ed84))
- **server-dev:** Read next cli bin path from package.json. ([0146627](https://github.com/lowdefy/lowdefy/commit/01466276dcfffef1ee6f2d7b50205ddd4e48edad))
- **server:** Add index to keys to resolve react warning. ([0f25b57](https://github.com/lowdefy/lowdefy/commit/0f25b5768f09327f68703b80f63f891b1645b1e3))
- **server:** Disable ssr on \_app. ([1b13e57](https://github.com/lowdefy/lowdefy/commit/1b13e5715c29783b076878ad935626a05f7ba343))

### Features

- Custom plugins on dev server. ([9f65d13](https://github.com/lowdefy/lowdefy/commit/9f65d130d70494ebd74fb0ae3cf6edb4cbf31415))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **deps:** Downgrade dependency swr to v1.1.2. ([80b047f](https://github.com/lowdefy/lowdefy/commit/80b047fb8e5684d032026d9e10b50114a67af89f))
- **deps:** Update dependecy next to v12.0.10 ([c058935](https://github.com/lowdefy/lowdefy/commit/c05893578f8d5f625391b560ec24411d16df902d))
- **deps:** Update dependency chokidar to v3.5.3. ([4513321](https://github.com/lowdefy/lowdefy/commit/45133218d83e9751746e1c71c6f9fa44a5b50ead))
- **deps:** Update dependency dotenv to v15.0.0. ([682620c](https://github.com/lowdefy/lowdefy/commit/682620c99c0e53d31467b6c3d5146f0eba596ab1))
- **deps:** Update dependency next-auth to v4.1.2. ([4b63c87](https://github.com/lowdefy/lowdefy/commit/4b63c8774fab7adbc3e11f92a5e808b38d22f4c9))
- **deps:** Update dependency next-with-less to v2.0.4. ([7c71492](https://github.com/lowdefy/lowdefy/commit/7c714926ee0caeba362af78b594698635f34c70f))
- **deps:** Update dependency react to v18.0.0-rc.0 ([2345330](https://github.com/lowdefy/lowdefy/commit/23453301716f541a1e044f63a740aae09d635237))
- **deps:** Update dependency swr to v1.2.0. ([8c55376](https://github.com/lowdefy/lowdefy/commit/8c55376080ea89f015f208262c097e5201c21d79))
- **deps:** Update dependency yargs to v17.3.1. ([277776c](https://github.com/lowdefy/lowdefy/commit/277776c7294e57a95dfcf86d300bb20ea4742043))
- **node-utils:** Convert writeFile function prototype. ([5371430](https://github.com/lowdefy/lowdefy/commit/53714307123f3477240767a91c5332a70a292d93))
- **server-dev:** Add dev server manager description. ([18cf9c2](https://github.com/lowdefy/lowdefy/commit/18cf9c2941f0001d98eed5c79dac2b111f6c6eee))
- **server-dev:** Do not error if .env file does not exist. ([fa389a1](https://github.com/lowdefy/lowdefy/commit/fa389a17eff8d716e4cc45c1262f4e3d69bdb71d))
- **server-dev:** Fix redirect. ([96ed764](https://github.com/lowdefy/lowdefy/commit/96ed764458ebed076d5bee246622c2fb457d9f33))
- **servr-dev:** Fix 404 redirect so that browser back works. ([9df6579](https://github.com/lowdefy/lowdefy/commit/9df6579198c0dd0aef9092a98c1b455fac41a761))

### Features

- Add start, start:dev and start:server-dev scripts for easy dev ⚡️. ([da813c3](https://github.com/lowdefy/lowdefy/commit/da813c3d13b39fcfdbd50b8d53c3e0b1f5e7e8e2))
- Add watch and ignore paths, default ref resolver to dev server and build. ([c700d9f](https://github.com/lowdefy/lowdefy/commit/c700d9fb0efbdb20dcfe5f8916e256de81acd79e))
- **build:** Add buildPath to config. ([1cce024](https://github.com/lowdefy/lowdefy/commit/1cce024339bc89e4192d86f09d1a9ec233663f02))
- **cli:** Pass package manager setting to dev server. ([0425f07](https://github.com/lowdefy/lowdefy/commit/0425f07e4ada328e76488e3ec0aa164ff475df5c))
- Link and basePath implementation for dev server. ([d487a1c](https://github.com/lowdefy/lowdefy/commit/d487a1c7fd496d4342a786ec7c96da13bafafc12))
- **operators:** Change dependancy from js-yaml to yaml. ([cbb71d8](https://github.com/lowdefy/lowdefy/commit/cbb71d809b3117dbaf89b23c17a2229a24235308))
- **server-dev:** Add .env and lowdefy version watchers. ([bc52268](https://github.com/lowdefy/lowdefy/commit/bc522684abce8c050873ef20a3da66ca023cfa32))
- **server-dev:** Add port setting to server-dev. ([f5b0e7e](https://github.com/lowdefy/lowdefy/commit/f5b0e7e80f8a6002e6d6c6ea426a2b6fee8953bf))
- **server-dev:** Added import for actions plugins to the lowdefy context. ([20133bb](https://github.com/lowdefy/lowdefy/commit/20133bb0589d35b1494cd3f996ff0ea5421ee560))
- **server-dev:** Clean up server-dev manager. ([ad3511c](https://github.com/lowdefy/lowdefy/commit/ad3511cce781bdcaf4cba634c87ed541e07b0123))
- **server-dev:** Dev server plugin install and next build working. ([cf66a6f](https://github.com/lowdefy/lowdefy/commit/cf66a6f83952016b4282985b44f8eb10e7f72ea4))
- **server-dev:** Optimise dev server next build time. ([34aa84a](https://github.com/lowdefy/lowdefy/commit/34aa84acf92288ecbada387ecf9c7eefc1c0968e))
- **server-dev:** Skip calling next and lowdefy build using npm/yarn start. ([1a8699a](https://github.com/lowdefy/lowdefy/commit/1a8699a0124ba45202cc4d57255d5d0d6ff6abb7))

### BREAKING CHANGES

- **operators:** \_yaml.parse now takes an array or an object data instead of a string.
- **deps:** # marks the beginning of a comment in .env files (UNLESS the value is wrapped in quotes. Please update your .env files to wrap in quotes any values containing #.

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

### Features

- Add secrets to v4 servers ([9ef2ccd](https://github.com/lowdefy/lowdefy/commit/9ef2ccd131149e72ba87aee20f1720a99dbd9e07))
- Add server manager and file watcher in reload event stream. ([8474aaf](https://github.com/lowdefy/lowdefy/commit/8474aaf63c0475cb19a76ca3df9459c05f263986))
- Add Server Sent Event reload rout and component. ([a556eab](https://github.com/lowdefy/lowdefy/commit/a556eabdbb4da2e98088e810b3cc24cccefacd4f))
- **build:** Move app.style.lessVariables to config.theme.lessVariables. ([cb14f17](https://github.com/lowdefy/lowdefy/commit/cb14f1712f9f064e96d2f71bf12bb3922aff46eb))
- **cli:** Add v4 dev command to CLI. ([02770f5](https://github.com/lowdefy/lowdefy/commit/02770f57096710afc9047403e5e4a616957c3a93))
- Create wait helper function. ([42c09f4](https://github.com/lowdefy/lowdefy/commit/42c09f467b3d4a3b51298a2a67364137def7896d))
- Init @lowdefy/server-dev package. ([e76b40e](https://github.com/lowdefy/lowdefy/commit/e76b40e8399567bda70404dc85f06c6c2db7e837))
- **server-dev:** Add browser opener to dev server. ([ddf9d36](https://github.com/lowdefy/lowdefy/commit/ddf9d36d8689caf30f4d008e1ec2be0c48699a34))
- **server-dev:** Add dev server startup and config file watcher. ([a29576d](https://github.com/lowdefy/lowdefy/commit/a29576d45e58720f02896e5d0523f728fad036a5))
- **server-dev:** Add the abilty to restart the dev server. ([b610a63](https://github.com/lowdefy/lowdefy/commit/b610a63a522afebe66dee8481cf8caf029334201))
- **server-dev:** Dev server soft reload working. ([dd5ee07](https://github.com/lowdefy/lowdefy/commit/dd5ee07b5b39c3c22e702b5b1c8404e7a86ab500))
- **server-dev:** Fetch Lowdefy config client-side using swr. ([ce126df](https://github.com/lowdefy/lowdefy/commit/ce126df4374d74a27a2a40439aa1bf56a63723f5))
- **server-dev:** Reload client window if dev server is restarted. ([b8c1d58](https://github.com/lowdefy/lowdefy/commit/b8c1d58ea8b0056fdd9ce042590f7c7f90bcc439))
- **server-dev:** Updates to dev server manager. ([b4861d0](https://github.com/lowdefy/lowdefy/commit/b4861d0892ee9a91ff49b3bb72498d8c42c02778))
