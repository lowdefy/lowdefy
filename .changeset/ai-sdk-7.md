---
'@lowdefy/ai-utils': minor
'@lowdefy/blocks-antd-x': minor
'@lowdefy/connection-ai-gateway': minor
'@lowdefy/connection-anthropic': minor
'@lowdefy/connection-google': minor
'@lowdefy/connection-openai': minor
---

feat(ai): Move the AI plugins to AI SDK 7

`ai` 7.0.116 with `@ai-sdk/gateway` 4, `@ai-sdk/anthropic` 4, `@ai-sdk/google` 4, `@ai-sdk/openai` 4,
`@ai-sdk/react` 4 and `@ai-sdk/mcp` 2. Lowdefy's own config is unchanged: `GenerateText` and
`GenerateObject` still take `system` (passed to the model as the SDK's `instructions`), and
agent hooks keep their names — `onStart`, `onStepStart`, `onToolCallStart`, `onToolCallFinish`,
`onStepFinish` and `onFinish`.

- Tools marked `confirm: true` ask for approval through the agent's `toolApproval` setting rather than
  a per-tool flag; approvals in `AgentChat` work as before.
- A system message written in a request's `messages` is passed through (AI SDK 7 rejects one
  unless it is opted in).
- `reasoningText` and `providerMetadata` in a `GenerateText` / `GenerateObject` response come from
  the final step, as before.
- The event payloads of the `onToolCallStart`, `onToolCallFinish`, `onStart`, `onStepStart` and
  `onStepFinish` hooks follow AI SDK 7's event shapes.
