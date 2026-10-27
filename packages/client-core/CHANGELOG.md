# @lowdefy/client-core

## 7.2.0

### Minor Changes

- 4d72041: refactor(client): Move the platform-free client into @lowdefy/client-core

  The request, API call, error handling, page lifecycle, storage, websocket and auth code the web client and native shells share now lives in the new `@lowdefy/client-core`, which `@lowdefy/client` depends on. Web apps behave as before. A plugin that deep-imported one of these files from `@lowdefy/client` (such as `@lowdefy/client/request.js`, `createCallRequest.js`, `createHandleError.js`, `getContextKey.js`, `storage/*`, `websocket/*` or `auth/*`) imports it from `@lowdefy/client-core` instead.

- 29fd1a6: feat(shell): Lowdefy Dev fakes device results for agents and records what you do on the phone

  - The dev-tab client answers `inject` requests: the next scan, photo or NFC read, a location or a route of them, a permission answer, and network offline or online. While offline, every fetch the app makes fails as it does with no network. Push injection is refused until the shell carries `expo-notifications`.
  - Device actions read injections through one helper, `injected(name)`, which returns nothing in a release shell. `GeolocationCurrentPosition` answers on the phone with an injected location, or a denied permission, in the web action's shape.
  - Lowdefy Dev records clicks, changes, Enter presses and page views by block id in the web recorder's record shape, labelled with the device and shell version, so `lowdefy journeys session` lists and prints phone sessions. Password inputs are never recorded.
  - The engine trace gains `reportInteraction` and `subscribeInteractions`, and the native renderer reports block presses and changes through them. The recorder's record building moves to `@lowdefy/client-core`, shared by the web and phone recorders.
  - A release shell no longer links `expo-sensors`, `react-native-view-shot` or, unless its shell config's `capabilities` include `camera`, `expo-camera`, and asks for none of their permissions. `check:release-bundle` runs `expo prebuild` and fails a release shell that still links them or asks for the camera it does not need.

- 5b19a85: feat: The phone sign-in sheet's one-time token is bound to PKCE

  `/auth/mobile` now requires a PKCE challenge (RFC 7636, S256): `code_challenge`, the 43-character base64url SHA-256 of the shell's code verifier, and `code_challenge_method=S256`. Without them it answers 400. The challenge is stored with the one-time token, and `/api/auth/one-time-token/verify` exchanges the token only when the request also sends `code_verifier`, the verifier the challenge was made from. A missing or wrong verifier is refused and burns the token, so a token another app catches from the shell's custom scheme on Android cannot be exchanged.

  `createPkceChallenge({ verifierBytes, sha256 })` in `@lowdefy/client-core` makes the verifier and challenge from random bytes and the platform's SHA-256.

- 2ce6fa5: feat(mobile): Offline request queue for `offline: queue` requests

  A request with `offline: queue` is kept by a mobile shell while it has no signal, or when the send fails for the network, and sent in order when the signal returns or the app starts. The action resolves with `{ queued: true, id }`. The payload is evaluated once, when the action runs, and sent unchanged, so a `_uuid` in the payload is a stable idempotency key. A 2xx removes the request; any other server answer marks it failed with the server's message until `RetryRequestQueue` or `DiscardQueuedRequest`. The `onRequestQueue` app event and `GetRequestQueue` report `{ pending, failed, items }`. Sign-out clears the queue. On the web the key is ignored. The engine passes the request's `offline` to the core's `callRequest`, which sends it through a host's `requestQueue` when the host has one.

### Patch Changes

- 10903fd: fix(client-core): `_media` picks up the real window size when a hidden tab is shown

  A page that loads in a hidden or background browser tab reads a window width of 0, so blocks that use `_media` show the narrowest (`xs`) layout. They only moved to the real size when a resize event reached the page, and the page starts listening for resizes after its `onInit` finishes. A tab shown while `onInit` was still running, or a browser that did not fire resize on showing the tab, left the page on the `xs` layout until the window was resized by hand. The page now re-reads the window size when it starts listening and whenever it becomes visible.

- 7416223: fix(server, shell, client-core, build, api): Native faults reach the server log, and mobile config reports every error

  The production `/api/client-error` route now admits a phone shell's report, which carries no `Origin`, so native faults are logged instead of refused with a 403; a cross-site browser post is still refused. The log line names the surface (`mobile` with the shell version, or `web`). The shell decodes a server error the way the web client does (`decodeErrorBody`, now exported by `@lowdefy/client-core`), so it keeps its class, request id and dev error, and an auth refusal stays an expected outcome. Shell faults that were swallowed (a failed sync, page load, push token registration, background fetch, widget or tracking post, app event) are reported through the core's `handleError`, and a render fault outside a block shows a retry screen instead of closing the app. A network failure is marked where the platform's fetch rejects, so a programming fault is no longer queued as "waiting for network". Sign-in shows "Could not reach the app's server" only for a network failure, a web page that could not be opened is no longer shown as "not found", and a dev page whose plugins are still installing is never cached. Camera, microphone, calendar and location refusals are `UserError`s. The browser error handler's seen set is capped at 500 keys. A mobile sign-in refused by the organization policy is logged as BetterAuth's own refusals are. `lowdefy build` now reports every error in the `mobile` section at once instead of stopping at the first, and a shell's `shell.json` url must be absolute.

- Updated dependencies [029208c]
- Updated dependencies [9419d09]
- Updated dependencies [df6fa3c]
- Updated dependencies [31d7de8]
- Updated dependencies [29fd1a6]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [2ce6fa5]
- Updated dependencies [bb7c249]
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [7aec569]
- Updated dependencies [b1d42ca]
  - @lowdefy/engine@7.2.0
  - @lowdefy/errors@7.2.0
  - @lowdefy/helpers@7.2.0
  - @lowdefy/logger@7.2.0
