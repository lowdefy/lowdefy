---
'@lowdefy/helpers': patch
---

`buildPagePath` refuses a path value of `.` or `..`, naming the page and the placeholder, because the browser removes such a segment from the URL before the request is sent. Values that only contain dots, such as `v1.2` or `.hidden`, build as before. `parsePathPattern` parses each pattern once and returns the same frozen segments on later calls.
