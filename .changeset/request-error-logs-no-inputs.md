---
'@lowdefy/api': patch
'@lowdefy/ai-utils': patch
'@lowdefy/errors': patch
'@lowdefy/server': patch
---

fix(api, errors, server): A failed request no longer logs its inputs

A failed request, on a page or as an endpoint routine step, no longer writes the request's evaluated properties or the connection's error to the logs. The request properties were attached to the error as `received`, which the error log wrote at every log level, so a step that saved an agent chat's thread logged the whole thread when it failed. The connection's error, which can hold the document it rejected, is now carried as a summary: its name, code, status code and message cut to 500 characters, with the same for up to three causes. The error log also names the step by `endpointId`, `stepId` (a page request's id) and `connectionId`. In dev, the dev tools still show the connection's full error; the dev terminal shows the summary. A request type's `meta.credentialProperties` no longer has an effect, since no request property is kept. `errorSummaryForLog`, the error summary agent logs already used, moves to `@lowdefy/errors`.
