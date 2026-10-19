---
'@lowdefy/build': patch
'@lowdefy/node-utils': patch
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix: Windows fixes for custom connection plugins, machine slots and generated journey variants

- The build loads a custom connection plugin from the server's own dependencies on Windows. It passed the plugin's absolute path to `import()`, which Node rejects on Windows, so the build failed to read the plugin's schemas.
- A process waiting for a machine slot (a browser, a build) reads each holder's process start time once every few seconds instead of on every check. On Windows each read starts PowerShell, so a wait for a busy slot spent seconds per check. A process also reads its own start time once, not each time it takes a slot.
- The journey data store picks another port when Windows refuses one inside a range it reserves (Hyper-V, WinNAT). Those ranges sit inside the dynamic range the store picks from, so a journey with a data set could fail to start its store.
- `lowdefy journeys variants` writes the source path in a generated file's header with forward slashes, so the file is the same whichever system generated it.
