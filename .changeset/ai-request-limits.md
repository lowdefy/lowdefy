---
'@lowdefy/ai-utils': minor
'@lowdefy/api': minor
'@lowdefy/connection-ai-gateway': minor
'@lowdefy/connection-anthropic': minor
'@lowdefy/connection-google': minor
'@lowdefy/connection-openai': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

AI requests take `maxOutputTokens` and `timeout`, and a closed request cancels its model call.

- `GenerateText`, `GenerateObject` and `Decide` take `timeout`: the milliseconds a model call may take, retries included, before it is cancelled. `Decide` also takes `maxOutputTokens`.
- The `Anthropic`, `OpenAI`, `Google` and `AIGateway` connections take `maxOutputTokens` and `timeout` as defaults for every request and agent on the connection that does not set its own.
- Request resolvers receive `signal`, which aborts when the request that started the work closes: when the server's request timeout (`config.requestTimeout`) answers first, or, on the Node server, when the client disconnects. The AI requests pass it to the model call, so a call that nobody is waiting for stops instead of running, and billing, to its end. A call stopped by the request timeout fails with a `ServiceError`. A call stopped because the client left fails with a `UserError`, which is logged as a warning.
- Work that outlives its request is not cancelled with it: endpoints with `async: true`, detached runs, and agent chat turns, which still run to their end so `onFinish` hooks save the conversation. A `CallAgent` step is cancelled with the routine that runs it.

A synchronous routine that kept running after its request timed out now has its AI calls cancelled at the timeout. Use `async: true` for work that takes longer than `config.requestTimeout`.
