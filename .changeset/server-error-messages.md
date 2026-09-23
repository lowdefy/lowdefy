---
'@lowdefy/api': patch
'@lowdefy/client': patch
'@lowdefy/engine': patch
'@lowdefy/helpers': patch
'@lowdefy/errors': patch
'@lowdefy/logger': patch
'@lowdefy/node-utils': patch
'@lowdefy/ai-utils': patch
'@lowdefy/connection-axios-http': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

Improved error handling: each reader of a server error now gets its own view of it.

- **Users and app config see the author's message or one generic message.** A server error the app author did not write now reaches the browser as "Something went wrong.", with its `name`, `code`, `statusCode`, `configKey` and a `requestId`. Messages written with `:throw` or `:reject`, failed `ValidateSchema` steps, a plugin's `UserError`, and authentication and authorization refusals, are shown as before. This applies to the error toast, `_actions`, `_request_details`, websocket errors, MCP tool results and the AgentChat stream, the same way in development and production. An action whose error toast showed a connection's own message now shows the generic one.
  - The generic message is the built-in `server.genericError` i18n string. Override it per locale under `config.i18n.messages`, for example `server.genericError: 'Etwas ist schiefgelaufen.'`.
  - To show different text for one action, set `messages.error` on the action.
  - To show the real message, read it with the new `_error` operator in the endpoint's `:catch` and send it on, for example `:throw: { _error: message }`.
- **The dev server shows the full error.** In `lowdefy dev`, the error bar, the browser console and the dev MCP tools show the full server error, with its config location, while app config sees the same generic error as in production. Different failures of the same action are now each shown, instead of only the first.
- **The browser console prints the request id** under a server error, to find the matching server log line and Sentry event.
- **Production logs and Sentry keep a fixed set of error fields.** Each logged error keeps its name, message, stack, `code`, `statusCode` and cause, plus Lowdefy's own fields (`configKey`, `source`, `received`, ...) on Lowdefy errors. Fields a library attaches, such as an HTTP client's request config and response, are no longer logged. Values of the app's secrets (`LOWDEFY_SECRET_*`, `CRON_SECRET`, `BETTER_AUTH_SECRET`) are replaced with `[REDACTED]` in production log lines and Sentry events, and credential-named keys in `received` are masked. Sentry events now carry the error's fields under `extra.error` and a `requestId` tag, and no longer attach incoming request bodies.
