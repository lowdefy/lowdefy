---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/engine': minor
'@lowdefy/helpers': minor
'@lowdefy/block-utils': minor
'@lowdefy/operators': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'lowdefy': minor
'@lowdefy/actions-core': minor
'@lowdefy/blocks-basic': minor
---

feat: Config-aware error tracing and Sentry integration

**Config-Aware Error Tracing (#1940)**

- Errors now trace back to exact YAML config locations with file:line
- Clickable VSCode links in terminal and browser
- Build-time validation catches typos with "Did you mean?" suggestions
- Service vs Config error classification

**Sentry Integration (#1945)**

- Zero-config Sentry support - just set SENTRY_DSN
- Client and server error capture with Lowdefy context (pageId, blockId, config location)
- Configurable sampling rates, session replay, user feedback
- Graceful no-op when DSN not set
