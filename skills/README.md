# Lowdefy skills

This directory holds the installable [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills) that ship with the Lowdefy framework. They are the framework's manual for coding agents: one skill per topic that a model has to get right when it builds a real Lowdefy app, versioned with the release so the text always matches the framework you have installed.

- `lowdefy-config` teaches an agent to look up exact block, operator, action, connection and request types from a running dev server's docs API and MCP endpoint (`/lowdefy-docs`, `/lowdefy-docs/mcp`) instead of guessing — see `packages/docs/concepts/ai-agent-docs.md`. It is templated with the dev server port and app path when installed.
- The 28 `lowdefy-<topic>` skills (aggregations, aggrid tables, api routines, block plugins, change stamps, charts, contact fields, data schema, detail pages, edit pages, enums, events, file structure, filters, form validation, js operator, layout, list pages, lists, loading skeletons, modules, notifications, operators, page layouts, pagination, status enums, status fields, styling) each carry a **Reference** section and a **Recipe** section.

## Installing

`npx lowdefy agent-setup` writes the whole set into a project's `.claude/skills/`. `--skills lowdefy-list-pages,lowdefy-filters` installs a subset, `--skills none` installs only `lowdefy-config`. Files that already exist are left alone, and any whose `lowdefyVersion` is behind the running CLI are named in a warning; `--force-skills` overwrites them. The set is also installable with `npx skills add lowdefy/lowdefy`, or by copying a folder into `.claude/skills/`.

## Generated and hand-written parts

Every topic skill is split in two, and the split is enforced by markers:

```markdown
---
name: lowdefy-list-pages
description: Use when …
kind: recipe
lowdefyVersion: 5.5.1
---

# List pages

<!-- generated:reference:start -->

## Reference

… the doc slugs and type names this skill covers, and the lowdefy*get*\* call that returns each live …

<!-- generated:reference:end -->

## Recipe

… hand-written judgement: order of work, traps, verification …
```

- The frontmatter and everything between `<!-- generated:reference:start -->` and `<!-- generated:reference:end -->` is written by `pnpm skills:generate` from the manifest, `@lowdefy/docs-content` (`packages/docs-content/index.json` + `content/**/*.md`) and the plugin schemas (`packages/plugins/*/*/dist`). Do not edit it by hand.
- The Reference is an **index, not a copy**: doc slugs and type names, and the one `lowdefy_get_*` call that returns each. A schema restated here would be a snapshot of what `lowdefy_get_schema` answers correctly for the version the project is actually running, and it would go stale on the next release. Resolving every slug and type is still what the generator does — a renamed page or a removed type fails it — the resolved detail just is not written out.
- Everything between the frontmatter and the markers, and everything below them, is hand-written and preserved byte-for-byte on regeneration. A recipe holds only what no schema can carry: the order to build things in, the semantics traps, which MCP tool supersedes the recipe, and how to verify.
- `kind` is `recipe` when the Recipe is a workaround an agent has to carry for something the framework should do natively, and `reference` when it explains a shipped feature. `lowdefyVersion` is the framework version the file was generated from, which is what makes a stale install detectable.

`skills/skills.manifest.mjs` is the source of truth for the set: one entry per skill with its `kind`, `description`, `title`, the `docSlugs` and `types` the Reference indexes, and the one-line `recipe` statement that seeds a new skill's Recipe section.

## Scripts

| Command                | What it does                                                                                                                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm skills:generate` | Creates or updates every `skills/<name>/SKILL.md` from the manifest. Idempotent. Exits non-zero, naming the skill, when a `docSlug` is not in `index.json` or a type is not provided by any plugin package. Run `pnpm build` first so plugin `dist/` exists. |
| `pnpm skills:metrics`  | Prints each skill's `kind` and counts the recipe skills. That count is the shrink metric — not bytes, which a reference skill is entitled to grow. A feature that makes a recipe unnecessary retires it by name in its changeset and the count falls.        |
| `pnpm skills:test`     | Runs the generator and metrics unit tests (`scripts/lib/skills/skills.test.mjs`).                                                                                                                                                                            |

## Adding or changing a skill

1. Add or edit the entry in `skills/skills.manifest.mjs`.
2. Run `pnpm skills:generate`. A new skill gets its frontmatter, Reference and a Recipe stub; an existing one has its frontmatter and Reference rewritten.
3. Write the Recipe below the markers. Say in one line which MCP tool supersedes it, describe current behaviour, and end with a checklist.
4. Run `pnpm skills:generate` again and confirm `git diff skills/` shows only your Recipe change.

The CLI build copies `skills/**/SKILL.md` into `packages/cli/dist/skills/`, which is what `lowdefy agent-setup` installs from.
