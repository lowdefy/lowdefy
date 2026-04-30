# Module Fetching Architecture

How module sources are fetched and cached during the build.

## Overview

Module fetching runs inside the build process (Phase 0), not the CLI. Unlike plugins (which need npm installation into the server's `node_modules`), modules are YAML files on disk. Running fetching within the build avoids the subprocess boundary problem — resolved paths stay in-process and pass directly to `registerModuleEntry`.

## Source Format Parsing

**File:** `packages/build/src/build/parseModuleSource.js`

The `source` field follows the GitHub Actions convention:

```
github:{owner}/{repo}@{ref}           → root of repo
github:{owner}/{repo}/{path}@{ref}    → subdirectory in repo
file:{relative/path}                   → local directory
```

Since GitHub repos are always `owner/repo` (two segments), parsing is unambiguous — additional segments are the subdirectory path, `@ref` is the git ref.

## GitHub Tarball Fetching

For `github:` sources, the build:

1. Constructs the GitHub tarball URL: `https://api.github.com/repos/{owner}/{repo}/tarball/{ref}`
2. Downloads the tarball with authentication headers (if available)
3. Extracts to `.lowdefy/modules/github/{owner}/{repo}/{ref}/`
4. For monorepo modules, resolves the subdirectory within the extracted tree

### Cache Strategy

Cache directory: `.lowdefy/modules/`

```
.lowdefy/modules/
└── github/
    └── {owner}/
        └── {repo}/
            └── {ref}/
                ├── module.lowdefy.yaml
                ├── pages/
                └── ...
```

- **Immutable refs** (tags, commit SHAs) — cached permanently, never re-fetched
- **Mutable refs** (branches) — re-fetched on each build

When multiple module entries reference the same repo and ref (e.g., two modules from a monorepo), the tarball is fetched once. Each entry resolves to its own subdirectory within the cached repo.

## Local `file:` Resolution

`source: "file:../../modules/user-admin"` resolves relative to the directory containing `lowdefy.yaml`. No caching or fetching — reads directly from disk. File changes are visible immediately on rebuild.

## Authentication

The build checks for credentials in order:

1. `GITHUB_TOKEN` environment variable — used as Bearer token
2. `gh` CLI token — extracted from `gh auth token` if available
3. Git credential helpers — standard git credential mechanism

For private repositories, `GITHUB_TOKEN` is the recommended approach. Set it in `.env` for local development.

## Dev Server Integration

For local sources (`file:` paths), the dev server's file watcher covers the resolved module directory. Changes to module files trigger a rebuild — the same behavior as changes to app config files.

GitHub sources are not watched — they are fetched once per build. To iterate on a GitHub-hosted module, use a local `file:` source during development.

## Key Files

| File                                            | Purpose                                     |
| ----------------------------------------------- | ------------------------------------------- |
| `packages/build/src/build/fetchModules.js`      | Orchestrates module fetching                |
| `packages/build/src/build/parseModuleSource.js` | Parses `github:` and `file:` source strings |
