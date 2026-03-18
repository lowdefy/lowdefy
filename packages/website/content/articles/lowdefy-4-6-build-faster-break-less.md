---
title: 'Lowdefy 4.6: Exact Error Messages, Faster Builds, Tighter AI Loops'
subtitle: '568 commits, 28 packages, 6 new packages, 740 new e2e tests — built for humans and AI agents'
authorId: 'gerrie'
publishedAt: '2026-03-09'
readTimeMinutes: 10
tags:
  - 'Release'
  - 'Developer Experience'
  - 'AI'
---

Lowdefy 4.6 is the largest release since v4. It spans 568 commits, touches 28 packages, adds 6 new packages, and includes roughly 740 new end-to-end tests. The headline feature is a config-aware error system that traces every failure to the exact file and line of your YAML config. But the release has a deeper motivation.

We built 4.6 for humans and AI agents.

Agents generate apps in a loop: write config, build, read errors, fix, repeat. The quality of that loop determines the quality of the output. Vague errors mean more iterations and worse results. Silent failures mean shipped bugs. v4.6 attacks every part of that loop, making the build faster, errors more precise, and the entire feedback cycle tight enough for agents to produce reliable apps on the first pass.

The structural advantage of config-driven development is that config can be validated exhaustively at build time. This is challenging with code. A TypeScript compiler catches type errors, but it can't tell you that your button links to a page that doesn't exist, or that your `_state` reference points to a block that isn't on the page. Lowdefy's build can because it sees the entire app as a declarative graph. v4.6 leans into that advantage.

## Errors that point to your config

Before 4.6, a build failure told you something was wrong. Tracing it to the exact line in your YAML, possibly buried three `_ref` imports deep, was manual work. You'd grep, guess, rebuild, repeat.

Now every error traces back to the source:

```
> app/pages/dashboard.yaml:34
[ConfigError] Block type "Buton" not found. Did you mean "Button"?
```

That file path is a clickable VSCode link. It opens the file at the right line. In production, the same location data flows into log-drains, or Sentry.

For an agent, this is the difference between "something broke somewhere" and "fix line 34 of dashboard.yaml, you misspelled Button." The agent reads the error, navigates to the exact location, and fixes it. No guessing. One iteration instead of five.

### Reference validation

A whole class of silent failures is now caught at build time, and this opens the possibility to add more checks in the future. These are the bugs where nothing happens and nobody knows why, until a user reports it:

- `_state` references a key but no input block with that id exists on the page
- `_state` used inside request properties, where client state isn't available
- `_payload` references a key that doesn't match the request's payload definition
- A Request action references a request that doesn't exist on the page
- A Link action or menu item points to a nonexistent page
- A request references a connection that hasn't been defined
- `_step` references a step missing from the API endpoint routine

Each check produces a warning in dev mode and an error in production builds. The build is also smart enough to recognize state keys set programmatically by SetState actions, so it won't warn about dynamic state that's initialized at runtime.

For agents, reference validation is where config's structural advantage becomes concrete. An agent generating a page with three requests and a dozen state references gets immediate feedback on every broken link in the graph.

### Schema validation

Every default block, operator, action, and connection now has a schema definition. Invalid properties, wrong types, missing required fields, all caught with a specific message pointing to the exact config location. When config passes the build, it works.

Schema validation is also smart about noise. Cascading patterns can produce multiple errors where you get five messages when one field is wrong. v4.6 filters those cascades so you see the actual problem.

### Collected errors

Previously, the build stopped at the first error. Now it collects errors across all build steps and reports them together. An agent generating a full page gets the complete list of problems in one build cycle, not one error per rebuild.

### Build check suppression

Sometimes the build's checks don't apply: dynamic state set by custom blocks at runtime, multi-app monorepos with conditional config, work-in-progress features. The `~ignoreBuildChecks` property suppresses validation per config subtree:

```yaml
pages:
  - id: dynamic-page
    type: Box
    ~ignoreBuildChecks:
      - state-refs
      - types
    blocks:
      - id: block1
        type: TextInput
        properties:
          value:
            _state: dynamicField # no warning
```

Suppression cascades to all descendants. Available slugs: `state-refs`, `payload-refs`, `step-refs`, `link-refs`, `request-refs`, `connection-refs`, `types`, `schema`. Setting it to `true` suppresses everything.

### UserError and Sentry

