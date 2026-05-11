---
title: '@lowdefy/connection-google'
updated: 2026-04-14
package: '@lowdefy/connection-google'
---

# @lowdefy/connection-google

Google AI connection and GeminiAgent resolver for Gemini models.

## Purpose

Provides the `Google` connection type (AI SDK provider) and `GeminiAgent` agent type for Lowdefy's agent system.

## Connection: Google

Creates a Google AI SDK provider instance.

**Properties:**

- `apiKey` (required) — Google AI API key

**Schema:** `src/connections/Google/schema.js`

## Agent: GeminiAgent

Resolver that delegates to `handleAgentChat` from `@lowdefy/ai-utils` with Google-specific provider options.

**Provider-specific properties:**

- `thinkingConfig` — Thinking/reasoning configuration
- `safetySettings` — Content safety filter settings

These are mapped to `providerOptions.google` before calling `handleAgentChat`.

**Schema:** Extends `AISDKAgentSchema` with `thinkingConfig`, `safetySettings`, and `pageContext`.

## Exports

- `connections` — `{ Google: { schema, create } }`
- `agents` — `{ GeminiAgent: { schema, resolver } }`
- `types` — Type registry for plugin system

## Key Files

| File                                                | Purpose               |
| --------------------------------------------------- | --------------------- |
| `src/connections/Google/Google.js`                  | Connection factory    |
| `src/connections/Google/GeminiAgent/GeminiAgent.js` | Agent resolver        |
| `src/connections/Google/GeminiAgent/schema.js`      | Agent-specific schema |
| `src/connections/Google/schema.js`                  | Connection schema     |
