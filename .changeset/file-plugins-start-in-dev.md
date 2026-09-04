---
'@lowdefy/build': patch
---

An app with a file plugin now starts. The server `package.json` writer and the dev server's missing-package detector both treated a file plugin's `package: null` as a package name: the first wrote a dependency literally named `null`, which the package manager rejected, and the second reported the plugin missing on every page build so the dev server reinstalled and restarted forever. Both now skip file plugins, which have nothing to install.
