---
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
'lowdefy': patch
---

The dev server answers sooner after each config edit, and `lowdefy_build_status` answers are shorter.

- A page build no longer walks the whole key and ref maps to find the entries it added. Each entry is logged as it is added, which takes about 0.8 s off every page build of a large app.
- File watchers wait 150 ms (was 500 ms) for a save to finish before they build. A save of 200 files still builds once.
- `lowdefy_build_status` with `wait: true` waits 200 ms instead of its 1 s grace for an unseen edit when the server has just processed one.
- Through `lowdefy mcp`, `lowdefy_build_status` lists a build warning in full only when it is new or changed since the session's last answer for that app. The rest come as a count, `build.warningsUnchanged`. Errors always come in full. Pass `all: true` to list every warning.
