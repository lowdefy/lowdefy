---
title: "Lowdefy v6: What's New"
subtitle: 'Next.js is out, Hono and Vite are in. Websockets, notification emails, dynamic pages, scheduled endpoints, LLM steps in routines, and a dev server built for coding agents.'
authorId: 'gerrie'
publishedAt: '2026-09-09'
readTimeMinutes: 14
tags:
  - 'Release'
  - 'Hono'
  - 'Vite'
  - 'Agents'
draft: false
---

Lowdefy v6 swaps the framework under your app. Next.js is gone. The server is a [Hono](https://hono.dev) app, the client is a [Vite](https://vite.dev)-built React bundle, and authentication runs on [Auth.js](https://authjs.dev). Your YAML does not change. `lowdefy dev`, `lowdefy build` and `lowdefy start` do what they did before, and the [migration guide](https://docs.lowdefy.com/v5-to-v6) fits on one screen.

What you get for the swap: a dev server that reloads a plugin change in about 700 milliseconds instead of rebuilding for 20 to 40 seconds, and a production server you copy into a container and run with one command. The rest of the release is built on that base. Realtime channels, notification emails, server-resolved pages, cron schedules, LLM calls as routine steps, your API exposed as an MCP server, and a set of tools that let a coding agent see what it built.

## Hono and Vite replace Next.js

The v5 dev loop had a hard floor. Changing a plugin meant a Next.js rebuild and a server restart. In v6 the dev server runs Vite with the Hono app mounted as middleware, so plugin changes go through Vite's hot module replacement and config changes push a reload over server-sent events. Warm boots skip the install step entirely when `package.json` has not changed, which drops a restart from around 30 seconds to a few.

Page navigation is now client-side. The first page load embeds config in the HTML. Navigating fetches the next page's config from the API without a full browser reload, so page state and the websocket connection survive a route change.

Production builds write a complete, runnable server to `.lowdefy/server`:

```bash
lowdefy build
cd .lowdefy/server
node src/index.js
```

That folder is what you deploy. `LOWDEFY_BUILD_OUTPUT_STANDALONE` is gone because there is no other kind of output.

The breaking changes are short. Sessions invalidate once, because the cookie prefix changes from `next-auth.*` to `authjs.*`. `NEXTAUTH_SECRET` becomes `AUTH_SECRET`, and the build fails with a config error if auth providers are configured without it. A custom `next.config.js` no longer applies; bundler customizations move to a `vite.config.js` in the server directory. `NEXT_PUBLIC_SENTRY_DSN` becomes `SENTRY_DSN`, read at runtime, so rotating the DSN no longer requires a rebuild. The `auth:` schema itself, with its providers, adapters, callbacks and protected pages, is unchanged.

## Websockets

A new top-level `websockets:` key defines channels, and pages subscribe to them with `subscriptions:`. The Lowdefy server that serves your pages also pushes the messages, over one multiplexed connection, locally and on Vercel. No polling, no separate socket service.

```yaml
websockets:
  - id: ticker
    type: Interval
    properties:
      ms: 1000

pages:
  - id: dashboard
    type: PageHeaderMenu
    subscriptions:
      - websocketId: ticker
    blocks:
      - id: ticks
        type: Html
        properties:
          html:
            _string.concat:
              - 'Ticks: '
              - _websocket: ticker.lastMessage.tick
```

Channel types are plugins. `Channel` is a pub/sub relay and `Interval` emits timed ticks; both ship in `@lowdefy/websockets-core`. `MongoDBChangeStream` in the MongoDB connection pushes change events from a collection to subscribed pages. Channel `properties` are evaluated on the server per subscription, so `_user` and `_payload` make a channel user-specific, and subscribers whose evaluated properties are identical share one running source.

Pages subscribe on mount and unsubscribe on navigation. React to messages with `onMessage`, `onSubscribe` and `onError` events, or read channel state anywhere with the [`_websocket`](https://docs.lowdefy.com/websocket-subscriptions) operator. New `Publish`, `Subscribe` and `Unsubscribe` actions cover the dynamic cases. Channel access follows the same `auth` pattern as protected endpoints, with `public`, `protected` and `roles` lists under `auth.websockets`.

The client reconnects with backoff and resubscribes on its own, so a deploy or a serverless function hitting its time limit is invisible to users. Start with the [websockets introduction](https://docs.lowdefy.com/websockets-introduction).

## Notification emails

Apps can define [notifications](https://docs.lowdefy.com/notifications) in config: branded emails rendered from framework templates, sent over any SMTP provider. The framework renders. Storing the notification record and sending it stay in your routines, so any database works through its normal request types.

```yaml
notifications:
  - id: task-assigned
    type: NotificationEmail
    properties:
      subject: 'New task: {{ task.title }}'
      title: Task assigned to you
      message: |
        Hi {{ contact.name }},

        **{{ task.title }}** has been assigned to you.
      metadata:
        - label: Due
          value: '{{ task.due_date }}'
      button:
        label: View task
```

Template properties are Nunjucks data templates, and interpolated values are inert. A task title of `[click here](https://evil.example)` renders as literal text, never a link. A `RenderNotification` routine step renders one data item and returns `{ subject, title, preview, html, text, data }`, with `{ pageId, urlQuery }` links resolved to full URLs. Three templates ship: `NotificationEmail`, `DigestEmail` and `AlertEmail`. Custom templates are plain [React Email](https://react.email) plugin packages.

Branding lives under `app.email` and defaults from config you already have: `companyName` from the app's `name`, `primaryColor` from `theme.antd.token.colorPrimary`, and a `logo` that can be a path into `public/`. The new `SMTP` connection wraps nodemailer and works with SES, Postmark, Mailgun, Resend or a self-hosted server. Both `SMTP` and `SendGrid` accept a delivery `filter` so staging can redirect every email to a test inbox, and both return per-message send results.

`lowdefy emails` builds the app, renders a preview of every notification from its `testData`, and opens it in React Email's preview server. Modules can ship their own templates, scoped to the module entry, so installing a user-admin module twice never collides.

## Dynamic page content

Requests change the data on a page. The new [`Dynamic`](https://docs.lowdefy.com/dynamic-page-content) block changes the blocks. Point it at an API endpoint, and at page load the server runs that endpoint's routine in-process, validates the block config it returns, splices it into the page, and sends the result to the client. The client renders it like any other page.

```yaml
- id: insights
  type: Dynamic
  properties:
    endpointId: resolve_insights
    params:
      area: insights
    types:
      blocks:
        - Statistic
  slots:
    fallback:
      blocks:
        - id: insights_unavailable
          type: Html
          properties:
            html: Insights are unavailable right now.
```

The endpoint is a normal `InternalApi` routine. It receives `{ params, pageId, blockId, urlQuery }` and returns `{ blocks: [...] }`. Returned blocks are checked before they reach the client: types must be in the client bundle, properties are validated against block schemas, and `Request` action references must exist on the page. Client-side operators in returned config are escaped with one extra underscore, `__state` for `_state`, the same convention `_function` uses. If resolution fails, the `fallback` slot renders and the page still loads, unless you set `required: true`.

A dashboard whose sections depend on a plan or a feature flag, a form generated from a workflow definition in a database, a kanban board whose columns come from tenant config: these used to need a plugin or a rebuild. Now they are a routine.

## Scheduled endpoints

`Api` and `InternalApi` endpoints can declare `schedules` to run on a timer:

```yaml
id: purge-stale-conversations
type: Api
schedules:
  - cron: '0 6 * * *'
    payload: { mode: full }
  - cron: '*/15 * * * *'
    payload: { mode: incremental }
routine:
  - id: purge
    type: MongoDBDeleteMany
    connectionId: conversations
    properties:
      filter: { updatedAt: { $lt: { _payload: cutoff } } }
```

The build validates the cron syntax and writes a `schedules.json` manifest. On Vercel, `lowdefy vercel-output` generates the `crons` array from it on every deploy, so nothing is committed by hand. Scheduled runs hit `/api/cron/*` as a system context with no user session, secured by `CRON_SECRET`, and fail closed when it is unset.

Vercel only fires cron jobs on the production deployment, which meant staging schedules never ran. `config.cron.environments` declares your deployments once, and production forwards each environment's schedules to that environment's own cron route. Schedules can then be keyed by environment, with a `default` that others inherit and `[]` to switch crons off for a branch deploy.

Three more controls cover serverless execution. `async: true` on an endpoint answers `{ accepted: true }` immediately and runs the routine in the background. `detached: true` on a `CallApi` step runs the target in its own invocation with a fresh duration budget. `webhook: true` turns an endpoint into a third-party webhook receiver that gets the raw `{ body, query, headers }` and returns its response body verbatim, with caller verification as the routine's first step.

## LLM calls as routine steps

Every AI provider connection, Anthropic, OpenAI, Google and the AI Gateway, gains two request types: `GenerateText` and `GenerateObject`. They are single model calls usable as routine steps or page requests, and the type names are shared, so switching providers means changing a `connectionId`.

```yaml
routine:
  - id: classify
    type: GenerateObject
    connectionId: claude
    properties:
      model: claude-haiku-4-5
      prompt:
        _payload: ticket_text
      schema:
        type: object
        properties:
          category: { type: string }
          priority: { type: string, enum: [low, normal, urgent] }
```

`GenerateObject` returns data matching the JSON Schema you pass, which is the shape most routine decisions want: classify this ticket, extract these fields, pick this branch.

For work that needs tools, the new `CallAgent` step runs one of your [agents](https://docs.lowdefy.com/agents-introduction) to completion inside a routine. No chat UI, no stream. The agent loops through its tools until done and stores `{ text, finishReason, usage, toolCalls, toolResults }` in `_step`. Combined with schedules, a routine can run an agent every morning that summarizes yesterday's signups and flags anomalies, using the same endpoints the chat interface uses.

## Your API as an MCP server

A root `mcp` block lists the `Api` endpoints to expose as tools, and the server serves them at `/api/mcp` over streamable HTTP:

```yaml
mcp:
  name: my-app
  version: '1.0.0'
  title: My App
  websiteUrl: https://example.com
  icons:
    - src: https://example.com/icon-512.png
      mimeType: image/png
      sizes: ['512x512']
  endpoints:
    - create-ticket
    - search-customers
```

An endpoint's `description` and `payloadSchema` become the tool description and input schema, so both are required for exposed endpoints. Tool calls are authorized per request with the caller's session and flow through the same `_user` machinery as a button click.

Clients that cannot hold a session cookie, an MCP client or a service, authenticate through `auth.strategies`. An `apiKey` strategy reads an `X-API-Key` header, a `jwt` strategy reads a bearer token, and each grants the caller the strategy's roles. Unauthenticated calls to role-gated endpoints now return a 401 instead of a masked error.

## File storage on any provider

The S3 blocks are replaced by provider-neutral ones in `@lowdefy/blocks-files`: [`Upload`](https://docs.lowdefy.com/Upload), `UploadPhoto`, `UploadDragger` and `Download`. Upload blocks call an upload-policy request by id and support both POST form uploads and PUT body uploads, with progress on both. `AwsS3Bucket` connections accept an `endpoint` and `forcePathStyle`, which is the one-line change that makes Cloudflare R2, MinIO, DigitalOcean Spaces, Backblaze B2 and Wasabi work. New [`GoogleCloudStorage`](https://docs.lowdefy.com/GoogleCloudStorage) and [`AzureBlobStorage`](https://docs.lowdefy.com/AzureBlobStorage) plugins cover the other two clouds with matching request types.

`emitFileContent: true` reads the file in the browser and emits `{ name, size, type, content }` as the block value, for apps that store files through a routine and a server-side write request. Tiptap editors and `AgentChat` attachments upload through the same flow. The old `S3UploadButton` family keeps working as deprecated aliases, and `lowdefy upgrade` includes a codemod that renames them. See [hosting files](https://docs.lowdefy.com/hosting-files).

## Control flow in event actions

Event action lists accept the same [`:if`](https://docs.lowdefy.com/:if), `:switch` and `:return` controls that API routines use:

```yaml
events:
  onClick:
    - :if:
        _not:
          _state: form_valid
      :then:
        - id: warn
          type: Message
          params:
            content: Fix the highlighted fields first.
        - :return: null
    - id: save
      type: Request
      params: save_record
```

Before, gating a group of actions meant repeating the same `skip` expression on each one, and ending an event early meant a `Throw` you then had to catch. Controls nest and work in both `try` and `catch` lists. Actions not executed for a control-flow reason are reported as skipped, so `_actions` lookups and action indices are unchanged for existing config.

## A dev server built for coding agents

Most of the work on the dev server in this release is aimed at a developer who is not a human. The dev server always serves `/lowdefy-docs`, a REST and MCP endpoint with the schema, examples and docs for every block, operator, action, connection and request type installed in the project, including your local plugins. An agent looks up the exact contract instead of guessing at property names.

Then it closes the loop. `lowdefy_build_status` returns the current build errors and warnings with file and line, plus recent browser runtime errors. `lowdefy_screenshot_page` returns a PNG of the rendered page from headless Chromium. `lowdefy_inspect_state` reads the live state, request results and event log of the page open in your browser tab, so you can click through a bug yourself and let the agent look at exactly what you see. `lowdefy_eval_operator` is a REPL for operator expressions against that live state. `lowdefy_snapshot_state` and `lowdefy_load_state` capture a page mid-scenario into a checkpoint and restore it, and a `?_checkpoint=<name>` URL hands a teammate the app in that state. There are 23 tools in total, listed in the [docs for AI agents](https://docs.lowdefy.com/ai-agent-docs).

```bash
npx lowdefy agent-setup
```

One command writes a `.mcp.json`, a Claude Code skill and an `AGENTS.md` section into your project, at the repo root in a monorepo, appended to an existing `CLAUDE.md` when there is one. `lowdefy dev --mock-user '{"roles":["admin"]}'` starts the dev server signed in, so the headless renderer can screenshot protected pages. Each agent tool call can also pass its own `user`, rendering as an admin on one call and a plain member on the next.

Two features are for the human in the loop. Hold Option or Alt and click any element in the running app to open the YAML that defines it in VS Code, at the exact line. Press Cmd+/ or Ctrl+/ to get an annotation overlay: select blocks, draw on the page, write comments, and copy a feedback block to your clipboard where each annotation carries its blockId, its YAML file and line, and an annotated screenshot. Paste it into whichever agent session you are working in.

## Running several apps at once

Cookies are scoped by host, not port, so two dev servers on `localhost` used to share one auth cookie jar, and signing into one app signed you out of the other. The dev server now derives a cookie prefix from the app `slug` or `name`, so each app gets its own session, and the CLI picks the next free port instead of failing when the requested one is busy. Set the same `auth.advanced.cookiePrefix` on two apps to share a session on purpose.

## Deployment

**Docker.** The server serves `GET /api/lowdefy-health` for container probes, skipping auth, logging and Sentry so frequent checks stay out of your logs. On `SIGTERM` it closes websocket clients, finishes in-flight requests, flushes Sentry and exits within Docker's grace period. A new `lowdefy docker-output` command traces the server's runtime dependency graph and copies only the files it imports into `.lowdefy/docker`, so build tooling and client-only block packages stay out of the image. `lowdefy init-docker` writes a Dockerfile that pins the CLI to your app's `lowdefy:` version, runs as the non-root `node` user, and adds a `HEALTHCHECK`. See the [Docker guide](https://docs.lowdefy.com/docker).

**Vercel.** `lowdefy init-vercel` scaffolds a complete deployment into `deploy/`: static assets on the CDN, one serverless function for everything else, built through the Build Output API. `config.vercel` sets `maxDuration` and `memory`, and a new `config.requestTimeout` bounds every request, defaulting to 30 seconds, so a hung upstream call cannot run to the platform limit on a plan billed by duration. See the [Vercel guide](https://docs.lowdefy.com/vercel).

**Logs.** Every request logs its final `status` and `duration_ms` as a standard access log line. Every line carries `app_name`, `app_version` and `git_sha`, so errors correlate to a build across replicas during a rolling deploy. The request id honours an upstream `x-request-id` header and echoes it on the response.

## Smaller changes

- The [`_app`](https://docs.lowdefy.com/_app) operator reads the app's `slug`, `name`, `version`, `description`, `license`, `lowdefyVersion` and `gitSha`, with identical values at build time and runtime. `slug` is a new root field, validated as kebab-case, and referencing it when it is not declared fails the build rather than scoping namespaced data under `null`.
- `TagSelector` and `TagMultipleSelector` render options as toggleable pills with a stable colour per value.
- The date picker blocks accept `presets` for quick ranges like "Last 7 days" and "Month to date", built with `_dayjs` and re-evaluated on every render.
- AG Grid gains a `menu` cell that puts a row's actions behind one trigger button instead of a wide column of buttons.
- The `Link` action accepts `replace` and `scroll`, so a same-page link that only updates `urlQuery` no longer jumps to the top or pushes a history entry.
- `AgentChat` welcome screens support `tracks`, labelled columns of starter prompts that fill the composer instead of sending, and a `setInput` method.
- The `state-refs` build check warns instead of failing production builds. State can be created at runtime, so the check is a heuristic, and failing a deploy on a false positive was worse than the miss.
- Module deferral moved onto a single build-level registry. Entry order no longer matters for modules that embed each other, and cycle errors name the actual value chain.
- The Google Sheets connection moved to the current `google-spreadsheet` library, which also fixes a crash on Node.js 26.

## Upgrading

```bash
npx lowdefy upgrade
```

The upgrade command detects your version and generates the codemod prompts for the changes between it and v6. Because the config schema is unchanged, most apps need only the environment variable renames and a one-time sign-in. The full list of breaking changes is in the [v5 to v6 migration guide](https://docs.lowdefy.com/v5-to-v6).
