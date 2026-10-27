# Releasing

How Lowdefy packages reach npm: the release from CI, the experimental release a person runs,
and the npm trusted publisher that links the two.

## Release from CI

`.github/workflows/release.yaml` ("Release 7.x" in the Actions tab) runs on every push to `main`,
and from the Actions tab. The 6.x line has its own copy on the `v6` branch ("Release 6.x"). Each
run's title says what the push was: "Publish 7.x (release pull request merged)", "Release 7.x:
develop merged into main", "Release 7.x: other push to main" or "Release 7.x: run by hand". Its
`mode` job reads the pushed commit's `.changeset/` folder and picks one of two paths (see
[CI](./testing.md#ci) for where the complete test path runs):

1. With changesets pending (the Release merge from `develop`), the `version` job runs
   `changesets/action`, which opens or updates the "Publish new release" pull request
   (`pnpm release:version`). Nothing is tested or published, and the run summary links the
   pull request. The only build is of the shell's dependencies (`--filter=@lowdefy/shell^...`):
   the shell's type manifest is rewritten after the version bump, and its generator imports
   each plugin package's built `./types` export.
2. Once that pull request is merged there are no changesets left. The `test` job runs the
   complete path, and only when it passes the `publish` job publishes
   (`pnpm release:publish`, which is `changeset publish`). Its exit code is ignored, since it
   fails on versions that already exist, which is what a re-run sees.
3. `scripts/verify-published.mjs` is the real gate: every publishable package (every
   non-private workspace package, minus the `ignore` list in `.changeset/config.json`) must be
   on npm at its local version. A missing one fails the job; fix the cause and re-run it.
4. The `publish` job tags the commit and creates a draft GitHub release.
5. The `report` job runs last, whatever happened before it, and writes the outcome
   (`scripts/report-release.mjs`) to the run summary and as one comment on the merged release
   pull request: the version, the npm dist-tags and the draft GitHub release when it published;
   the failed jobs and steps, with links and what to do, when it did not. A re-run edits the
   same comment. **To see whether a release went out, read that comment.**

`scripts/verify-published.mjs` waits up to about five minutes for npm to show every package,
since a freshly published version can take a while to appear. If it still fails with every
package sent, re-run the failed jobs once `npm view lowdefy@<version>` finds them.

The "CI" run on the "Publish new release" pull request shows as failed with no jobs. The
changesets action opens that pull request as `github-actions[bot]`, GitHub holds any run the bot
triggers until someone approves it, and a held run counts as failed when the pull request
merges. CI would run nothing on that pull request anyway, so ignore it.

The `publish` job publishes through npm's OIDC trusted publishing only. There is no npm token, so npm
accepts a package from CI only when that package has this trusted publisher:

```
type: github
file: release.yaml
repository: lowdefy/lowdefy
environment: publish
permissions: publish, stage publish
```

A package without it fails in step 2 with `E404 Not Found - PUT`, after every other package
is already live, and `lowdefy@latest` can't install while a package it depends on is
missing.

## Experimental release

`pnpm release:experimental` publishes a snapshot of the current branch under the
`experimental` dist-tag, from a person's machine:

1. `scripts/pull-before-release.mjs` refuses uncommitted changes and fast-forwards the branch.
2. `npm whoami || npm login`.
3. `pnpm release:version-experimental` versions every package as
   `0.0.0-experimental-<timestamp>` and builds.
4. `pnpm release:publish-experimental` publishes them with the person's npm login.
5. `git checkout -- .` and `git clean` drop the snapshot versions.
6. `scripts/ensure-trusted-publishers.mjs` gives every new package the trusted publisher
   above.

Steps 5 and 6 run even when step 4 fails partway, so a package that did get published still
gets its trusted publisher. The command then exits with step 4's failure.

## New packages and trusted publishers

A new package is first published by the experimental release, by hand, so npm has no
trusted publisher for it until something sets one. Step 6 does that the moment the package
first exists on npm, while the person is still logged in, so the next release from CI can
publish it.

`scripts/ensure-trusted-publishers.mjs`:

- Takes the same publishable set as `scripts/verify-published.mjs`.
- Skips every package that is in the latest `v*` release tag, read from git: CI published it,
  which only works through its trusted publisher, and the release workflow tags a commit only
  once every package is live. Only packages added (or renamed) since then are checked, so a
  run with no new packages makes no npm calls at all. Local tags that are behind only mean
  more packages are checked.
- Runs `npm trust list` on each new package, and
  `npm trust github <package> --repo lowdefy/lowdefy --file release.yaml --env publish --allow-publish --allow-stage-publish --yes`
  on each one with no trusted publisher, 2 seconds apart (npm's advice for bulk changes).
- Reports a package that already has a different trusted publisher (another workflow file,
  repository or environment) and leaves it alone: revoke it with
  `npm trust revoke <package> --id <id>` and run the script again.
- Prints what it set and what already had one. A second run changes nothing.
- Needs npm 11.15 or later and a login with 2FA when there are new packages. Tick "skip 2FA
  for 5 minutes" on the first prompt to cover the batch.

A package first published some other way (an `npm publish` by hand, a run that stopped
before step 6) has no trusted publisher. It is still new until the next release tag, so run
the script by hand from the repository root before the next release:

```bash
npm login
node scripts/ensure-trusted-publishers.mjs
```

If a release already failed on a package with `E404 Not Found - PUT`, run the script, then
re-run the `publish` job. `scripts/verify-published.mjs` passes once every package is live.
