---
name: l-experimental-release
description: Publish an experimental release to npm. Runs changeset version --snapshot, builds, publishes with --tag experimental, then discards version changes. Use when publishing experimental/preview releases.
---

# Experimental Release

Publish all packages to npm under the `experimental` tag from the current branch.

## Instructions

### 1. Pre-flight Checks

Run in a **single** bash call:

```bash
echo "===BRANCH==="
git branch --show-current
echo "===STATUS==="
git status --porcelain
echo "===CHANGESETS==="
ls .changeset/*.md 2>/dev/null | grep -v config.json
```

**Check for uncommitted changes:**

If there are uncommitted changes, stop: "There are uncommitted changes. Commit or stash them first — the release process modifies files that need to be discarded afterwards."

**Check for changesets:**

If no changeset files exist (only `config.json`), warn: "No changesets found. The experimental release will have `0.0.0-experimental-{hash}` versions. Continue anyway?" and prompt:

```
Question: "No changesets found. Proceed?"
Header: "Experimental Release"
Options:
  - label: "Continue"
    description: "Publish with snapshot versions anyway"
  - label: "Cancel"
    description: "Add changesets first with /l-changeset"
```

### 2. Verify npm Login

```bash
npm whoami 2>&1
```

If this fails or returns an error:

Say: "Not logged in to npm. Run `npm login` to authenticate — npm will open your browser for OTP verification. Let me know when you're logged in."

Stop and wait for the user to confirm they've logged in. Then re-check with `npm whoami`.

### 3. Confirm

```
Question: "Ready to publish experimental release?"
Header: "Experimental Release"
Options:
  - label: "Publish"
    description: "From branch: {branch} — will publish all @lowdefy/* packages with experimental tag"
  - label: "Cancel"
    description: "Don't publish"
```

### 4. Version (Snapshot)

```bash
pnpm release:version-experimental
```

This runs `changeset version --snapshot experimental`, `pnpm install`, and `pnpm build`. It modifies package.json files and the lockfile — these changes will be discarded after publishing.

This step takes a while (includes full build). If it fails, discard changes (step 6) and stop.

### 5. Publish

```bash
pnpm release:publish-experimental
```

This publishes all packages (except `lowdefy-vscode`) with `--tag experimental --no-git-checks`.

**If you get a 404 error** on a package, this means the npm session has expired. Say: "npm session expired (404 error). Run `npm login` to re-authenticate, then let me know to retry."

**If npm prompts for OTP**, tell the user: "npm is waiting for OTP — check your browser or press Enter when prompted." Wait for the user to confirm, then check if the publish completed.

### 6. Discard Version Changes

After publishing (success or failure), always discard the snapshot version changes:

```bash
git checkout -- .
```

This restores all package.json files, the lockfile, and changeset files to their pre-release state.

Verify clean state:

```bash
git status --porcelain
```

### 7. Done

Show a summary:

```
Experimental release published from branch `{branch}`.

Install with:
  pnpm add lowdefy@experimental
  pnpm add @lowdefy/cli@experimental
```
