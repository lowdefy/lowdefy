---
'@lowdefy/build': patch
'@lowdefy/client': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(server): Prevent white flash on page navigation in dark mode.

Pages no longer flash white when navigating between pages in dark mode. A synchronous inline script now sets the correct background color before the page paints, matching the user's dark mode preference from config, localStorage, or system settings.
