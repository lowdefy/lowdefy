---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/shell': minor
---

feat: The phone sign-in sheet asks to confirm, gives the phone its own session and returns by app link on Android

- `/auth/mobile` no longer hands a session to a shell on a GET. A signed-in person sees "Sign in to <app> on this device?", naming the shell and the account, with Continue and Cancel. The one-time token is minted only when the page posts back from the app's own origin with its CSRF token. Cancel returns `error=cancelled` to the shell.
- Continue creates a new session for the phone, with the browser session's active organization and the phone lifetime from `mobile.auth.sessionExpiresIn`. The browser's own session is never handed over, marked or extended, so signing out on the phone leaves the browser signed in. A browser session created inside this sign-in is ended once the phone has its own.
- Shells send `platform=ios` or `platform=android` (now required). Android returns by the https app link `<app url>/auth/mobile/callback`, verified through `assetlinks.json`, instead of the shell's scheme, so no other app can receive the token. An Android shell needs `android.package` and `android.sha256` in `mobile.shells`. If the link is not verified, `/auth/mobile/callback` asks the person to return to the app and never shows the token. iOS keeps the shell's scheme.
- The shell declares the app link in its Android manifest for each app's https url.
