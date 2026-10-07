---
'@lowdefy/server-dev': minor
---

Doc search ranks by words, and covers the app's own plugins and modules.

- `lowdefy_search_docs` and `GET /lowdefy-docs/search` split the query into words and rank pages by how many match, title matches first. A query like "Link action pathParams path parameters" now finds the Link action page.
- Each hit names its `source` (`core`, `plugin`, `local-plugin` or `module`), package and version. Pass `source` (`&source=` on the route) to search one source.
- The docs your app's plugins and modules ship are searched and read like the core docs, local plugins and `file:` modules included. `lowdefy_get_doc` returns a plugin's README as `plugins/<package>`, a `docs/*.md` file as `plugins/<package>/<file>`, and the same for modules under `modules/<id>`. A plugin docs file named after a type is that type's doc.
- `modules/<id>/manifest` lists the vars (type, required, description, default), components and exports a module's `module.lowdefy.yaml` declares.
- The dev server reads these docs when it starts and again when plugins or modules change. A config-only edit does not re-read them.
