# Why Agents Need Separate Connection and Agent Types Per Provider

## Summary

The AI SDK standardizes the core interface (model, messages, tools, streaming) but each provider has meaningful provider-specific options for reasoning, caching, safety, and connection init. Lowdefy keeps separate connection types (`Anthropic`, `OpenAI`, `Google`) and separate agent types (`ClaudeAgent`, `OpenAIAgent`, `GeminiAgent`) to give each a proper schema for these differences.

## The AI SDK's `providerOptions` Pattern

The AI SDK uses a namespaced `providerOptions` object on `streamText`/`ToolLoopAgent` for provider-specific settings. Only the options matching the active provider are used:

```javascript
const result = streamText({
  model: anthropic('claude-opus-4-20250514'),
  prompt: 'Explain quantum entanglement.',
  providerOptions: {
    anthropic: {
      thinking: { type: 'enabled', budgetTokens: 12000 },
    },
  },
});
```

This means provider-specific agent config must be passed through to `providerOptions` at runtime. Each agent type needs its own schema to validate these options.

## Provider-Specific Differences

### Connection Init (provider factory)

| Option         | Anthropic | OpenAI  | Google |
| -------------- | --------- | ------- | ------ |
| `apiKey`       | yes       | yes     | yes    |
| `baseURL`      | yes       | yes     | yes    |
| `organization` | -         | **yes** | -      |
| `project`      | -         | **yes** | -      |
| `headers`      | yes       | yes     | yes    |

OpenAI is the only provider that needs `organization` and `project` for multi-org/project isolation. This alone justifies separate connection types.

### Agent-Level Options (via `providerOptions`)

#### Reasoning / Thinking

Each provider has a different API for extended reasoning:

- **Anthropic**: `thinking: { type: 'enabled' | 'adaptive' | 'disabled', budgetTokens?: number }`
- **OpenAI**: `reasoningEffort: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'`
- **Google**: `thinkingConfig: { thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high', thinkingBudget?: number, includeThoughts?: boolean }`

These are fundamentally different shapes — not just different names for the same thing.

#### Caching

- **Anthropic**: `cacheControl: { type: 'ephemeral', ttl?: '5m' | '1h' }`
- **OpenAI**: `promptCacheKey: string`, `promptCacheRetention: 'in_memory' | '24h'`
- **Google**: `cachedContent: string` (reference to pre-cached content)

#### Safety

- **Google only**: `safetySettings: Array<{ category: string, threshold: string }>` for fine-grained control over hate speech, harassment, dangerous content, etc.

#### Speed / Effort

- **Anthropic**: `effort: 'low' | 'medium' | 'high'`, `speed: 'fast' | 'standard'`
- **OpenAI**: `textVerbosity: 'low' | 'medium' | 'high'`

#### Tool Control

- **Anthropic**: `disableParallelToolUse: boolean`
- **OpenAI**: `parallelToolCalls: boolean`

#### Structured Output

- **Anthropic**: `structuredOutputMode: 'outputFormat' | 'jsonTool' | 'auto'`
- **OpenAI**: `strictJsonSchema: boolean`
- **Google**: `structuredOutputs: boolean`

## Why Not a Single Unified Type?

A collapsed type would require either:

1. **A permissive union of all options** — validation becomes meaningless, developers get no guidance on what works with their provider
2. **Runtime type guards** — adds complexity without benefit, errors only at runtime
3. **"Not supported on this provider" documentation** — poor developer experience

Separate types give each provider its own schema. A Lowdefy developer using `type: ClaudeAgent` gets schema validation for `thinking` and `cacheControl`. A developer using `type: OpenAIAgent` gets validation for `reasoningEffort` and `promptCacheKey`. Invalid options are caught at build time.

## Current State vs Future

**First iteration (current):** All three agent types delegate to the same `handleAgentChat` in `@lowdefy/ai-utils`. The shared runtime passes standard options (`model`, `instructions`, `maxSteps`, `temperature`, `toolChoice`) to `ToolLoopAgent`. Provider-specific options are not yet exposed.

**Future iteration:** Each agent type's schema adds provider-specific properties. The resolver maps them into `providerOptions` before passing to `handleAgentChat`, which forwards them to `ToolLoopAgent`. Example YAML:

```yaml
agents:
  - id: support_bot
    type: ClaudeAgent
    connectionId: claude
    properties:
      model: claude-opus-4-20250514
      instructions: Be helpful.
      thinking:
        type: enabled
        budgetTokens: 12000
      speed: fast
```

The resolver would translate `thinking` and `speed` into:

```javascript
providerOptions: {
  anthropic: {
    thinking: { type: 'enabled', budgetTokens: 12000 },
    speed: 'fast',
  },
}
```

## Architecture Decision

**Connection types stay separate** because providers have different init options (OpenAI needs `organization`/`project`).

**Agent types stay separate** because providers have different model-level options (`thinking` vs `reasoningEffort` vs `thinkingConfig`). Each type provides a schema boundary for validation.

The current implementation where all three resolvers delegate to `handleAgentChat` is correct — the shared runtime handles the standardized interface, and provider-specific options will flow through `providerOptions` when we add them.
