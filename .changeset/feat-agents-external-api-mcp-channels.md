---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/ai-utils': minor
'@lowdefy/helpers': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Agent authorization, external agent API, MCP server, and Telegram channels

**Agent Authorization (`@lowdefy/build`, `@lowdefy/api`)**

- Agents are now a protected auth entity: `auth.agents` supports the same `protected` / `public` / `roles` configuration as pages and API endpoints.
- Every agent invocation is authorized — the page chat route, the external API, MCP tools, and `CallAgent` routine steps. Previously agent routes performed no authorization.
- Note: endpoints running `CallAgent` steps against role-protected agents now require the caller to hold the role (system contexts such as cron and webhooks are unaffected). Apps must be rebuilt — agents from older builds carry no auth artifact.

**External Agent API (`@lowdefy/server`, `@lowdefy/server-dev`, `@lowdefy/ai-utils`)**

- New pageless route `POST /api/agents/{agentId}` for calling agents from outside the app. External callers authenticate with `auth.strategies` (API key or JWT).
- The `Accept` header selects the response format: UIMessage SSE (`text/event-stream`) or a plain text stream (default).

**MCP Server (`@lowdefy/build`, `@lowdefy/api`, servers)**

- New top-level `mcp` config exposes API endpoints and agents as MCP tools at `POST /api/mcp` (streamable HTTP). Tool listing and execution are authorized per caller; unauthenticated clients see only public tools.

**Channels (`@lowdefy/build`, servers)**

- New top-level `channels` config connects an agent to Telegram via a bot. Channel messages run under a service identity with configurable roles/attributes; replies stream into the chat with thread history as conversation context. Polling mode in dev, webhook mode (`POST /api/webhooks/telegram`) in production.
