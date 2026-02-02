---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/cli': minor
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

**Operator Error Refactoring**

- Operators throw simple error messages without formatting
- Parsers (WebParser, ServerParser, BuildParser) format errors with received value and location
- Removed redundant "Operator Error:" prefix from error messages
- Consistent error format: "{message} Received: {params} at {location}."

**Error Class Hierarchy**

- Unified error system in `@lowdefy/errors` with environment-specific subpaths:
  - `@lowdefy/errors/server` - Base classes for server/API runtime
  - `@lowdefy/errors/build` - Build-time classes with sync location resolution
  - `@lowdefy/errors/client` - Client-side classes with async location resolution
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
