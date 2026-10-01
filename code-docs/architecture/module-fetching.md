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
2. Downloads the tarball with authentication headers (if available), or fetches over SSH (see [SSH Fallback](#ssh-fallback))
3. Extracts into a staging directory next to the cache (`{ref}.partial-XXXXXX`), then renames it to `.lowdefy/modules/github/{owner}/{repo}/{ref}/`
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

Because the cache check trusts any existing directory for an immutable ref, the cache directory only ever appears complete: both fetch routes extract into a staging directory and rename it into place. A failed fetch removes the staging directory; a killed build leaves an orphaned `*.partial-*` directory that is never read.

When multiple module entries reference the same repo and ref (e.g., two modules from a monorepo), the tarball is fetched once. Each entry resolves to its own subdirectory within the cached repo.

## Local `file:` Resolution

`source: "file:../../modules/user-admin"` resolves relative to the directory containing `lowdefy.yaml`. No caching or fetching — reads directly from disk. File changes are visible immediately on rebuild.

## Authentication

The tarball request sends a Bearer token from:

1. `GITHUB_TOKEN` environment variable
2. `gh` CLI token — extracted from `gh auth token` if available

## SSH Fallback

**File:** `packages/build/src/build/fetchGitModuleOverSsh.js`

When the tarball request returns 401, 403 or 404 and `GITHUB_SSH_KEY` is set (and not blank), the build fetches the repo with `git` over SSH instead. The API answers 404 for a private repo the caller cannot read, and 401 or 403 when the token it was sent is invalid or not authorised for the org (for example a `gh` token without SSO authorisation). This covers builds that hold an SSH key (typically a read-only deploy key) and no working token. Other failures (5xx, rate limits on public repos) still throw the API error. The unread error response body is cancelled so its connection is released. Public repos stay on the API: a deploy key can only read the repo it belongs to, so SSH-first would break public modules in the same app.

The fetch runs in a temporary directory that is removed afterwards:

1. Writes the key with mode 600, and a `known_hosts` file holding GitHub's published host keys. The key is normalised first, since env var UIs and secret stores mangle multi-line values: literal `\n` escapes become newlines, CRLF becomes LF, surrounding whitespace is trimmed and the final newline OpenSSH requires is added.
2. Sets `GIT_SSH_COMMAND` to `ssh -F none -i <key> -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=<known_hosts>`: only that key is offered, nothing prompts, and the host key is pinned rather than trusted on first use.
3. Runs every git command isolated from the machine's git setup: all `GIT_*` variables are dropped, `GIT_CONFIG_GLOBAL` points at an empty file and `GIT_CONFIG_NOSYSTEM=1`. Otherwise a `url.insteadOf` rewrite in a CI image's global config would send the fetch over HTTPS and bypass the key, and a `GIT_DIR` set by a git hook running the build would point the fetch at the user's own repository.
4. `git fetch --depth 1 -- git@github.com:{owner}/{repo}.git {ref}` (`--` so a ref cannot be read as an option; `parseModuleSource` also rejects refs starting with `-`), then `git archive --format=tar.gz --prefix=module/ FETCH_HEAD` to a file, unpacked with the same `extractTarball` the API route uses. GitHub's tarball endpoint is `git archive`, so both routes cache the same files, without `.git`.

`git fetch` cannot resolve an abbreviated SHA, so over SSH `ref` must be a tag, branch or full SHA. An abbreviated SHA fails with an explicit error before any git command runs. If GitHub rotates a host key, `GITHUB_KNOWN_HOSTS` in `fetchGitModuleOverSsh.js` needs updating from `https://api.github.com/meta`.

If the SSH fetch fails, the error reports both the API status and the git error.

## Dev Server Integration

For local sources (`file:` paths), the dev server's file watcher covers the resolved module directory. Changes to module files trigger a rebuild — the same behavior as changes to app config files.

GitHub sources are not watched — they are fetched once per build. To iterate on a GitHub-hosted module, use a local `file:` source during development.

## Key Files

| File                                                | Purpose                                                |
| --------------------------------------------------- | ------------------------------------------------------ |
| `packages/build/src/build/fetchModules.js`          | Orchestrates module fetching                           |
| `packages/build/src/build/parseModuleSource.js`     | Parses `github:` and `file:` source strings            |
| `packages/build/src/build/fetchGitHubModule.js`     | Tarball fetch, cache, SSH fallback                     |
| `packages/build/src/build/fetchGitModuleOverSsh.js` | git over SSH with `GITHUB_SSH_KEY`                     |
| `packages/build/src/build/extractTarball.js`        | Unpacks a gzipped tarball, stripping its top directory |
