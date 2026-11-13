---
'@lowdefy/client': minor
'@lowdefy/server': minor
---

feat(client): Links work in an MCP App view

In a page shown as an MCP App view, a click on a link did nothing: the page runs in the host's frame, on another origin than its app, and cannot open or follow a link itself.

- **View pages.** A link to a view page navigates in place, from the `Link` action, the `Link` component and an HTML `data-page-id` link. The frame does not reload, back returns to the earlier page, and path values and the query reach the page as `_path_params` and `_url_query`.
- **Other pages of the app.** The app answers a page that is not a view page as one for another surface. The view then asks the host to open that page's URL on the app's origin in the browser, and stays on the page it shows.
- **Everything else.** A `newTab` link, a link to another site, a `target="_blank"` anchor, a modified or middle click on an in-app link and a call to `window.open` are opened in the browser by the host. Block plugins need no changes: the view catches anchor clicks and `window.open` in the frame while the page is mounted. A relative link is resolved on the app's origin with its `basePath`.
- **What the host is asked to open.** Only `http:` and `https:` URLs. A `javascript:`, `data:` or `file:` link is not opened and does not move the frame. Mail, phone and fragment links and downloads are left to the browser.
- **The frame stays put.** No link navigates the frame itself. Where the browser has the Navigation API, anything else that would load another document in the frame is cancelled and opened by the host.
- **A link the host does not open** shows the `client.popupBlocked` message.

A browser tab is unaffected.
