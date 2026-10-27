---
'@lowdefy/client-native': patch
'@lowdefy/blocks-native': patch
'@lowdefy/shell': patch
---

fix(client-native,blocks-native,shell): Images behind an app's sign-in load on phones

On the web an image on the app server loads with the session cookie, but a phone sends no session, so a Markdown image or avatar photo behind the app's sign-in failed. Images now load through `components.imageSource`, which sends the session token as a bearer header to the app server's own origin only, never to another host. Sign-out also clears the images the phone cached in memory and on disk.
