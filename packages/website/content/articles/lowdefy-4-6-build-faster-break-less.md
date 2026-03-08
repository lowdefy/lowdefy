---
title: "Lowdefy 4.6: Build Faster, Break Less"
subtitle: A complete overhaul of error tracing, schema validation, and dev server performance - changes that compound especially well when building with AI
authorId: gerrie
publishedAt: 2026-03-08
readTimeMinutes: 8
tags:
  - Release
  - Developer-Experience
  - AI
---

The biggest theme of Lowdefy 4.6 is catching problems before they ship. This release overhauls how Lowdefy validates your config, reports errors, and runs the dev server. Changes that compound especially well when you're building with AI tools like Claude Code.

## The Error System: Know Exactly What's Wrong and Where

The headline of this release is a complete rethink of how Lowdefy handles errors. Before 4.6, errors were often vague, a build failure might tell you something was wrong, but tracing it back to the exact line in your YAML config was manual detective work. That changes with Lowdefy 4.6.

### Errors Point to Your Config

Every error now traces back to the exact file and line in your YAML config. When a build fails, you see something like:

```
→ app/pages/dashboard.yaml:34
ConfigError: Block type "Buton" not found. Did you mean "Button"?
  
```

That file path is a clickable link. In VSCode's terminal it opens the file at the right line of config. In production, the same location data flows into Sentry. For AI-assisted development, this is transformative: Claude Code reads the error, navigates directly to the source, and fixes it, no guessing, no searching, less time debugging.

### Schema Validation for Every Plugin

Every block, operator, action, and connection now has a JSON schema. Invalid properties, wrong types, missing required fields, all caught with a specific message pointing to the exact line.

This is where AI-assisted development gets a real upgrade. When Claude Code writes config, the build immediately tells it what's wrong in precise terms. It autocorrects. Bugs and edge cases that would have been silent runtime failures: a typo in a property name, a string where a number was expected, a missing required field, are now caught with a clear descriptive error message and a stack trace to the exact line of config.

Schema validation is also smart about noise. Errors from JSON Schema's anyOf/oneOf patterns are filtered so you only see the specific problem, not a cascade of unhelpful alternatives. Duplicate errors at the same location are deduplicated.

### Reference Validation

A whole class of "nothing happens and I don't know why" bugs is now caught at build time:

- **State references**: `_state` references a key but no input block with that id exists on the page. The build tells you, suggests you might have a typo, or reminds you to initialize with SetState. It's also smart enough to recognize state keys that are set programmatically by SetState actions, reducing false warnings.
- **Server-side state**: `_state` used inside request properties, where state isn't available. The build explains the problem and tells you to use `_payload` instead.
- **Payload references**: `_payload` references a key that doesn't exist in the request's payload definition.
- **Request references**: A Request action references a request that doesn't exist on the page.
- **Link references**: A Link action or menu item points to a page that doesn't exist.
- **Connection references**: A request references a connection that hasn't been defined.
- **Step references**: `_step` references a step that doesn't exist in the API endpoint routine.

These checks are warnings in development and become errors in production builds, so they won't block your dev workflow but will prevent shipping broken config.

### "Did You Mean?" Suggestions

When you use a block, operator, action, or connection type that doesn't exist, the build checks for close matches and suggests corrections. A typo like `TextImput` gets caught with a "Did you mean TextInput?" suggestion.

### Collected Errors, Not Just the First One

Previously, the build would stop at the first error. Now errors are collected across all build steps and reported together. For production builds, you see the full picture at once instead of fixing one error, rebuilding, finding the next, and repeating.

### Build Check Suppression

Sometimes the build's checks don't apply, dynamic state set at runtime by custom blocks, multi-app monorepos with conditional config, work-in-progress features. The new `~ignoreBuildChecks` property lets you suppress validation per config subtree:

