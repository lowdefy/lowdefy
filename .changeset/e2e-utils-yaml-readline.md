---
'@lowdefy/e2e-utils': minor
---

feat(e2e-utils): Ask `lowdefy-e2e init` questions with typed answers, and drop `js-yaml` and `prompts`

`lowdefy-e2e init` no longer uses the `prompts` library, which has had no release since 2021. Its questions now take typed answers:

- **Which apps to set up** (only with more than one app) lists the apps numbered. Type the numbers to set up, such as `1,3`, or press Enter for all of them. Arrow keys and space no longer select apps.
- **MongoDB testing support** takes `y` or `n`; Enter keeps the default, no.
- **Which version to install** lists the versions numbered. Type a number, or press Enter for Stable.

An invalid answer asks again. Ctrl+C or Ctrl+D cancels the setup as before. The answers can also be piped in, for example `printf '1,2\nn\n\n' | npx lowdefy-e2e init`.

Mock files (`e2e/mocks.yaml`) and the `pnpm-workspace.yaml` that `init` updates are now read with the `yaml` package instead of `js-yaml`. Mock files load as before: `<<` merge keys merge, and unquoted dates load as `Date` objects. `init` writes `pnpm-workspace.yaml` keys that need quoting with double quotes (`"@swc/core": true`) instead of single quotes.
