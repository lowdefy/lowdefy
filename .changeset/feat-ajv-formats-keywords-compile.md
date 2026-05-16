---
'@lowdefy/ajv': minor
'@lowdefy/api': minor
'@lowdefy/build': minor
---

feat: Add ajv-formats + ajv-keywords plugins, a `compile({ schema })` export, and a `ValidateSchema` routine step

**Breaking change:** `@lowdefy/ajv` now registers `ajv-formats` and `ajv-keywords` on the shared Ajv instance. Schemas that use `format: date-time` / `email` / `uri` / `uuid` / etc. or the `instanceof` keyword previously slipped through `validate()` un-validated; they are now checked. Schemas that were already invalid against these definitions will surface errors they did not before.

**Additions**

- `addFormats(ajv)` — registers all standard JSON Schema formats (`date`, `date-time`, `time`, `email`, `uri`, `uuid`, `regex`, `ipv4`, `ipv6`, …).
- `addKeywords(ajv, ['instanceof', 'transform', 'regexp'])` — registers three `ajv-keywords` extensions:
  - `instanceof` — match JS class instances (e.g. `{ instanceof: 'Date' }`).
  - `transform` — normalise string values during validation (`transform: ['trim', 'toUpperCase']`); mutates the parent object in place. Useful for upload pipelines that need cleaned values before downstream processing.
  - `regexp` — full regex with flags (`regexp: '/^l[0-9]+$/i'` or `regexp: { pattern: '...', flags: 'i' }`); fills the gap left by JSON Schema's `pattern:` which has no flag support.
- New `compile({ schema })` named export — returns a `(data) => { valid, errors }` function so callers can pre-compile a schema and reuse the validator across many calls without re-resolving through `Ajv.prototype.validate`.

**Internal**

- The configured Ajv instance is extracted into a new `src/ajvInstance.js`. Both `validate.js` and `compile.js` share it.
- Plugin registration order is `ajv-formats` → `ajv-keywords` → `ajv-errors` so the `errorMessage` keyword can attach to format / instanceof errors.

**`ValidateSchema` routine step (built-in)**

A new connectionless server routine step (sibling to `CallApi`) that runs `@lowdefy/ajv` `validate` inside a routine. Properties:

- `schema` — JSON Schema (required, operators evaluated).
- `data` — value to validate (required, operators evaluated).
- `throwOnInvalid` — boolean, default `true`. On invalid + `true`, the routine short-circuits with `status: 'error'` and the AJV errors attached as `error.cause`. On invalid + `false`, the routine continues and the step result `{ valid, errors }` is available to downstream steps as `_step.<stepId>`.

Example:

```yaml
routine:
  - id: validate_input
    type: ValidateSchema
    properties:
      schema:
        type: object
        required: [email]
        properties:
          email: { type: string, format: email }
      data:
        _payload: true
```

Wired through the existing build → runtime path used by `CallApi`: `setStepId` assigns a `validate:` id prefix, `validateStep` enforces required props and forbids `connectionId`, `countStepTypes` skips it, and `runRoutine` dispatches the prefix to a new `handleValidateSchema` handler in `@lowdefy/api`.

**Use case**

The hydra `data-upload` plugin uses `compile({ schema })` to build a row validator from a tool's `columns[]` once per import and runs it against every row in the upload — pre-compilation avoids per-row dictionary lookup on large XLSX files.
