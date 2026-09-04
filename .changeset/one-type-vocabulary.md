---
'@lowdefy/ajv': minor
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/engine': minor
'@lowdefy/connection-mongodb': minor
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
---

feat: JSON Schema is the one type vocabulary; schemas describe the serialized shape

`collections.fields` is no longer a private dialect: it is JSON Schema written with a shared shorthand (`string`, `[string]`, `{ enum: [...] }`, `date`) that every schema surface accepts, it can declare a nested `properties` shape, and `required` moves to the JSON Schema array form on the collection (`required: [test_id, result]`); a per-field `required: true` still works for one release and is folded into the array with a build warning naming the new form. `build/collections.json` is therefore valid JSON Schema that any consumer compiles as it stands.

Schemas describe the serialized JSON shape everywhere: `date` is `{ type: string, format: date-time }` rather than an `instanceof` check, and `responseSchema`, `payloadSchema` and MongoDB write validation all render a live `Date` as its ISO string before validating, so one `responseSchema` is truthful as both the dev-time check and the MCP tool's `outputSchema`, and a client-sent date passes `format: date-time`. Response-schema violations are reported in production too, as one `logger.warn` per endpoint (a notice, never a failure), and MCP `structuredContent` is emitted only when the response is a JSON object.

Write validation gained the gaps it was missing: `$push` and `$addToSet` operands (including every element of a `$each`) are checked against the array field's `items`, `$unset` of a required field is refused, and an upserting update must name every required field. Build-time path checks for `_actions`, `_step` and `_event` reads run through one shared path walker with one set of semantics, and a `Validate` action targeting a state contract the page does not declare is a located build error instead of a runtime throw.
