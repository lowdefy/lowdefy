---
title: '@lowdefy/connection-anthropic'
updated: 2026-04-14
package: '@lowdefy/connection-anthropic'
---

# @lowdefy/connection-anthropic

Anthropic connection and ClaudeAgent resolver for Claude models.

## Connection: Anthropic

Creates an Anthropic AI SDK provider instance.

- Properties: `apiKey` (required)
- Schema in `src/connections/Anthropic/schema.js`

## Agent: ClaudeAgent

Resolver that calls `handleAgentChat` from `@lowdefy/ai-utils`.

Adds provider-specific `providerOptions`:

- `anthropic.thinking` -- Extended thinking config (`{ type: 'enabled', budgetTokens }`)
- `anthropic.effort` -- Reasoning effort level (`low`, `medium`, `high`)

Schema extends AISDKAgentSchema with `thinking` and `effort` properties. Also includes `pageContext` to prepend page context to instructions.

## Exports

- `connections` -- Anthropic
- `agents` -- ClaudeAgent
- `types` -- type registry

## Key Files

- `src/connections/Anthropic/Anthropic.js` -- Connection factory
- `src/connections/Anthropic/ClaudeAgent/ClaudeAgent.js` -- Agent resolver
- `src/connections/Anthropic/ClaudeAgent/schema.js` -- Agent-specific schema
