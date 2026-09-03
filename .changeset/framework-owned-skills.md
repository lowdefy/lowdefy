---
'lowdefy': minor
---

feat(cli): `lowdefy agent-setup` installs the framework's 28 topic skills.

The framework now ships 28 `lowdefy-<topic>` Claude Code skills beside `lowdefy-config` — aggregations, aggrid tables, api routines, block plugins, change stamps, charts, contact fields, data schema, detail pages, edit pages, enums, events, file structure, filters, form validation, js operator, layout, list pages, lists, loading skeletons, modules, notifications, operators, page layouts, pagination, status enums, status fields and styling. Each has a Reference section generated from `@lowdefy/docs-content` and the plugin schemas (regenerated with `pnpm skills:generate`, so it versions with the release) and a hand-written Recipe section. `lowdefy-list-pages`, `lowdefy-form-validation` and `lowdefy-js-operator` carry full recipes; the other 25 state what their recipe must cover and are filled in by follow-up releases.

`lowdefy agent-setup` writes the set into `.claude/skills/`, skipping files that already exist, and logs `Installed N skills into '.claude/skills/' (M already present).`. The new `--skills <names>` option takes a comma-separated list of topic names, `all` (the default) or `none` (only `lowdefy-config`); an unknown name is an error listing the available skills. The skills are copied into the published package under `dist/skills/` at build time.
