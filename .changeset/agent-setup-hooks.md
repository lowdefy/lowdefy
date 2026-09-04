---
'lowdefy': minor
'@lowdefy/build': patch
'@lowdefy/docs': patch
---

feat(cli): `lowdefy agent-setup` installs verification hooks; `check` reports unset `_build.env` names

`agent-setup` writes `.claude/hooks/lowdefy-build-status.mjs` and registers it as a Claude Code `PostToolUse` hook, so after every edit to Lowdefy config the agent is told what the running dev server saw (build errors and warnings, plus the newest server and browser errors) without running a build. It costs one HTTP request and stays silent when no dev server is running, so it is safe to commit for the whole team. The `--git-hooks` flag additionally installs a pre-commit hook that runs `lowdefy check --json` over the staged config and then the journeys covering the pages those files touch, wiring itself into lefthook or husky when the project already uses one. The `lowdefy-config` skill states a definition of done. The `secrets` check also reports a `_build.env` name with no default that the build environment did not set, which was previously inlined as `null` with no error.
