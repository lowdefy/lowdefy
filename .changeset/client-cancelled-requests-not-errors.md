---
'@lowdefy/client': patch
---

fix(client): Requests cancelled as the page unloads are no longer reported as errors

Reloading a page, following a link to another page or closing the tab while a request or endpoint call is still loading made the browser cancel the call, which failed with `Failed to fetch` (or `Load failed` in Safari). The `Request` or `CallAPI` action then ran its catch actions and the failure was reported to the server log and error tracking, although the request had often reached the server and succeeded. A call the browser cancels while the page unloads now never finishes, as the page is going away. The same holds for the other calls in flight when Lowdefy reloads the page itself, for example after a deploy or when the signed-in user changes. A network failure while the page stays open still fails the action and is reported as before.
