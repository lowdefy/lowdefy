---
'@lowdefy/build': patch
---

fix: The build checks an endpoint's `payloadSchema`. A schema that is not valid JSON Schema, or a `schedules` entry whose `payload` does not match it, is now a build error instead of a failure on every call or every scheduled run.