Not all errors are bugs. The new `UserError` class represents expected user-facing errors like validation failures and intentional throws from the `Throw` action. These log to the browser console only and never reach the server terminal or Sentry. Server logs stay clean.

For production error tracking, set the `SENTRY_DSN` environment variable. Lowdefy captures errors on both client and server with full context: pageId, blockId, and the config location that triggered the error. No configuration beyond the DSN. When it's not set, zero overhead.

## JIT dev-server page building

The dev server no longer builds every page at startup. Pages are built on demand. When you navigate to one, that page is compiled just in time.

The architecture splits the build into two phases: a fast skeleton build that resolves app-level config (connections, auth, menus) once at startup, and JIT page builds that resolve individual pages from their source files on first visit. A file dependency map tracks which config files affect which pages. When you change a file, only the affected pages are invalidated and rebuilt on the next visit. Unchanged pages are served from cache.

This is the foundation for significant build speed improvements coming in a follow-up releases. The architecture is in place (skeleton build, page registry, dependency tracking, cache invalidation) and we're now optimizing the hot path.

## `_js` hot reload

In the dev server, changes to `_js` operator code no longer trigger a Next.js rebuild.

Previously, `_js` functions were bundled by webpack. Any edit meant a full Next.js rebuild, slow even for a one-line change. The dev server now extracts `_js` code into separate map files served dynamically. The server checks file modification times on each request. The client fetches the latest map via an API endpoint. Webpack never sees the change.

The result: edit a `_js` function, the Lowdefy build runs (fast), the browser picks up the new code. No webpack. No full page reload. In production, `_js` code is still part of the full build bundle for secure code bundling.

For the parts of a Lowdefy app that need custom JavaScript (data transformations, complex conditional logic, integration glue), this removes a wall from the dev iteration cycle. An agent editing `_js` code gets the same fast feedback loop as editing YAML config.

## E2E testing framework

Lowdefy now has a first-class end-to-end testing framework built on Playwright. The `@lowdefy/e2e-utils` package provides the `ldf` fixture, a testing API with deep integration into the Lowdefy runtime.

This is where config-driven development shows another structural advantage. Because Lowdefy controls the runtime, the test framework can reach into engine state, block validation, and request lifecycle directly. You're not scraping the DOM to figure out if a form submitted. You're asserting against the actual state of the application.

`ldf.block('id')` returns a proxy with `.do.*` and `.expect.*` methods specific to the block type. A TextInput gets `.do.fill()`, `.do.clear()`, `.expect.value()`. A Button gets `.do.click()`, `.expect.text()`. Every block gets `.expect.validationError()` and `.expect.validationSuccess()`. State assertions go through the engine, not the DOM: `ldf.state('key').expect.toBe(value)`. Request lifecycle is first-class: `ldf.request('id').expect.toFinish()`, `.expect.toHaveResponse(data)` with partial matching. Mocking is built in, with inline per-test overrides or a `mocks.yaml` file with wildcards applied to every test. User auth, navigation, and URL assertions are all covered.

We used the framework internally to write roughly 740 tests covering all 63 antd blocks and the core basic blocks. An agent can do the same for your app. Generate a page, generate its tests, run them, fix what fails. The test framework closes the verification gap. The agent doesn't just generate config, it proves the config works.

A detailed article on the e2e framework with full examples and setup instructions will follow.

## Everything else

**Centralized logger.** New `@lowdefy/logger` package with structured pino logging on the server, an ora-based spinner in the CLI, and formatted browser console output. Error cause chains display as indented "Caused by:" lines up to three levels deep. Cleaner, more readable build output.

**onChange value.** Input blocks now pass their current value to the `onChange` event.

## Upgrading

v4.6 is a minor version bump. Existing apps work without changes.

The new build checks may surface warnings for config issues that were previously silent, like undefined state references, broken links, and schema violations. These are warnings in dev mode and errors for production builds. They won't block your dev workflow, but they will prevent shipping broken config. Use `~ignoreBuildChecks` to suppress any that don't apply to your setup.

## The DX dividend

Everything we built for agents makes humans faster too. Clickable error links, instant rebuilds, precise validation, and maybe the first ever e2e test solution that is not flaky. These aren't AI features. They're developer experience features that happen to improve the agentic coding experience for Lowdefy.

The feedback loop is the same whether a human or an agent is driving it. We made the loop tighter. Config can be validated exhaustively because it's declarative than code. v4.6 makes that validation precise, fast, and actionable.

Build faster. Review less. Break nothing.
