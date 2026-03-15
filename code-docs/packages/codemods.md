# @lowdefy/codemods

Migration scripts and prompts for Lowdefy version upgrades. Published to npm as a standalone package with zero dependencies.

## Purpose

Contains all codemods across all Lowdefy versions. The CLI fetches `@lowdefy/codemods@latest` and uses the registry to resolve upgrade chains from any version to any version. Old codemods are never removed — they're the migration path for users who skipped versions.

## Package Structure

```
@lowdefy/codemods/
├── package.json          ← main: "registry.json"
├── registry.json         ← Master manifest — maps versions to codemods
└── v5-0-0/               ← Version directory (dashes for cross-platform safety)
    ├── _utils.mjs        ← Shared utilities (Node.js built-ins only)
    ├── 01-*.mjs          ← Category A/B scripts (numbered in execution order)
    ├── ...
    ├── 19-*.md           ← Category C prompt/guide (interleaved by order)
    └── 20-*.md
```

Version directories use dashes instead of dots (e.g., `v5-0-0` not `v5.0.0`) for cross-platform path safety. Files are numbered in execution order — scripts (`.mjs`) and prompts (`.md`) are interleaved based on when they should run.

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
          "category": "A",
          "description": "Rename areas to slots",
          "path": "v5-0-0/01-rename-areas-to-slots.mjs",
          "scope": "config"
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

| Field         | Description                                                             |
| ------------- | ----------------------------------------------------------------------- |
| `id`          | Unique identifier within the version                                    |
| `category`    | `"A"` (automated), `"B"` (semi-automated), `"C"` (AI-guided)            |
| `description` | What the codemod does                                                   |
| `path`        | Relative path to the script or prompt file                              |
| `scope`       | `"config"` (YAML files), `"plugins"` (JS/TS plugin source), or `"both"` |

The file extension determines execution: `.mjs` runs as a script, `.md` is presented as a prompt/guide.

## Script Pattern

All scripts follow the same pattern using `_utils.mjs`:

```javascript
import { runMigration, findCodeBlockLines } from './_utils.mjs';

runMigration({
  name: 'Migration Name',
  transform(content, filePath) {
    // Transform content, return { output, changes }
    const changes = [];
    let output = content;
    // ... apply transformations ...
    return { output, changes };
  },
  report(filePath, content) {
    // Optional: return items needing manual review (Category B)
    return [];
  },
});
```

### `_utils.mjs` exports

| Function                                    | Purpose                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `findYamlFiles(dir)`                        | Recursively find `.yaml`/`.yml`/`.yaml.njk` files, skipping hidden dirs and `node_modules` |
| `parseArgs()`                               | Parse CLI args: `{ apply: boolean, targetDir: string }`                                    |
| `backupFile(file, targetDir)`               | Copy file to `.codemod-backup/` preserving relative path                                   |
| `findCodeBlockLines(content)`               | Return Set of line indices inside markdown code blocks (to skip)                           |
| `runMigration({ name, transform, report })` | Orchestrate: find files → transform → report → apply/dry-run                               |

### Execution modes

Scripts support two modes via CLI args:

```bash
node 01-rename-areas-to-slots.mjs /path/to/app         # dry-run (default)
node 01-rename-areas-to-slots.mjs --apply /path/to/app  # apply changes
```

In dry-run mode, scripts report what would change but write nothing. In apply mode, they back up files first, then write.

### Code block skipping

`findCodeBlockLines()` builds a set of line indices inside markdown code blocks (` ``` ... ``` `). Codemods use this to avoid modifying documentation examples embedded in YAML files.

## Codemod Categories

### Category A — Automated

Deterministic transformations. `transform()` returns modified content; no `report()` function. The CLI runs the script and shows a diff summary.

**Current A codemods (v5.0.0):** rename-areas-to-slots, migrate-properties-style, migrate-inline-style-props, bordered-to-variant, simple-prop-renames, tabs-position-to-placement, notification-message-to-title, rename-gutter-to-gap, rename-content-prefix, rename-moment-to-dayjs

### Category B — Semi-automated

Scripts that transform and report. Both `transform()` and `report()` are provided. `report()` returns items needing manual review. The CLI pauses after execution for the user to review flagged items.

**Current B codemods (v5.0.0):** divider-dual-rename, button-type-to-color-variant, detect-styles-less, detect-date-formats, migrate-meta-styles, rename-xxl-to-2xl, rename-align-to-selfAlign, report-thresholds-usage

### Category C — AI-guided

Markdown files containing migration context, instructions, before/after examples, and checklists. The CLI presents these as prompts (for AI tools) or manual guides.

**Current C codemods (v5.0.0):** responsive-style-breakpoints, comment-block-removal

## Zero Dependencies

All scripts use Node.js built-in modules only (`fs`, `path`). No npm dependencies. This keeps the package small and avoids version conflicts with the user's project.

## How to Add New Codemods

When a Lowdefy version ships breaking changes:

1. **Create a version directory** — `vX-Y-Z/` with dashes.
2. **Copy `_utils.mjs`** from the previous version directory (or import from it if the API is stable).
3. **Write scripts** — numbered in execution order. Use `runMigration()` for the standard flow.
4. **Write prompts** — markdown files for Category C changes.
5. **Update `registry.json`** — add a version entry with `from` range and codemod list.
6. **Publish** — `@lowdefy/codemods` is published alongside the Lowdefy release.

The design-repo codemod structure maps to the published package:

- `designs/{feature}/codemod/scripts/` → numbered `.mjs` files in `vX-Y-Z/`
- `designs/{feature}/codemod/SKILL.md` → numbered `.md` files in `vX-Y-Z/`
- `designs/{feature}/codemod/codemod-manifest.md` → entries in `registry.json`

## Integration

- **CLI `upgrade` command** — Fetches this package, reads the registry, and executes codemods. See [cli.md](./cli.md).
- **CLI `validateVersion.js`** — Checks `.lowdefy/upgrade-state.json` for pending codemods and warns during `build`/`dev`.
