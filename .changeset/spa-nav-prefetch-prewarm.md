---
'@lowdefy/client': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: prefetch page config on link hover and prewarm the page context before navigation, so client-side page transitions no longer flicker.

Links now prefetch their target page's config on hover/focus/touch (via SWR), and the next page's engine context — including its `onInit` — is initialised before the swap, so the current page stays visible until the new page is ready instead of rendering a blank frame. Wired into both the production (`@lowdefy/server`) and dev (`@lowdefy/server-dev`) servers.
