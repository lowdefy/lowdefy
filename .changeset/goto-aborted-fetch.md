---
'@lowdefy/server-dev': patch
---

fix(server-dev): A journey `goto` is not failed by the old page's fetches it aborted

A `goto` issued while the page being left still had requests in flight failed with `client-error: Failed to fetch`, because the browser cancelled those requests when the journey navigated away and the page reported them. The app was fine and real users never saw it. A `goto` step now ignores fetch failures reported while the browser aborted requests during that navigation. A failed fetch in any other step, or in a `goto` where no request was aborted, still fails the step.
