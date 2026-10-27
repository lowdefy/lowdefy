---
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/client-core': patch
'@lowdefy/client-native': patch
'@lowdefy/server': patch
'@lowdefy/shell': patch
---

fix(server, shell, client-core, build, api): Native faults reach the server log, and mobile config reports every error

The production `/api/client-error` route now admits a phone shell's report, which carries no `Origin`, so native faults are logged instead of refused with a 403; a cross-site browser post is still refused. The log line names the surface (`mobile` with the shell version, or `web`). The shell decodes a server error the way the web client does (`decodeErrorBody`, now exported by `@lowdefy/client-core`), so it keeps its class, request id and dev error, and an auth refusal stays an expected outcome. Shell faults that were swallowed (a failed sync, page load, push token registration, background fetch, widget or tracking post, app event) are reported through the core's `handleError`, and a render fault outside a block shows a retry screen instead of closing the app. A network failure is marked where the platform's fetch rejects, so a programming fault is no longer queued as "waiting for network". Sign-in shows "Could not reach the app's server" only for a network failure, a web page that could not be opened is no longer shown as "not found", and a dev page whose plugins are still installing is never cached. Camera, microphone, calendar and location refusals are `UserError`s. The browser error handler's seen set is capped at 500 keys. A mobile sign-in refused by the organization policy is logged as BetterAuth's own refusals are. `lowdefy build` now reports every error in the `mobile` section at once instead of stopping at the first, and a shell's `shell.json` url must be absolute.
