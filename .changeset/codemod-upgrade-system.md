---
'lowdefy': minor
'@lowdefy/codemods': minor
---

feat: Add `lowdefy upgrade` command with codemod system

New CLI command that automates version migrations. Resolves a chain of upgrade phases from current to target version, runs Category A (automated), B (semi-automated + review), and C (AI-guided) codemods in order, and tracks progress for `--resume` support.

**CLI (`lowdefy`)**

- `lowdefy upgrade` command with `--to`, `--plan`, `--dry-run`, `--scripts-only`, `--resume` options
- Version chain resolver computes ordered upgrade phases from semver ranges
- Fetches `@lowdefy/codemods` package from npm, executes scripts via child_process.fork
- Upgrade state persistence in `.lowdefy/upgrade-state.json` for interrupted upgrades
- Build-time warning when skipped codemods are detected

**Codemods (`@lowdefy/codemods`)**

- v5.0 entry with 20 codemods: 10 automated, 8 semi-automated, 2 AI-guided
- Covers antd v6 upgrade (12 scripts), layout grid migration (4 scripts), dayjs migration (2 scripts)
- Prompt files for AI-guided migrations, human-readable guides for Category C items
