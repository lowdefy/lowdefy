---
'@lowdefy/server-dev': patch
---

Headless pages (screenshots, state inspection, journeys) open about 15 seconds faster. Every dev page keeps the reload event stream open, so waiting for the network to go idle always ran out its timeout first. Pages now wait for the page load and then for the page the app shows to settle, so a page that redirects, such as a protected page opened signed out, settles on the sign-in page instead of waiting another 15 seconds and reporting it did not settle.
