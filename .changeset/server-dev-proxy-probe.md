---
'@lowdefy/server-dev': patch
---

The dev server no longer runs a machine out of network ports under heavy headless use. Its proxy opened an extra connection to check the server before every request, and a page load is hundreds of requests, so running journeys or screenshots for a minute could leave no free local ports and connections failed with `EADDRNOTAVAIL`. The proxy now checks a server once, and again only after a restart or a failed request.
