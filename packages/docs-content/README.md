# @lowdefy/docs-content

Lowdefy documentation extracted as markdown, for serving to AI coding agents via the dev server's `/docs` routes and MCP endpoint.

## Contents

- `content/<section>/<slug>.md` — one markdown file per docs page (concepts, tutorial, operators, actions, connections, blocks, ...).
- `index.json` — manifest of all docs: `{ version, docs: [{ slug, title, section, path, kind?, typeName? }] }`. `kind`/`typeName` map a plugin type (e.g. operator `_get`) to its doc.
- `hazards.json` — framework-level hazards served by the dev MCP alongside schemas, docs and config lookups: `[{ id, appliesTo: { kinds?, types?, when? }, message, see }]`. This file is hand-authored and committed, not generated — `pnpm docs:content` wipes `content/` but leaves it untouched. Add an entry only for a behaviour verified in the framework source.

## Regenerating content

Content is generated from the `packages/docs` Lowdefy app during a docs build and committed to this package. To regenerate, run from the repo root:

```bash
pnpm docs:content
```

This runs the docs build with `LOWDEFY_EXTRACT_AGENT_DOCS=true`, which invokes `scripts/extractAgentDocs.js` from the docs build transformer (`packages/docs/templates/generateSiteAssets.js`) after all `_ref`s and template vars are resolved.

Run this before releasing whenever docs change.
