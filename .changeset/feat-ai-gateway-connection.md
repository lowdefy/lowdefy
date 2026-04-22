---
'@lowdefy/connection-ai-gateway': minor
'@lowdefy/build': patch
---

feat: Add `@lowdefy/connection-ai-gateway` for Vercel AI Gateway.

- New `AIGateway` connection type wrapping `createGateway` from `@ai-sdk/gateway`. `apiKey` is optional — the provider falls back to the `AI_GATEWAY_API_KEY` environment variable or Vercel OIDC.
- New `AIGatewayAgent` that routes `creator/model` ids (e.g. `anthropic/claude-sonnet-4.5`, `openai/gpt-5-mini`) through the gateway. Gateway-specific sugar props (`order`, `only`, `fallbackModels`, `user`, `tags`, `zeroDataRetention`, `providerTimeouts`, `byok`) map into `providerOptions.gateway`.
- Registered in `@lowdefy/build` default packages so it is available out of the box.
