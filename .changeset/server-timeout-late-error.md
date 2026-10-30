---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix: A request that runs past `config.requestTimeout` no longer reports a second error when its handler finally returns. The 504 still goes out on time, now with no body. The middleware that ran on the late result set a header on the 504 that had already been sent, and rebuilding it from its already-read body threw `TypeError: Response body object should not be disturbed or locked` (seen under `compress`). That error was logged and sent to Sentry under the request's route, hiding the timeout behind a misleading title. A real fault the handler raises after the timeout is still reported as before.
