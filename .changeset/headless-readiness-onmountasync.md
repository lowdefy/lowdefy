---
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

Headless agent captures now wait for the page's async lifecycle instead of only for initial requests.

`lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator` and `lowdefy_load_state` previously read the page as soon as its context existed and no request was in flight — which is true before `onMountAsync` has even started, so a page fed by an `onMountAsync` `Request` action was screenshotted and inspected empty. They now wait for `onInit`, `onInitAsync`, every block event (including `onMountAsync`), in-flight requests, and the first websocket message. A page that has not settled within the 15s timeout is still returned, now carrying `ready: false` and a note saying the result is a snapshot of an unsettled page.
