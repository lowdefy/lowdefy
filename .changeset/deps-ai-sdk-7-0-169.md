---
'@lowdefy/ai-utils': patch
'@lowdefy/blocks-antd-x': patch
'@lowdefy/blocks-native': patch
'@lowdefy/connection-ai-gateway': patch
'@lowdefy/connection-anthropic': patch
'@lowdefy/connection-google': patch
'@lowdefy/connection-openai': patch
---

fix(deps): Update the AI SDK to ai 7.0.169

Updates `ai` to 7.0.169, `@ai-sdk/react` to 4.0.173, `@ai-sdk/mcp` to 2.0.96, `@ai-sdk/anthropic` to 4.0.102, `@ai-sdk/gateway` to 4.0.142, `@ai-sdk/google` to 4.0.117 and `@ai-sdk/openai` to 4.0.114. The releases fix tool approvals that could run a tool twice, chat stream resumption and cancellation when a client disconnects, streamed Google text and tool-call ordering, OpenAI refusals that came back as empty text, and keep credentials out of telemetry. They add new model ids, including Claude Sonnet 5.5, Haiku 5.5 and Fable 5.2. The AI SDK now reads an array passed as a decision's state as a list of state parts, so a `Decide` request on the evaluation backend with an array `state` now sends it as one JSON value, as before. Lowdefy moves off the AI SDK names it deprecated (`experimental_evaluate`, `evaluationModel` and `Experimental_StdioMCPTransport`).
