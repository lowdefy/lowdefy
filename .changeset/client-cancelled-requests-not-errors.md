---
'@lowdefy/client': patch
---

fix(client): Requests cancelled as the page unloads are no longer reported as errors

Reloading a page, following a link to another page or closing the tab while a request or endpoint call is still loading made the browser cancel the call, which failed with `Failed to fetch` (or `Load failed` in Safari). The `Request` or `CallAPI` action then ran its catch actions and the failure was reported to the server log and error tracking, although the request had often reached the server and succeeded. A call that fails while the page is leaving is now held: it never finishes if the page goes, and fails as before if the page stays open for 10 seconds (a file download or a `mailto:` link starts leaving but stays) or is shown again with the browser's Back button. Other errors raised while the page is leaving, such as a `Fetch` action the browser cancels, log to the browser console only and are not sent to the server log. A network failure while the page stays open still fails the action and is reported as before.
