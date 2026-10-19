---
'@lowdefy/build': patch
---

fix(build): Collect connection schemas in a worker thread so the dev server does not keep database drivers loaded

The dev server's config build read each connection package's schemas by importing the package into its own long-lived process, which loaded its database drivers there for the rest of the session. The schemas are now read in a worker thread that exits once it has sent them back as plain JSON, and the result is cached for the session per package name, version and directory, so installed packages are read once per session instead of on every build. Local and linked plugin packages are read fresh on every build. The written schema files are unchanged.
