---
'@lowdefy/build': patch
---

fix(build): Server config that runs `_js` bundles the operators its accessors call. `payload()`, `step()`, `item()`, `secret()`, `state()`, `user()` and `lowdefyApp()` call `_payload`, `_step`, `_item`, `_secret`, `_state`, `_user` and `_app`, which were bundled only when some other server config named them, so a request or endpoint `_js` such as `return payload('x')` could fail at runtime with `_payload is not a function`.
