---
'@lowdefy/shell': minor
---

feat(shell): Links to the app's site open in the shell

A shell now declares the Associated Domains entitlement (`applinks:<host>`) and an Android App Links filter for its app's https url, beside the sign-in callback, so a link to one of the app's pages in an email or a chat opens the page in the app. The server already names the shell in `apple-app-site-association` and `assetlinks.json`.
