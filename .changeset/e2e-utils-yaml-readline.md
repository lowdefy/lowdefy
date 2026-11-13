---
'@lowdefy/e2e-utils': minor
---

feat(e2e-utils): Ask `lowdefy-e2e init` questions with typed answers, and drop `js-yaml` and `prompts`

`lowdefy-e2e init` no longer uses the `prompts` library, which has had no release since 2021. Its questions now take typed answers:

- **Which apps to set up** (only with more than one app) lists the apps numbered. Type the numbers to set up, such as `1,3`, or press Enter for all of them. Arrow keys and space no longer select apps.
- **MongoDB testing support** takes `y` or `n`; Enter keeps the default, no.
- **Which version to install** lists the versions numbered. Type a number, or press Enter for Stable.

An invalid answer asks again. Ctrl+C or Ctrl+D cancels the setup as before. The answers can also be piped in, for example `printf '1,2\nn\n\n' | npx lowdefy-e2e init`.

Mock files (`e2e/mocks.yaml`) and the `pnpm-workspace.yaml` that `init` updates are now read with the `yaml` package instead of `js-yaml` 4. Mock files load as before: `<<` merge keys merge, unquoted dates and date-times load as `Date` objects, `yes`/`no`/`on`/`off` stay strings, and a file with more than one YAML document still fails to load. A few rarely used forms now load differently:

- `0b101` and `+0x1F` load as strings instead of numbers. Write the number in decimal.
- `+.5` loads as the number `0.5` instead of a string, and a date without leading zeros (`2026-1-5`) loads as a `Date` instead of a string.
- `!!set`, `!!omap` and `!!pairs` load as a JavaScript `Set`, `Map` and list of single-key objects. Write a plain list or mapping instead.
- A key that is a list or mapping (`? [a, b]`), or a `null`/`~` key, becomes a different string key.
- An unknown tag such as `!foo bar` loads the plain value instead of failing to load.
- A `%YAML 1.1` directive at the top of the file now applies YAML 1.1 rules, so `yes` loads as `true`.

`init` writes `pnpm-workspace.yaml` keys that need quoting with double quotes (`"@swc/core": true`) instead of single quotes.
