---
'@lowdefy/api': patch
---

fix(api): Log routine errors under pino's `err` key so the error serializer runs.

`controlThrow`, `controlReject`, and `handleValidateSchema` logged the thrown
`Error` under the key `error`, but the logger built by `createNodeLogger`
registers its error serializer for the `err` key only. Since `Error.message`
and `stack` are non-enumerable, the un-serialized dump lost the message
entirely — every `:throw`/`:reject` printed as
`{"name":"UserError","isLowdefyError":true,"isReject":false}` with no way to
tell which error occurred. Logging under `err` runs the registered serializer
and lands the full serialized error (message, stack, cause) in the log line.
