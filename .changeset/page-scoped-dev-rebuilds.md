---
'@lowdefy/server-dev': patch
'@lowdefy/build': patch
---

fix(server-dev): The dev server rebuilds only the pages an edit changed

- **Built pages survive edits.** Editing a config file no longer makes the dev server throw away every page it has built. It remembers which files each page was built from, and what they contained, and after an edit rebuilds only the pages whose files changed. Open tabs and pages an agent checks after the edit no longer each pay for a rebuild. Pages built with the app's own resolvers, transformers or `.js` refs are still rebuilt after every edit, because the server cannot see what that code reads.
- **Build status sees edits straight away.** `lowdefy_build_status` and `/lowdefy-docs/build-status` list the pages an edit touched even before anything requests them, and `wait: true` builds exactly the pages a request would rebuild.
- **A page no longer keeps content from just before an edit.** An edit that landed while the page was building could leave the page built from the old content until the next edit.
- **One page's unknown block type no longer breaks other pages.** A page with a misspelt block, action or operator type made every page built after it fail with its error until the next edit.
- **Edits made while the config build fails reach the page.** A page edit made while `lowdefy.yaml` failed to build was not picked up; the page now shows it.
- A page that is rebuilt lists its warnings again, and warnings are logged again after an edit.
- **App code is loaded again only when it changes.** The build loaded a resolver, transformer or `.js` ref as a new module on every page build, and each copy stayed in memory. It now loads a file again only when its content changed. When `@lowdefy/build` is linked from a local checkout, an edited resolver or transformer was never loaded again, so pages kept its old output until a restart; they now show the edit.
- **A transformer on a page's own `_ref` runs in the dev server.** A page listed as `_ref: { path, transformer }` (or with a resolver and a transformer) was built in development without its transformer, so it differed from the production build.
- **Module var default files are watched.** Editing a file that a module var's default refs (`vars: { greeting: { default: { _ref: defaults/greeting.yaml } } }`) changed nothing in the dev server until it restarted. Now the config is rebuilt when the module's pages use the var, and the pages that use it through a module component are rebuilt.
- **Pages keep their `_js` when the dev server recreates its build context.** A page requested while another request picked up a config build (or the dev server recreated its build context to free memory) could be served without its `_js` functions and icons, failing with "_js function not found" until reloaded. A page build that finished on the old context could also overwrite the `_js` maps written by newer page builds. The page now gets its `_js` and icons from the context it was built on, and builds on an old context no longer write the `_js` maps.
