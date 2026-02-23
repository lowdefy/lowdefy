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

## Flow 1: Client-Side Plugin Errors → Server Validation (Dev Only)

Schema validation of client-reported errors runs **only in the dev server**. In production, errors are logged and sent to Sentry without schema validation — the `received` data is stripped and the response is just `{ success: true }`.

This is a natural fit for the existing architecture: the dev and prod servers already have separate `/api/client-error` route handlers with different behavior.

### How errors reach the server

1. **Block errors**: `ErrorBoundary` catches React render failures → calls `handleError(error)` where error is a `BlockError`
2. **Action errors**: `Actions.callAction` catches plugin throws → wraps in `ActionError` → `logActionError` → calls `handleError(error)`
3. **Operator errors**: Parser catches operator failures → wraps in `OperatorError` → bubbles up → `handleError(error)`
4. **Parse errors on eval**: `Block.js` detects `block.eval.parseErrors` → calls `handleError(error)` for each

`handleError` (in `createHandleError.js`) serializes the error and sends it to `POST /api/client-error`. The client is shared between dev and prod — it always sends the full error including `received`. The per-server route handlers decide what to do with it.

### Dev vs prod: the existing split

The dev and prod servers already have separate `client-error.js` route handlers:

| Aspect                 | Dev (`server-dev/pages/api/client-error.js`) | Prod (`server/pages/api/client-error.js`) |
| ---------------------- | -------------------------------------------- | ----------------------------------------- |
| Calls `logClientError` | Yes                                          | Yes                                       |
| Schema validation      | Yes (new)                                    | No                                        |
| Sentry capture         | No                                           | Yes (strips `received` before capture)    |

Schema validation is added to `logClientError` in `@lowdefy/api` (shared), but is conditional on `received` being present in the deserialized error. The prod route strips `received` from `req.body` before calling `logClientError`, so validation is never triggered.

### API response contracts

**`logClientError` return value** (internal, shared `@lowdefy/api`):

```javascript
{
  success: true,
  source: 'pages/home.yaml:8' | null,   // resolved file:line
  config: 'root.pages[0:home]' | null,   // config key path
  error,                                  // original error (for Sentry in prod)
  errors: [serialized, ...]              // serializer.serialize()-d errors for client
}
```

`errors` contains converted ConfigErrors if schema validation fired, or the original error serialized if not. All entries are serialized via `serializer.serialize()` so they survive the JSON round-trip.

**Dev route response** (to client): forwards `{ success, source, config, errors }`.

**Prod route response** (to client): `{ success: true }` only. The `error` field is used internally for Sentry capture but not returned.

### `createHandleError.js` changes

Currently strips `received` before sending to the server (line 48). This stripping is removed — the client always sends the full serialized error. The servers handle the difference via their route handlers.

On response, `createHandleError.js` checks for the `errors` array. If present, it deserializes each entry with `serializer.deserialize()` and logs those instead of the original error. In prod the response has no `errors` field, so behavior is unchanged.

### Server-side processing in `logClientError`

```
Receive serialized error
       ↓
Deserialize error
       ↓
Is error.name one of 'ActionError', 'OperatorError', 'BlockError'
AND does error.received exist?
  No → skip to location resolution
  Yes ↓
       ↓
Look up validation config by error.name (see table below)
       ↓
Load schema file (e.g., plugins/actionSchemas.json)
  Failed → log warning, skip validation, keep original error
       ↓
Look up schema for this specific plugin (e.g., schemas["Wait"])
  Not found → skip validation, keep original error
       ↓
Validate error.received against schema
       ↓
Schema fails → create ConfigError for EACH validation error
               with formatted message and original configKey
Schema passes → keep original error (plugin bug, not config)
       ↓
Resolve configKey → source location (file:line)
       ↓
Log errors to terminal
       ↓
Serialize errors with serializer.serialize() for response
       ↓
Return { success, source, config, errors: [serialized] } to caller
```

### Validation configs

Each plugin type needs a config entry mapping error fields to schema lookup:

| Plugin Type | Guard            | Schema File                    | Schema Lookup    | Data Source                   | Schema Key   |
| ----------- | ---------------- | ------------------------------ | ---------------- | ----------------------------- | ------------ |
| block       | `error.typeName` | `plugins/blockSchemas.json`    | `error.typeName` | `error.received`              | `properties` |
| action      | `error.typeName` | `plugins/actionSchemas.json`   | `error.typeName` | `error.received`              | `params`     |
| operator    | `error.typeName` | `plugins/operatorSchemas.json` | `error.typeName` | extract from `error.received` | `params`     |

For operators, `received` is `{ [operatorKey]: params }` where the key may be method-qualified (e.g., `_yaml.parse`). Extract params using `Object.values(error.received)[0]` — not by `typeName` lookup — to handle both simple (`{ _if: params }`) and method-style (`{ _yaml.parse: params }`) operators.

