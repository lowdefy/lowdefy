# Releasing

How Lowdefy packages reach npm: the release from CI, the experimental release a person runs,
and the npm trusted publishers CI needs, including what to do when a release fails on one.

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
package sent, re-run the failed jobs once `npm view lowdefy@<version>` finds them. If the
"Publish to npm" step shows `E404 Not Found - PUT` for the missing packages, waiting won't
help: see [When a release fails with E404](#when-a-release-fails-with-e404).

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
missing. A package that has it but has never published through it fails the same way when
npm has expired it (see [Trusted publishers](#trusted-publishers)). Release 7.2.0 failed like
this on all six packages new in that release.

## Experimental release

`pnpm release:experimental` publishes a snapshot of the current branch under the
`experimental` dist-tag, from a person's machine:

1. `scripts/pull-before-release.mjs` refuses uncommitted changes and fast-forwards the branch.
2. `npm whoami || npm login`.
3. `pnpm release:version-experimental` versions every package as
   `0.0.0-experimental-<timestamp>` and builds.
4. `pnpm release:publish-experimental` publishes them with the person's npm login.
5. `git checkout -- .` and `git clean` drop the snapshot versions, even when step 4 failed
   partway. The command then exits with step 4's result.

It does not touch trusted publishers. A trusted publisher created here would usually expire
before the next release from CI uses it, which is how 7.2.0 broke.

## Trusted publishers

npm rules that decide how trusted publishers are handled here:

- **A package must exist on npm before it can have a trusted publisher.** A new package's first
  publish is the experimental release, by hand. CI cannot publish a package that has never
  been published.
- **A new trusted publisher expires if it has not published within 2 days of being created**
  ([npm docs](https://docs.npmjs.com/trusted-publishers)). npm still lists an expired one in
  `npm trust list`, with the same settings as a working one, so the list can't tell you
  whether it works. Once it has published once, it never expires.
- **The registry records which trusted publisher published each version**, as
  `_npmUser.trustedPublisher.oidcConfigId` (`npm view <package>@<version> _npmUser`). A
  trusted publisher whose id appears there has published, so it works.

So a new package's trusted publisher is created right before the release that first publishes
it, never days ahead.

### Before a release with new packages

Run this from the repository root before merging the "Publish new release" pull request:

```bash
git fetch --tags
npm login   # if `npm whoami` fails
pnpm release:trusted-publishers
```

Then merge the release pull request within 2 days. Tick "skip 2FA for 5 minutes" on the first
2FA prompt to cover the batch. It needs npm 11.15 or later (`npm install -g npm@latest`).

`pnpm release:trusted-publishers` (`scripts/ensure-trusted-publishers.mjs`):

- Takes the same publishable set as `scripts/verify-published.mjs`.
- Skips every package that is in the latest `v*` release tag, read from git: CI published it,
  which only works through its trusted publisher, and the release workflow tags a commit only
  once every package is live. Only packages added (or renamed) since then are checked, so a
  run with no new packages makes no npm calls and needs no login. Local tags that are behind
  only mean more packages are checked, so fetch them first.
- Runs `npm trust list` on each new package and:
  - **has the release trusted publisher, and a version was published through it**: leaves it.
  - **has the release trusted publisher, but nothing was ever published through it**: it may
    have expired, so revokes it and creates it again, which starts a new 2-day window.
  - **has no trusted publisher**: creates it with
    `npm trust github <package> --repo lowdefy/lowdefy --file release.yaml --env publish --allow-publish --allow-stage-publish --yes`.
  - **has a different trusted publisher** (another workflow file, repository or environment):
    reports it and leaves it alone. Revoke it with `npm trust revoke <package> --id <id>` and
    run the script again.
  - **is not on npm**: reports it. Publish an experimental (`pnpm release:experimental`) and
    run the script again.
- Waits 2 seconds between npm calls (npm's advice for bulk changes) and prints what it did. It
  exits with an error when any package still needs a person to act.

Running it again right away changes nothing for packages it just created: they are still
unused, so it replaces them, which only restarts their 2-day window.

### When a release fails with E404

The signs: the release comment on the merged "Publish new release" pull request says the
release was not published and "Verify all packages published" failed, the verify step lists
the missing packages, and the "Publish to npm" step shows, for each of them:

```
an error occurred while publishing @lowdefy/<package>: E404 Not Found - PUT https://registry.npmjs.org/@lowdefy%2f<package> - Not found
```

npm answers 404 when it would not accept CI's login for that package, so the trusted publisher
is missing or expired. Every other package is already live, and `lowdefy@latest` points at
the broken release until this is fixed. To recover:

1. From the repository root, on an up-to-date `main` or `develop`:
   ```bash
   git fetch --tags
   pnpm release:trusted-publishers
   ```
   It replaces the expired trusted publishers and creates missing ones.
2. Re-run the failed jobs of that release run in the Actions tab, or
   `gh run rerun <run-id> -R lowdefy/lowdefy --failed`, within 2 days. The publish steps skip
   what is already on npm, so only the missing packages are published. The verify step then
   passes, and the job tags the commit and creates the draft GitHub release.
3. Check: `npm view @lowdefy/<package>@<version> _npmUser` shows `GitHub Actions` for each
   package that was missing.

If they still fail with E404, the trusted publisher settings are wrong. Compare
`npm trust list <package>` with the block in [Release from CI](#release-from-ci): every field
is case-sensitive, and npm doesn't check them when they are saved.

To fix one package by hand, without the script:

```bash
npm trust list @lowdefy/<package>              # note the id
npm trust revoke @lowdefy/<package> --id <id>
npm trust github @lowdefy/<package> --repo lowdefy/lowdefy --file release.yaml --env publish --allow-publish --allow-stage-publish --yes
```
