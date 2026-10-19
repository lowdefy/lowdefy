---
'@lowdefy/server-dev': patch
---

fix: Headless dev tools wait for a client navigation to land before reading the page

A page whose `onInit` runs a `Link` changes the URL straight away, but the app keeps naming the page it is leaving until the next page's config has loaded and rendered. The dev server's headless page wait (screenshots, state inspection and journeys) treated that leaving page as ready, so a tool or journey step could read the page being left instead of the page it redirects to. The wait now holds until the next page has rendered and settled.
