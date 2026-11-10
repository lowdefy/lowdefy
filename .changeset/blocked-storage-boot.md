---
'@lowdefy/client': patch
---

fix(client): Apps load when the browser blocks storage

An app failed to load, showing nothing, when the browser blocked site storage, such as a browser set to block cookies and site data, or a sandboxed frame. The dark mode and locale preferences read `window.localStorage` outside the guard meant to handle blocked storage, and reaching it threw a `SecurityError` at the app root. They now read it inside the guard and fall back to the defaults: the system colour scheme and the browser's language.
