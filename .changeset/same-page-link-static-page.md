---
'@lowdefy/server-dev': patch
'@lowdefy/server': patch
---

fix(server-dev): A Link that only changes the query on a static page no longer flashes the Building page screen

In the dev server, a Link to the page that is already open with only the query changed hid the whole page behind the "Building page..." screen for a moment, which looked like a page reload. A static page's config does not depend on the query, so it now stays cached across query changes and the address updates in place. Pages with Dynamic blocks still re-resolve on every navigation, and the first navigation to one now fetches its config once instead of twice.

The production server no longer fetches `/api/page/<pageId>` for a Link that stays on the open static page. The page re-renders so it sees the new URL.
