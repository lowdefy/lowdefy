---
'lowdefy': minor
---

feat(cli): Add `lowdefy mobile build` and `lowdefy mobile submit`

`lowdefy mobile build --shell <id> --env <environment>` writes the shell project, then raises the store version: it reads the latest finished EAS build on the environment's channel per store and uses the next patch of the shell's `version` (`major.minor`), or `<major>.<minor>.0` for a new `major.minor` or a first build. Both stores get the higher of the two. Then it runs `eas build --profile <environment>`, interactive by default so the first build can sign in to Apple and Google. `--non-interactive` queues the build for CI without waiting, `--platform ios|android|all` picks the stores, `--local` builds on this machine and `--profile development` builds a development client of the shell's dev variant with no store version.

`lowdefy mobile submit` uploads the latest build to TestFlight and Google Play internal testing (`eas submit --latest`); review and promotion stay with a person.

EAS commands now run with `LOWDEFY_SHELL_CONFIG` pointing at the project's `shell.json`, so eas reads the shell's own app config on this machine.
