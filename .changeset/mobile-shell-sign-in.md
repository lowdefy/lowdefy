---
'@lowdefy/shell': minor
'@lowdefy/api': minor
---

feat(shell): Sign in on the phone by email code or the system sheet, with biometric unlock and sign-out

- An app with auth opens on a native sign-in screen: the person types their email, then the 6-digit code from the email, which iOS offers to fill in. The screen always says "If this email can sign in, a code is on its way", whether or not the address can. Resend waits 30 seconds.
- "Other ways to sign in", `mobile.auth.emailCode: false` and a person with a second factor go to the app's own sign-in page in an ephemeral system sheet. The shell sends a random state and a PKCE challenge, checks the state on the way back and exchanges the one-time token with the code verifier, which never leaves memory.
- The session token is kept in the Keychain or Keystore on this device only, behind Face ID or a fingerprint with `mobile.auth.unlock: biometric`, or readable after the first unlock for shells with background location work. It is read once per unlock. The shell sends no cookies.
- With `unlock: biometric`, a lock screen shows on launch and after `unlockAfter` seconds in the background, with "Sign in again" as the way out.
- Signing out, a Logout action, or the server refusing the session (a 401, or an answer as the signed-out caller) removes the token, every cached page of the app and the person's storage keys, and opens the app afresh. A 403 drops that organisation's cache. `mobile.auth.sharedDevice: true` signs out whenever the app is closed.
- The mobile root now carries `auth`: the app's `mobile.auth` settings a shell signs in and locks by, or null for an app without auth.
