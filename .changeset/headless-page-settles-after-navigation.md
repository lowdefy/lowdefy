---
'@lowdefy/server-dev': patch
---

fix: Headless dev tools wait for a client navigation to land before reading the page

A page whose `onInit` runs a `Link` changes the URL straight away, but the app keeps naming the page it is leaving until the next page's config has loaded and rendered. The dev server's headless page wait (screenshots, state inspection, journeys and explorer walks) treated that leaving page as ready, so an explorer walk could report a page that redirects its visitors as not redirected. The wait now holds until the next page has rendered and settled.
