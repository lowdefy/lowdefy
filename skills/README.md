# Lowdefy skills

This directory holds the installable [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills) that ship with the Lowdefy framework. They are the framework's manual for coding agents: one skill per topic that a model has to get right when it builds a real Lowdefy app, versioned with the release so the text always matches the framework you have installed.

- `lowdefy-config` teaches an agent to look up exact block, operator, action, connection and request types from a running dev server's docs API and MCP endpoint (`/lowdefy-docs`, `/lowdefy-docs/mcp`) instead of guessing — see `packages/docs/concepts/ai-agent-docs.md`. It is templated with the dev server port and app path when installed.
- The 28 `lowdefy-<topic>` skills (aggregations, aggrid tables, api routines, block plugins, change stamps, charts, contact fields, data schema, detail pages, edit pages, enums, events, file structure, filters, form validation, js operator, layout, list pages, lists, loading skeletons, modules, notifications, operators, page layouts, pagination, status enums, status fields, styling) each carry a **Reference** section and a **Recipe** section.

## Installing

`npx lowdefy agent-setup` writes the whole set into a project's `.claude/skills/`. `--skills lowdefy-list-pages,lowdefy-filters` installs a subset, `--skills none` installs only `lowdefy-config`. Files that already exist are left alone. The set is also installable with `npx skills add lowdefy/lowdefy`, or by copying a folder into `.claude/skills/`.

## Generated and hand-written parts

Every topic skill is split in two, and the split is enforced by markers:

```markdown
---
name: lowdefy-list-pages
description: Use when …
---

# List pages

<!-- generated:reference:start -->

## Reference

… doc summaries, block property tables and events, operator/action/request schemas …

<!-- generated:reference:end -->

## Recipe

… hand-written judgement: order of work, traps, verification …
```

- Everything between `<!-- generated:reference:start -->` and `<!-- generated:reference:end -->` is written by `pnpm skills:generate` from `@lowdefy/docs-content` (`packages/docs-content/index.json` + `content/**/*.md`) and the plugin schemas (`packages/plugins/*/*/dist`). Do not edit it by hand; it is regenerated for every release, and anything a schema or a docs page already says belongs here so it cannot rot.
- Everything outside the markers — frontmatter, title, the Recipe — is hand-written and preserved byte-for-byte on regeneration. A recipe holds only what no schema can carry: the order to build things in, the semantics traps, which MCP tool supersedes the recipe, and how to verify.

`skills/skills.manifest.mjs` is the source of truth for the set: one entry per skill with its `description`, `title`, the `docSlugs` and `types` the Reference is built from, and the one-line `recipe` statement that seeds a new skill's Recipe section.

## Scripts

| Command                | What it does                                                                                                                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm skills:generate` | Creates or updates every `skills/<name>/SKILL.md` from the manifest. Idempotent. Exits non-zero, naming the skill, when a `docSlug` is not in `index.json` or a type is not provided by any plugin package. Run `pnpm build` first so plugin `dist/` exists. |
| `pnpm skills:metrics`  | Prints one row per skill — total lines, generated lines, recipe lines — and a total. The recipe count is the design's shrink metric: as the framework encodes a recipe (tasks 34, 35, 50, 51), its lines here should fall.                                   |
| `pnpm skills:test`     | Runs the generator and metrics unit tests (`scripts/lib/skills/skills.test.mjs`).                                                                                                                                                                            |

## Adding or changing a skill

1. Add or edit the entry in `skills/skills.manifest.mjs`.
2. Run `pnpm skills:generate`. A new skill gets its frontmatter, Reference and a Recipe stub; an existing one only has its Reference rewritten.
3. Write the Recipe below the markers. Say in one line which MCP tool supersedes it, describe current behaviour, and end with a checklist.
4. Run `pnpm skills:generate` again and confirm `git diff skills/` shows only your Recipe change.

The CLI build copies `skills/**/SKILL.md` into `packages/cli/dist/skills/`, which is what `lowdefy agent-setup` installs from.
