---
'@lowdefy/shell': patch
---

fix(shell): Carry the shell's version in its JavaScript bundle

The shell now reports the version of the JavaScript that runs (`src/version/shellVersion.js`), not the one in the Expo config. On an embedded launch the Expo config is the one the native build embedded, so a debug shell whose newer JavaScript came from Metro still sent the native build's version as `x-lowdefy-shell`, and showed "Update the app to open this page" for an app whose `mobile.minShellVersion` that JavaScript meets. The version is no longer in the Expo config's `extra.shell`.
