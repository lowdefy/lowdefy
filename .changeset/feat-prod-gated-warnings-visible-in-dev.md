---
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/server-dev': minor
---

feat: Mark build warnings that fail the production build as "fails in prod" in dev.

Some build checks (`_state` in request properties, `_payload`/`_step`/request/`Link`/`CallAPI`/
websocket/`Dynamic` endpoint references) are warnings under `lowdefy dev` but errors under
`lowdefy build`. They now say so wherever a developer or agent reads them:

- `buildStatus.json` entries (served by `GET /lowdefy-docs/build-status` and `lowdefy_build_status`)
  and `BuildError.warnings` carry `prodError: true`.
- The dev terminal prints `[ConfigWarning · fails in prod] …`.
- The dev error bar badges the entry `fails in prod`, turns dark orange instead of yellow, and says
  `(fails in prod)` in the copy-all text.

The messages of these checks now all say what to do about the problem, not only what is wrong. No
gating change: a prod-gated warning still does not fail the dev build.
