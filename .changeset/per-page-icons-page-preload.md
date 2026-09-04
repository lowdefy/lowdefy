---
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/server': minor
---

Per-page icon imports and page chunk preloading. Each page's type-import module now carries the icons that page renders (its config's icon names, the default icons of its block types, and the menus and global icons), so the app-wide icon barrel no longer ships in the client's main chunk and is loaded only as a fallback, for a page the build did not split or an icon a Dynamic block introduces at page-get time. The production HTML shell also emits `modulepreload` links for the page's own module chunk and the chunks it imports, so the first paint no longer waits an extra round trip for them. For an app using several hundred icons this removes on the order of a hundred kilobytes from the initial download.
