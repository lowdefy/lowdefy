#!/usr/bin/env bash
#
# Vercel Ignored Build Step for apps deployed from this monorepo. Exit 1 builds, exit 0 skips.
#
# Deploys follow npm releases, not merges:
#   - changeset-release/main: the "Publish new release" PR, previewed before it is merged.
#   - main, only for the merge of that PR — the commit the release workflow publishes to npm.
#     Release PRs from develop also merge into main, but publish nothing.
# Everything else is skipped; develop and feature branches churn with every merged feature.
#
# Set as `ignoreCommand` in vercel.json, so it applies to every Vercel project deployed from this
# Root Directory and overrides the Ignored Build Step setting in their dashboards.

if [ "$VERCEL_GIT_COMMIT_REF" = "changeset-release/main" ]; then
  exit 1
fi

# Relies on the version PR being merged with a merge commit (not squashed), which keeps the
# head branch in the message: "Merge pull request #N from lowdefy/changeset-release/main".
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ] &&
  [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"from lowdefy/changeset-release/main"* ]]; then
  exit 1
fi

exit 0
