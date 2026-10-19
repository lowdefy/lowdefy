---
'@lowdefy/api': minor
'@lowdefy/operators': minor
'@lowdefy/operators-js': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat: Tool endpoints know the calling agent with the `_agent` operator

- **`_agent` server operator.** `_agent: id` returns the id of the agent that called the endpoint as a tool or hook, `_agent: conversationId` the chat's conversation id, and `_agent: true` both as `{ id, conversationId }`. On a call that did not come from an agent (a page request, an MCP tool call, a scheduled, webhook or auth hook run), it returns `null`, or the `default` when one is given, and never throws.
- **Set by the engine, not the model.** The agent runtime puts the running agent on the tool endpoint's routine. Nothing in the tool's payload or the chat request can set or change it, so an app can record agent work apart from a person's.
- **Inherited by nested calls.** Endpoints a tool endpoint calls through `CallApi` (including `detached: true`) or a connection's `callApi` see the same agent.
- **Headless agents.** Tools an agent run by a `CallAgent` routine step calls see the agent with `conversationId: null`.
