---
title: '@lowdefy/connection-ai-gateway'
updated: 2026-05-05
package: '@lowdefy/connection-ai-gateway'
---

# @lowdefy/connection-ai-gateway

Vercel AI Gateway connection and `AIGatewayAgent` resolver. Use this when you want a single provider that can route to many models (Anthropic, OpenAI, Google, xAI, etc.) behind the Vercel AI Gateway, including provider fallback, routing restrictions, BYOK, and spend attribution.

## Connection: AIGateway

Wraps `createGateway` from `@ai-sdk/gateway`.

- `apiKey` -- Optional. Falls back to `AI_GATEWAY_API_KEY` or Vercel OIDC.
- `baseURL` -- Optional custom gateway base URL.
- `headers` -- Optional custom headers (string -> string) added to gateway requests.

```yaml
connections:
  - id: gateway
    type: AIGateway
    properties:
      apiKey:
        _secret: AI_GATEWAY_API_KEY
```

Schema: `src/connections/AIGateway/schema.js`.

## Agent: AIGatewayAgent

Resolver extracts gateway routing options from the agent's properties and folds them into `providerOptions.gateway` before delegating to `handleAgentChat` from `@lowdefy/ai-utils`. Models are identified in `creator/model` form (e.g. `anthropic/claude-sonnet-4.5`, `openai/gpt-5-mini`).

```yaml
agents:
  - id: support_agent
    type: AIGatewayAgent
    connectionId: gateway
    properties:
      model: anthropic/claude-sonnet-4.5
      instructions: You are a helpful support agent.
      order: [anthropic, vertex]
      fallbackModels:
        - openai/gpt-5-mini
      user: '{{ user.id }}'
      tags: [support, prod]
      zeroDataRetention: true
```

### Gateway-specific properties

These are all optional. When any are set, the resolver merges them into `providerOptions.gateway` (alongside any explicit `providerOptions.gateway` the user supplies):

| Property            | Purpose                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `order`             | Provider slugs to try in order (e.g. `[vertex, anthropic]`).                                                    |
| `only`              | Restrict routing to this provider list.                                                                         |
| `fallbackModels`    | `creator/model` ids tried in order when the primary model fails. Mapped to gateway's `models`.                  |
| `user`              | End-user id for spend attribution in the gateway dashboard.                                                     |
| `tags`              | String array used to categorise and filter usage in reports.                                                    |
| `zeroDataRetention` | When `true`, restrict routing to ZDR-compliant providers.                                                       |
| `providerTimeouts`  | `{ byok: { <providerSlug>: ms } }`. Per-provider BYOK timeouts (integers >= 1000 ms).                           |
| `byok`              | Request-scoped BYOK credentials keyed by provider slug. Values are arrays of credential objects tried in order. |

### Shared agent properties

`AIGatewayAgent` also accepts the common agent properties shared with other resolvers: `instructions`, `maxSteps`, `maxOutputTokens`, `temperature`, `toolChoice`, `pageContext`, `providerOptions`, `repairToolCall`, and `prepareStep`. Tool wiring, hooks, MCP sources, sub-agents, and the `update-page-state` flow come from the shared runtime, see `code-docs/architecture/agent-system.md`.

## Pass-through provider options

Provider-native options are passed through the gateway by keying `providerOptions` on the underlying provider slug:

```yaml
properties:
  model: anthropic/claude-sonnet-4.5
  providerOptions:
    anthropic:
      thinking: { type: enabled, budgetTokens: 10000 }
```

The gateway forwards this to the routed provider. Use `providerOptions.gateway` only when you want to set gateway options directly, the resolver merges the routing props listed above into it automatically.

## Why use it

A single AIGateway connection replaces multiple provider connections when:

- The app needs cross-provider failover (e.g. Anthropic to OpenAI on quota errors)
- You want consolidated billing/analytics across providers
- Customers bring their own provider keys (BYOK) routed through the gateway
- You need per-request routing decisions (order/only) without changing connection config

Single-provider apps can keep using the dedicated connections (`Anthropic`, `OpenAI`, `Google`), they have lower indirection.

## Exports

- `connections` -- `AIGateway`
- `agents` -- `AIGatewayAgent`
- `types` -- connection and agent type registry

## Key Files

- `src/connections/AIGateway/AIGateway.js` -- Connection factory (calls `createGateway`).
- `src/connections/AIGateway/schema.js` -- Connection schema.
- `src/connections/AIGateway/AIGatewayAgent/AIGatewayAgent.js` -- Agent resolver (routing options -> `providerOptions.gateway`).
- `src/connections/AIGateway/AIGatewayAgent/schema.js` -- Agent schema (routing options + shared agent props).
