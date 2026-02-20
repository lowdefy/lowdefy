# Spec: Runtime Plugin Schema Validation

## Goal

When a plugin (block, action, operator, connection/request) throws an error at runtime, determine whether the error was caused by **incorrect user config** or a **genuine plugin bug**. If the plugin's input data (properties, params) fails schema validation, convert the error to a `ConfigError` with a clear, human-readable message pointing to the exact config problem. If the input passes validation, keep the original error type — the bug is in the plugin, not the config.

This is a **diagnostic tool**, not a validation gate. It runs reactively when errors occur, not proactively on every invocation.

### Why this matters

Without schema validation, all plugin errors look the same to the developer: "Block render failed" or "Action Wait failed." The developer can't tell if they passed the wrong type to a property or if the plugin has a bug. Schema validation at error time transforms vague errors into actionable messages like:

```
Block "Box" property "content" must be type "string". Received 123 (number).
  → pages/home.yaml:8
```

## Schema Loading

Build-time schema maps are written as JSON files during the build step (Category A work):

| File                           | Contents                           |
| ------------------------------ | ---------------------------------- |
| `plugins/blockSchemas.json`    | `{ "Box": { properties: {...} } }` |
| `plugins/actionSchemas.json`   | `{ "Wait": { params: {...} } }`    |
| `plugins/operatorSchemas.json` | `{ "_if": { params: {...} } }`     |

These are loaded at runtime via `context.readConfigFile()` — the same mechanism used for `keyMap.json` and `refMap.json`. Connection/request schemas are already available on the connection and request resolver objects.

## Validation Logic: `validatePluginSchema`

A pure function that validates data against a schema using `@lowdefy/ajv`:

```javascript
function validatePluginSchema({ data, schema, schemaKey }) {
  // schemaKey is "properties" for blocks, "params" for actions/operators
  if (!schema?.[schemaKey]) return null; // No schema → skip validation
  const { valid, errors } = validate({
    schema: schema[schemaKey],
    data: data ?? {}, // Null data treated as empty object
    returnErrors: true,
  });
  return valid ? null : errors; // null = valid, array = validation errors
}
```

- Returns `null` when data passes validation or no schema exists
- Returns an array of Ajv error objects when validation fails
- Uses `returnErrors: true` to collect all errors, not just the first

## Error Formatting: `formatValidationError`

Converts Ajv error objects into human-readable messages:

| Ajv keyword            | Output format                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `type`                 | `Block "Box" property "content" must be type "string". Received 123 (number).`                 |
| `enum`                 | `Block "Button" property "size" must be one of ["small", "medium", "large"]. Received "huge".` |
| `additionalProperties` | `Block "Box" property "unknownProp" is not allowed.`                                           |
| `required`             | `Block "Title" required property "title" is missing.`                                          |
| Other                  | `Block "Box" property "width" must be >= 0. Received -1.`                                      |

The function is parameterized with `pluginLabel` ("Block", "Action", "Operator") and `fieldLabel` ("property", "param") to produce context-appropriate messages.

Nested paths from `instancePath` are converted to dot notation: `/options/behavior` → `options.behavior`.

## Flow 1: Client-Side Plugin Errors → Server Validation

This is the primary flow. Plugin errors on the client (blocks, actions, operators evaluated client-side) are sent to the server for logging. The server validates the plugin data against schemas before logging.

### How errors reach the server

1. **Block errors**: `ErrorBoundary` catches React render failures → calls `handleError(error)` where error is a `BlockError`
2. **Action errors**: `Actions.callAction` catches plugin throws → wraps in `ActionError` → `logActionError` → calls `handleError(error)`
3. **Operator errors**: Parser catches operator failures → wraps in `OperatorError` → bubbles up → `handleError(error)`
4. **Parse errors on eval**: `Block.js` detects `block.eval.parseErrors` → calls `handleError(error)` for each

`handleError` (in `createHandleError.js`) serializes the error and sends it to `POST /api/client-error`.

### Server-side processing in `logClientError`

```
Receive serialized error
       ↓
Deserialize error
       ↓
Is it a PluginError subclass (ActionError, OperatorError, BlockError)?
  No → skip to location resolution
  Yes ↓
       ↓
Determine plugin type from error class:
  ActionError  → pluginType: "action",  lookup by error.typeName
  OperatorError → pluginType: "operator", lookup by error.typeName
  BlockError   → pluginType: "block",   lookup by error.typeName (blockType)
       ↓
Load schema file (e.g., plugins/actionSchemas.json)
  Failed → log warning, skip validation, keep original error
       ↓
Look up schema for this specific plugin (e.g., schemas["Wait"])
  Not found → skip validation, keep original error
       ↓
Extract validation data:
  Blocks:    error.received (= properties at time of error)
  Actions:   error.received (= params passed to action)
  Operators: error.received (= { _if: params }) → extract the inner value
       ↓
Validate data against schema
       ↓
Schema fails → create ConfigError for EACH validation error
               with formatted message and original configKey
Schema passes → keep original error (plugin bug, not config)
       ↓
Resolve configKey → source location (file:line)
       ↓
Log errors to terminal
       ↓
Return { success, source, config, errors } to client
```

### Validation configs

Each plugin type needs a config entry mapping error fields to schema lookup:

| Plugin Type | Guard            | Schema File                    | Schema Lookup    | Data Source                   | Schema Key   |
| ----------- | ---------------- | ------------------------------ | ---------------- | ----------------------------- | ------------ |
| block       | `error.typeName` | `plugins/blockSchemas.json`    | `error.typeName` | `error.received`              | `properties` |
| action      | `error.typeName` | `plugins/actionSchemas.json`   | `error.typeName` | `error.received`              | `params`     |
| operator    | `error.typeName` | `plugins/operatorSchemas.json` | `error.typeName` | extract from `error.received` | `params`     |

