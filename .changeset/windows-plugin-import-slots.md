---
'@lowdefy/build': patch
---

fix(build): The build loads a custom connection plugin's schemas from the server's own dependencies on Windows. It passed the plugin's absolute path to `import()`, which Node rejects on Windows, so the plugin's schemas were not read.