For error formatting, compose the display name from `typeName` and `methodName`: use `error.methodName ? `${error.typeName}.${error.methodName}` : error.typeName` to produce `_yaml.parse` or `_if` as appropriate. See "Prerequisite: Add `methodName` to `OperatorError`" below.

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
Any invalid → log each ConfigError individually, then throw the first
```

**Key difference from Flow 1**: This is **proactive** — it runs before the request executes, catching config errors before they cause opaque downstream failures. Flow 1 is reactive — it runs only when an error has already occurred.

### Enhancement over current implementation

The current `validateSchemas.js` wraps `validate()` in try/catch and throws on first error. The enhanced version should:

1. Use `returnErrors: true` to collect all validation errors from both schemas
2. Create a `ConfigError` for each individual violation with `formatValidationError` (connection errors use pluginLabel "Connection" / fieldLabel "property"; request errors use "Request" / "property")
3. Log every ConfigError to the logger — the terminal shows all violations
4. Throw the first ConfigError to halt request execution

This avoids needing an `additionalErrors` field on `ConfigError` (which doesn't exist). All errors are visible in the terminal via logging; the thrown error stops execution.

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
| `logClientError` return | Returns `{ errors: [serialized] }`         | Returns `{ success, source, config, error }` (see API contract)  |

### Implementation notes

1. **Use `error.name` for type dispatch** in `logClientError` — after deserialization, `instanceof` may not work. Use `error.name === 'ActionError'` etc.

2. **Map `typeName` to schema lookup** — the current error classes use `typeName` (e.g., `typeName: 'Wait'` for actions, `typeName: '_if'` for operators). This is the key for schema map lookup.

3. **Block errors need `received` populated** — `ErrorBoundary` is a React class component using `componentDidCatch(error)`. React passes `(error, errorInfo)` — neither contains block properties. However, `block.eval.properties` already exists as a reference on the `block` object (computed every eval cycle). The mechanism:

   - **`Block.js`**: Pass `properties={block.eval?.properties}` as a prop to `ErrorBoundary` (just forwarding an existing reference, no extra copying)
   - **`ErrorBoundary.componentDidCatch`**: Read `this.props.properties` and attach as `received` on the `BlockError`:
     ```javascript
     wrappedError = new BlockError(error.message, {
       cause: error,
       typeName: blockType,
       location: blockId,
       configKey,
       received: this.props.properties,
     });
     ```
   - This is lightweight — no additional storage beyond the prop reference that React already manages. The properties reference updates on each render via normal React prop flow.

4. **`createHandleError.js` changes** — remove `received` stripping, handle `errors` in response. See "API response contracts" and "`createHandleError.js` changes" sections above for details.

5. **Prod `client-error.js` strips `received`** — strips `received` from `req.body` before calling `logClientError`, returns `{ success: true }` only. See "API response contracts" above.

6. **Dev `client-error.js` returns errors** — forwards `{ success, source, config, errors }` from `logClientError` to the client. See "API response contracts" above.

## Prerequisite: Add `methodName` to `OperatorError`

Operators can be method-qualified (e.g., `_yaml.parse`). The parser already splits `op` (`_yaml`) and `methodName` (`parse`) but only stores `op` as `typeName` on the error. Add `methodName` to `OperatorError` so error messages and schema validation can reference the full operator name.

**`OperatorError.js`** — store `methodName` from constructor options:

```javascript
class OperatorError extends PluginError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'OperatorError';
    this.methodName = options.methodName ?? null;
  }
}
```

**`webParser.js` and `serverParser.js`** — pass `methodName` when creating the error:

```javascript
new OperatorError(e.message, {
  cause: e,
  typeName: op, // "_yaml"
  methodName, // "parse" (or undefined for simple operators)
  received: { [key]: params },
  location: operatorLocation,
  configKey: e.configKey ?? configKey,
});
```

**Display name composition** — wherever the operator name is displayed (error messages, `formatValidationError`), compose the full name:

```javascript
const displayName = error.methodName ? `${error.typeName}.${error.methodName}` : error.typeName;
// "_yaml.parse" or "_if"
```

This is a small standalone change that should be done before the schema validation work.

## Packages to Modify

| Package                | File(s)                                     | Change                                                            |
| ---------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| `@lowdefy/errors`      | `OperatorError.js`                          | Add `methodName` field                                            |
| `@lowdefy/operators`   | `webParser.js`, `serverParser.js`           | Pass `methodName` when creating `OperatorError`                   |
| `@lowdefy/api`         | `routes/log/validatePluginSchema.js` (new)  | Pure validation function                                          |
| `@lowdefy/api`         | `routes/log/formatValidationError.js` (new) | Human-readable Ajv error formatting                               |
| `@lowdefy/api`         | `routes/log/logClientError.js`              | Add schema validation (conditional on `received` being present)   |
| `@lowdefy/api`         | `routes/request/validateSchemas.js`         | Collect all errors, use formatValidationError                     |
| `@lowdefy/client`      | `createHandleError.js`                      | Stop stripping `received`, handle `errors` in dev server response |
| `@lowdefy/block-utils` | `ErrorBoundary`                             | Pass evaluated properties as `received` on BlockError             |
| `@lowdefy/server`      | `pages/api/client-error.js`                 | Strip `received` from payload before `logClientError`             |
| `@lowdefy/server-dev`  | `pages/api/client-error.js`                 | Return `errors` from `logClientError` response to client          |

## Graceful Degradation

All schema validation is wrapped in try/catch at the call site. Failures to load schema files or validate are logged as warnings and do not affect the error reporting path. The original error is preserved and logged as before. Schema validation is purely additive — removing all schema files produces the same behavior as today.
