# @lowdefy/codemods

Migration prompts for Lowdefy version upgrades. Published to npm as a standalone package with zero dependencies.

## Purpose

Contains all codemods across all Lowdefy versions. The CLI fetches `@lowdefy/codemods@latest` and uses the registry to resolve upgrade chains from any version to any version. Old codemods are never removed — they're the migration path for users who skipped versions.

## Package Structure

```
@lowdefy/codemods/
├── package.json          ← main: "registry.json"
├── registry.json         ← Master manifest — maps versions to codemods
└── v5-0-0/               ← Version directory (dashes for cross-platform safety)
    ├── 01-*.md           ← Migration prompts (numbered in execution order)
    ├── ...
    └── 20-*.md
```

Version directories use dashes instead of dots (e.g., `v5-0-0` not `v5.0.0`) for cross-platform path safety. Files are numbered in execution order.

## Registry Manifest

`registry.json` is the source of truth for the upgrade chain:

```json
{
  "versions": [
    {
      "version": "5.0.0",
      "from": ">=4.0.0 <5.0.0",
      "description": "Antd v6 upgrade, layout grid changes, dayjs migration",
      "codemods": [
        {
          "id": "rename-areas-to-slots",
          "description": "Rename areas to slots",
          "path": "v5-0-0/01-rename-areas-to-slots.md"
        }
      ]
    }
  ]
}
```

### Version entry fields

| Field         | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| `version`     | Target version after this phase completes                   |
| `from`        | Semver range — which current versions this phase applies to |
| `description` | Human-readable summary of what changed                      |
| `codemods`    | Ordered list of codemod entries                             |

### Codemod entry fields

| Field         | Description                               |
| ------------- | ----------------------------------------- |
| `id`          | Unique identifier within the version      |
| `description` | What the codemod does                     |
| `path`        | Relative path to the prompt markdown file |

## Prompt Format

Each prompt is a self-contained markdown file that includes:

- **Context** — what changed and why
- **What to do** — step-by-step instructions
- **Files to check** — glob and grep patterns to find affected files
- **Examples** — before/after YAML showing the transformation
- **Edge cases** — what to watch for
- **Verification** — how to confirm the migration is complete

Prompts are designed to work with any AI coding tool (Claude Code, ChatGPT, Cursor, etc.) or as manual migration guides.

## Zero Dependencies

The package contains only JSON and markdown files. No npm dependencies. This keeps the package small and avoids version conflicts with the user's project.

## How to Add New Codemods

When a Lowdefy version ships breaking changes:

1. **Create a version directory** — `vX-Y-Z/` with dashes.
2. **Write prompts** — numbered markdown files in execution order. Each prompt is self-contained with context, instructions, examples, and verification steps.
3. **Update `registry.json`** — add a version entry with `from` range and codemod list.
4. **Publish** — `@lowdefy/codemods` is published alongside the Lowdefy release.

The design-repo codemod structure maps to the published package:

- `designs/{feature}/codemod/prompts/` → numbered `.md` files in `vX-Y-Z/`
- `designs/{feature}/codemod/codemod-manifest.md` → entries in `registry.json`

## Integration

- **CLI `upgrade` command** — Fetches this package, reads the registry, and presents prompts. See [cli.md](./cli.md).
- **CLI `validateVersion.js`** — Checks `.lowdefy/upgrade-state.json` for pending codemods and warns during `build`/`dev`.
