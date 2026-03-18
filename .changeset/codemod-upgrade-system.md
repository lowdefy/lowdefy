---
'lowdefy': minor
'@lowdefy/codemods': minor
---

feat: Add `lowdefy upgrade` command with prompt-based codemod system

New CLI command that guides version migrations using markdown prompts. Resolves a chain of upgrade phases from current to target version, presents migration prompts in order, and tracks progress for `--resume` support.

**CLI (`lowdefy`)**

- `lowdefy upgrade` command with `--to`, `--plan`, `--resume` options
- Version chain resolver computes ordered upgrade phases from semver ranges
- Fetches `@lowdefy/codemods` package from npm, presents migration prompts
- Each prompt can be copied to clipboard for AI tools, viewed as a manual guide, or skipped
- Upgrade state persistence in `.lowdefy/upgrade-state.json` for interrupted upgrades
- Build-time warning when skipped codemods are detected

**Codemods (`@lowdefy/codemods`)**

- v5.0 entry with 20 migration prompts
- Covers antd v6 upgrade (14 prompts), layout grid migration (4 prompts), dayjs migration (2 prompts)
- Self-contained markdown prompts with context, examples, edge cases, and verification steps
