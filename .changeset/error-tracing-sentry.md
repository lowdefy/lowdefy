---
'lowdefy': minor
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/errors': minor
'@lowdefy/engine': minor
'@lowdefy/helpers': minor
'@lowdefy/node-utils': minor
'@lowdefy/block-utils': minor
'@lowdefy/operators': minor
'@lowdefy/operators-js': minor
'@lowdefy/operators-change-case': minor
'@lowdefy/operators-diff': minor
'@lowdefy/operators-jsonata': minor
'@lowdefy/operators-moment': minor
'@lowdefy/operators-mql': minor
'@lowdefy/operators-nunjucks': minor
'@lowdefy/operators-uuid': minor
'@lowdefy/operators-yaml': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/actions-core': minor
'@lowdefy/blocks-basic': minor
'@lowdefy/connection-axios-http': patch
'@lowdefy/connection-knex': patch
'@lowdefy/connection-redis': patch
'@lowdefy/connection-sendgrid': patch
---

feat: Config-aware error tracing and Sentry integration

**Config-Aware Error Tracing (#1940)**

- Errors now trace back to exact YAML config locations with file:line
- Clickable VSCode links in terminal and browser
- Build-time validation catches typos with "Did you mean?" suggestions
- Service vs Config error classification

**Plugin Error Refactoring**

- Operators throw simple error messages without formatting
- Parsers (WebParser, ServerParser, BuildParser) format errors with received value and location
- Removed redundant "Operator Error:" prefix from error messages
- Consistent error format: "{message} Received: {params} at {location}."
- Actions and connections also simplified: removed inline `received` from error messages (interface layer adds it)
- Connection plugins (axios-http, knex, redis, sendgrid) no longer expose raw response data in errors

**Error Class Hierarchy**

- Unified error system in `@lowdefy/errors` with all error classes
  - `@lowdefy/errors/build` - Build-time classes with sync location resolution
- Error classes: `LowdefyError`, `ConfigError`, `ConfigWarning`, `PluginError`, `ServiceError`
- `ConfigWarning` supports `prodError` flag to throw in production builds
- `ServiceError.isServiceError()` detects network/timeout/5xx errors
- `~ignoreBuildChecks` cascades through descendants to suppress warnings/errors

**Build Error Collection**

- Errors collected in `context.errors[]` instead of throwing immediately
- `tryBuildStep()` wrapper catches and collects errors from build steps
- All errors logged together before summary message for proper ordering

**Sentry Integration (#1945)**

- Zero-config Sentry support - just set SENTRY_DSN
- Client and server error capture with Lowdefy context (pageId, blockId, config location)
- Configurable sampling rates, session replay, user feedback
- Graceful no-op when DSN not set