For operators, `received` is `{ _if: params }` — the inner value must be extracted for validation.

## Flow 2: Server-Side Request/Connection Validation

Connection and request properties are validated proactively before executing the request. This is the existing `validateSchemas.js` flow, enhanced to collect all errors and format them.

```
Request handler receives request
       ↓
Evaluate operators in connection/request config
       ↓
Call validateSchemas() with:
  - connection.schema + connectionProperties
  - requestResolver.schema + requestProperties
       ↓
Validate both against their schemas (collect all errors)
       ↓
All valid → return (no-op)
Any invalid → throw ConfigError with configKey from requestConfig['~k']
              attach additional errors as .additionalErrors
```

**Key difference from Flow 1**: This is **proactive** — it runs before the request executes, catching config errors before they cause opaque downstream failures. Flow 1 is reactive — it runs only when an error has already occurred.

### Enhancement over current implementation

The current `validateSchemas.js` wraps `validate()` in try/catch and throws on first error. The enhanced version should:

1. Use `returnErrors: true` to collect all validation errors from both schemas
2. Create a `ConfigError` for each individual violation
3. Attach additional errors to the primary error via `additionalErrors`
4. Use `formatValidationError` for human-readable messages (connection errors use pluginLabel "Connection" / fieldLabel "property"; request errors use "Request" / "property")

## Error Conversion Rules

| Scenario                                               | Original Error  | Schema Result | Final Error Type | Rationale                            |
| ------------------------------------------------------ | --------------- | ------------- | ---------------- | ------------------------------------ |
| Block throws, properties fail schema                   | BlockError      | Fail          | ConfigError(s)   | User passed wrong props              |
| Block throws, properties pass schema                   | BlockError      | Pass          | BlockError       | Plugin bug, not config               |
| Block throws, no schema for this block type            | BlockError      | Skip          | BlockError       | Can't determine — keep original      |
| Action throws, params fail schema                      | ActionError     | Fail          | ConfigError(s)   | User passed wrong params             |
| Action throws, params pass schema                      | ActionError     | Pass          | ActionError      | Plugin bug, not config               |
| Operator throws, params fail schema                    | OperatorError   | Fail          | ConfigError(s)   | User passed wrong operator params    |
| Connection/request properties fail pre-exec validation | (none yet)      | Fail          | ConfigError      | Proactive catch before request runs  |
| Schema file fails to load                              | Any PluginError | Skip          | Original         | Graceful degradation                 |
| Error is ConfigError (already config)                  | ConfigError     | Skip          | ConfigError      | Already diagnosed                    |
| Error is UserError                                     | UserError       | Skip          | UserError        | Intentional user-facing error        |
| Error is ServiceError                                  | ServiceError    | Skip          | ServiceError     | External service failure, not config |

## Adapting to Current Error System

### Key differences from PR #1979 to current code

| Aspect                  | PR #1979                                   | Current (post PR #2014)                                          |
| ----------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| Plugin error class      | Single `PluginError` with `pluginType`     | Typed subclasses: `ActionError`, `OperatorError`, `BlockError`   |
| Error identification    | `error.pluginType === 'action'`            | `error instanceof ActionError` or `error.name === 'ActionError'` |
| Plugin name field       | `error.pluginName`                         | `error.typeName`                                                 |
| Serialization           | `error.serialize()` / `deserializeError()` | `serializer.serialize()` / `serializer.deserialize()`            |
| Client error handler    | `createLogError.js`                        | `createHandleError.js`                                           |
| Error module import     | `@lowdefy/errors/client`, `/server`        | `@lowdefy/errors`                                                |
| `logClientError` return | Returns `{ errors: [serialized] }`         | Returns `{ error }` with `source`                                |

### Implementation notes

1. **Use `error.name` for type dispatch** in `logClientError` — after deserialization, `instanceof` may not work. Use `error.name === 'ActionError'` etc.

2. **Map `typeName` to schema lookup** — the current error classes use `typeName` (e.g., `typeName: 'Wait'` for actions, `typeName: '_if'` for operators). This is the key for schema map lookup.

3. **Block errors need `received` populated** — `ErrorBoundary` needs to pass the block's evaluated properties as `received` so they're available for schema validation on the server. The current `ErrorBoundary` may need updating.

4. **`createHandleError.js` round-trip** — currently sends error to server and gets back `{ source }`. The enhanced version should also receive back the ConfigErrors (if schema validation converted the error) for local display.

5. **`logClientError` schema validation response** — the server should return both the resolved source location AND any schema validation results. The client should log the converted ConfigErrors if present, or the original error if not.

## Packages to Modify

| Package                | File(s)                                     | Change                                                      |
| ---------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| `@lowdefy/api`         | `routes/log/validatePluginSchema.js` (new)  | Pure validation function                                    |
| `@lowdefy/api`         | `routes/log/formatValidationError.js` (new) | Human-readable Ajv error formatting                         |
| `@lowdefy/api`         | `routes/log/logClientError.js`              | Add schema validation before logging PluginError subclasses |
| `@lowdefy/api`         | `routes/request/validateSchemas.js`         | Collect all errors, use formatValidationError               |
| `@lowdefy/client`      | `createHandleError.js`                      | Handle schema validation results from server response       |
| `@lowdefy/block-utils` | `ErrorBoundary`                             | Pass evaluated properties as `received` on BlockError       |

## Graceful Degradation

All schema validation is wrapped in try/catch at the call site. Failures to load schema files or validate are logged as warnings and do not affect the error reporting path. The original error is preserved and logged as before. Schema validation is purely additive — removing all schema files produces the same behavior as today.
