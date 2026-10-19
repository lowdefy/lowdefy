---
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/docs-content': patch
---

feat: `~ignoreBuildChecks` takes plugin rule slugs, and build errors print their slug

- `~ignoreBuildChecks` accepts any kebab-case slug, so it can name plugin build check rules, and `plugin-checks` silences every plugin rule under a node. A slug that is not kebab-case still fails the build.
- A build error or warning from a check prints its slug after the error name, for example `[ConfigWarning · state-refs] ...`, so the slug to silence is on screen.
- The `~ignoreBuildChecks` schema accepts every built-in slug wherever the key is allowed. It listed only 8 of the 15 before.