```yaml
pages:
  - id: dynamic-page
    type: Box
    ~ignoreBuildChecks: true
    blocks:
      - id: block1
        type: TextInput
        properties:
          value:
            _state: dynamicField  # no warning

  - id: another-page
    type: Box
    ~ignoreBuildChecks:
      - state-refs  # suppress only state reference warnings
      - types       # suppress only type validation
```

Available slugs: `state-refs`, `payload-refs`, `step-refs`, `link-refs`, `request-refs`, `connection-refs`, `types`, `schema`. Suppression cascades to all descendant config objects, so setting it on a page covers all its blocks.

### Auth Validation

If you configure auth providers but forget to set the `NEXTAUTH_SECRET` environment variable, the build catches it with a clear message instead of leaving you with a cryptic runtime failure.

### UserError: Clean Error Routing

Not all errors are bugs. The new `UserError` class represents expected user-facing errors, validation failures, intentional throws. These log to the browser console only and are never sent to the server terminal or Sentry, keeping your server logs clean and your error tracking focused on real issues. The `Throw` action now uses `UserError` automatically.

### Sentry Integration

For production apps, set the `SENTRY_DSN` environment variable and Lowdefy automatically captures errors on both client and server with full context: pageId, blockId, and the config location that triggered the error. Configurable sampling rates, session replay, and user feedback are supported. When the DSN isn't set, it's a complete no-op with zero overhead.

## JIT Page Building: Near Instant Dev Rebuilds

The dev server no longer builds every page upfront. When you navigate to a page, it's built on demand, just that page, just in time.

For large apps, this turns a multi-second full rebuild into a near-instant targeted build. A file dependency map tracks which config files affect which pages, so when you change a file, only the affected pages are invalidated and rebuilt on next visit. The page cache means revisiting an unchanged page is instant.

When you're iterating with AI, the build is the bottleneck. You make a change, wait for the build, check the result, repeat. JIT page building shrinks that wait to nearly nothing. Combined with the error system — where each rebuild gives precise, actionable feedback — the cycle of write-build-fix becomes fast and tight.

Build errors are also displayed inline in the browser instead of just the terminal, so you don't need to switch context to see what went wrong.

*A dedicated article with more specific details on JIT page building will be published soon.*

## E2E Testing Framework

Lowdefy now has a first-class end-to-end testing story built on Playwright. The new `@lowdefy/e2e-utils` package provides:

- A locator-first API: `ldf.block('id').do.*` for actions, `ldf.block('id').expect.*` for assertions
- Request mocking with static YAML files and per-test overrides
- State and URL assertions: `ldf.state('key').expect.toBe()`, `ldf.url().expect.toBe()`
- Scaffold tooling: `npx @lowdefy/e2e-utils` sets up your project with templates and config
- Mock user support: set `LOWDEFY_DEV_USER` to bypass auth in dev/test environments

This is the foundation for testing Lowdefy apps with confidence. We've already used it internally — this release includes approximately 740 new e2e tests covering all 63 blocks-antd blocks and the core blocks-basic components.

*A dedicated article on the e2e testing framework and how to use it in your apps will follow shortly.*

## Everything Else

- **Centralized logger**: Cleaner terminal output with clickable links and dimmed low-priority lines. Build output is more readable and structured.
- **Port-in-use check**: Clear error message when the dev server port is already taken.
- **Block onChange value**: Input blocks now pass their current value to the `onChange` event.

## Upgrading

This is a minor version bump. Existing apps should work without changes. The new build checks may surface warnings for config issues that were previously silent. These are warnings in dev mode and errors at production build. Use `~ignoreBuildChecks` to suppress any that don't apply to your use case.

## What's Next

Lowdefy 4.6 is about tightening the feedback loop. Errors tell you exactly what's wrong and where, build catches problems before they ship, and drastic dev server build time improvement. These improvements makes the AI more effective, it gets better feedback, it responds faster, and the result is more reliable.

Build faster. Break less.
