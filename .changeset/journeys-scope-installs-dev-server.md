---
'lowdefy': patch
---

fix: `lowdefy journeys scope` installs the dev server when none is installed

On a fresh checkout, `lowdefy journeys scope` failed with "No dev server is installed … Run lowdefy dev once". It now installs `@lowdefy/server-dev` into `.lowdefy/dev` the way `lowdefy dev` does, and starts no server. An existing install is left as it is.
