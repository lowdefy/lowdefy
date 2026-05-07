---
title: '@lowdefy/connection-openai'
updated: 2026-04-14
package: '@lowdefy/connection-openai'
---

# @lowdefy/connection-openai

OpenAI connection and OpenAIAgent resolver for GPT models.

## Purpose

Provides the `OpenAI` connection type (AI SDK provider) and `OpenAIAgent` agent type for Lowdefy's agent system.

## Connection: OpenAI

Creates an OpenAI AI SDK provider instance.

**Properties:**

- `apiKey` (required) — OpenAI API key

**Schema:** `src/connections/OpenAI/schema.js`

## Agent: OpenAIAgent

Resolver that delegates to `handleAgentChat` from `@lowdefy/ai-utils` with OpenAI-specific provider options.

**Provider-specific properties:**

- `reasoningEffort` — Reasoning effort for o-series models
- `reasoningSummary` — Summary of reasoning chain

These are mapped to `providerOptions.openai` before calling `handleAgentChat`.

**Schema:** Extends `AISDKAgentSchema` with `reasoningEffort`, `reasoningSummary`, and `pageContext`.

## Exports

- `connections` — `{ OpenAI: { schema, create } }`
- `agents` — `{ OpenAIAgent: { schema, resolver } }`
- `types` — Type registry for plugin system

## Key Files

| File                                                | Purpose               |
| --------------------------------------------------- | --------------------- |
| `src/connections/OpenAI/OpenAI.js`                  | Connection factory    |
| `src/connections/OpenAI/OpenAIAgent/OpenAIAgent.js` | Agent resolver        |
| `src/connections/OpenAI/OpenAIAgent/schema.js`      | Agent-specific schema |
| `src/connections/OpenAI/schema.js`                  | Connection schema     |
