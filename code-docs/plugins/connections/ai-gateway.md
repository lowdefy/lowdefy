---
title: '@lowdefy/connection-ai-gateway'
updated: 2026-05-05
package: '@lowdefy/connection-ai-gateway'
---

# @lowdefy/connection-ai-gateway

Vercel AI Gateway connection and AIGatewayAgent resolver. Routes requests through the AI Gateway to multiple upstream providers (Anthropic, OpenAI, Google, etc.) with a single connection, supporting per-request provider ordering, fallbacks, BYOK, and usage analytics.

## Connection: AIGateway

Creates a Vercel AI Gateway provider via `createGateway` from `@ai-sdk/gateway`.

- Properties: `apiKey` (optional — falls back to `AI_GATEWAY_API_KEY` or Vercel OIDC), `baseURL`, `headers`
- Schema in `src/connections/AIGateway/schema.js`

## Agent: AIGatewayAgent

Resolver that calls `handleAgentChat` from `@lowdefy/ai-utils`. Before delegating, it folds gateway-specific sugar properties into the AI SDK `providerOptions.gateway` namespace so the gateway can route accordingly.

Gateway-specific properties:

- `order` — Provider slugs to try in order (e.g. `[vertex, anthropic]`). Gateway falls through until one succeeds.
- `only` — Restrict routing to a specific provider list.
- `fallbackModels` — Alternate `creator/model` ids tried when the primary model fails. Mapped to gateway `models`.
- `user` — End-user identifier for spend attribution in the gateway analytics dashboard.
- `tags` — Categorize/filter usage in gateway reports.
- `zeroDataRetention` — Force zero-retention routing.
- `providerTimeouts` — Per-provider timeout configuration.
- `byok` — Bring-your-own-key configuration when proxying to providers with customer keys.

Standard agent properties (`model`, `instructions`, `maxSteps`, `maxOutputTokens`, `temperature`, `toolChoice`, etc.) come from the shared `AISDKAgentSchema`.

The `model` is a gateway model id in `creator/model` form (e.g. `anthropic/claude-sonnet-4.5`, `openai/gpt-5-mini`), not a bare model name.

## Why use it

A single AIGateway connection replaces multiple provider connections when:

- The app needs cross-provider failover (e.g. Anthropic → OpenAI on quota errors)
- You want consolidated billing/analytics across providers
- Customers bring their own provider keys (BYOK) routed through the gateway
- You need per-request routing decisions (order/only) without changing connection config

Single-provider apps can keep using the dedicated connections (`Anthropic`, `OpenAI`, `Google`) — they have lower indirection.

## Exports

- `connections` — `AIGateway`
- `agents` — `AIGatewayAgent`
- `types` — type registry

## Key Files

- `src/connections/AIGateway/AIGateway.js` — Connection factory (wraps `createGateway`)
- `src/connections/AIGateway/AIGatewayAgent/AIGatewayAgent.js` — Agent resolver, folds sugar props into `providerOptions.gateway`
- `src/connections/AIGateway/AIGatewayAgent/schema.js` — Agent-specific schema
- `src/connections/AIGateway/schema.js` — Connection schema
