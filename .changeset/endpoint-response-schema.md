---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/errors': minor
'@lowdefy/docs': patch
---

feat: Add `responseSchema` to Api endpoints — the output contract of a routine's `:return`.

An endpoint can now declare `responseSchema` (a JSON Schema) beside `payloadSchema`. Declaring it turns on:

- **Build checks** (`response-schema` slug): every `_actions.<actionId>.response.response.<path>` read on a page whose `CallAPI` action targets the endpoint, and every `_step.<stepId>.<path>` read after a `CallApi` step, is resolved against the schema's `properties`/`items`. An undeclared path is a build error naming the declared keys and the nearest match. Action-record fields (`_actions.<id>.response.status`, `success`, `error`, …) are untouched. Both `payloadSchema` and `responseSchema` are also compiled at build, so an invalid schema is a located build error rather than a runtime throw.
- **Dev notice**: in the dev server a real `:return` that misses the schema is reported as a `ResponseSchemaWarning` in `build_status` and the ErrorBar, with the endpoint's config location and the ajv instance path. The response is still returned; production compiles nothing.
- **MCP**: an endpoint exposed as an MCP tool publishes the schema as the tool's `outputSchema`, and its `tools/call` result carries `structuredContent` beside the text content.
