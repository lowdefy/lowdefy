---
'@lowdefy/ai-utils': minor
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/connection-ai-gateway': minor
'@lowdefy/connection-anthropic': minor
'@lowdefy/connection-google': minor
'@lowdefy/connection-openai': minor
---

feat: AI in API routines — one-shot LLM requests and CallAgent steps

**One-shot LLM request types (`@lowdefy/connection-anthropic`, `@lowdefy/connection-openai`, `@lowdefy/connection-google`, `@lowdefy/connection-ai-gateway`)**

All AI provider connections now provide `GenerateText` and `GenerateObject` request types — single model calls usable as API routine steps and page requests. The type names are shared across providers, so switching providers only means changing the `connectionId`.

- `GenerateText` generates text from a prompt and returns `{ text, reasoningText, finishReason, usage }`.
- `GenerateObject` generates structured data matching a JSON Schema and returns `{ object, finishReason, usage }` — ideal for classify, extract, and routing decisions inside routines.

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
```

**CallAgent routine step (`@lowdefy/api`, `@lowdefy/build`, `@lowdefy/ai-utils`)**

API endpoint routines can now run an agent to completion with the new `CallAgent` step. The agent runs headlessly — no chat UI, no streaming — looping through its tools until done, and stores `{ text, finishReason, usage, toolCalls, toolResults }` in `_step`.

```yaml
routine:
  - id: research
    type: CallAgent
    properties:
      agentId: research_agent
      prompt: Summarize yesterday's signups and flag anomalies.
```

- Tools marked `confirm: true` auto-execute in headless runs (the build emits a warning — there is no client to approve them).
- Agent server hooks still fire; `onFinish` `dataParts` are ignored since there is no stream.
- Agent tool and hook endpoint calls now count toward the endpoint call depth cap of 10, so recursive agent/endpoint configurations terminate with an error.
- The build validates that a static `agentId` on a `CallAgent` step references an existing agent.
