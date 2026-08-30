---
'@lowdefy/build': minor
'@lowdefy/engine': minor
'@lowdefy/actions-core': minor
'@lowdefy/server-dev': minor
'@lowdefy/ajv': minor
'@lowdefy/errors': minor
'@lowdefy/docs': patch
---

feat: Page `state:` contract - a declared, checkable data model for page state.

A page can now declare its state as a map of dotted state paths to standard JSON Schema
fragments:

```yaml
id: answer-detail
type: PageHeaderMenu
state:
  data.address:
    type: object
    properties:
      formatted_address: { type: string }
    required: [formatted_address]
  data.status: { enum: [draft, submitted, approved] }
  evidence_ids: { type: array, items: { type: string } }
```

Declaring `state:` makes the contract complete: every input or list block id, `SetState` key and
`_state` reference on the page must resolve inside it, navigating `properties` and `items`, or the
build fails with a `state-schema` error that lists the declared paths and suggests the nearest one
(`"data.address.formated_address" is not part of it ... Did you mean
"data.address.formatted_address"?`). Each fragment must itself compile as a JSON schema. Suppress
with `~ignoreBuildChecks: [state-schema]`; `state` on a nested block is rejected.

At runtime the built page artifact carries the declaration as `stateSchema`. `required` on a block
whose state path is declared uses the declared type to decide emptiness: `number`, `integer`,
`boolean` and `object` are empty only when `null`/`undefined`, so a required `0` or `false` passes;
`string` keeps `''` empty and `array` keeps `[]` empty. The `Validate` action gains `params.schema`
(`true` for the whole contract, or a dotted path for one fragment), run in addition to any
`blockIds`/`regex` selection; violations at a block's path show on that block, the rest join the
error message as `state.<path>: <message>` lines. The dev MCP `lowdefy_inspect_state` result adds
`stateSchemaDrift` (`[{ path, message, declared, received }]`, empty when clean, absent without a
contract).

`@lowdefy/ajv` exports `getSchemaAtPath`, `nestSchemaPaths` and `splitSchemaPath`; `@lowdefy/errors`
adds the `state-schema` check slug.
