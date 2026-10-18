---
'@lowdefy/shell': minor
---

feat(shell): Each shell opens exactly one app

`shell.json` names the one app a shell opens as `app: { id, name, urls: { <environment>: url } }`, in place of the `apps` list, and the app picker is gone. Every app's `_js` runs in the shell's single JavaScript realm, so a second app in the same shell could reach the first one's session token, storage and cache. `app.config.ts` refuses a shell config that lists `apps`, names more than one app or has no url for the shell's environment, so `expo prebuild` and `expo export` fail with a message saying what to change.
