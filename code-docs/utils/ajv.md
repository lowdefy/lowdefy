# @lowdefy/ajv

JSON Schema validation wrapper with detailed error reporting.

## Overview

Wraps AJV (Another JSON Validator) with:

- Comprehensive error collection
- Better error messages via ajv-errors
- Integration with Lowdefy error handling

## Installation

```javascript
import { validate } from '@lowdefy/ajv';
```

## Functions

### validate({ schema, data, returnErrors })

Validate data against JSON Schema:

```javascript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number', minimum: 0 },
  },
  required: ['name'],
};

const data = { name: 'John', age: 30 };

// Throws on invalid
validate({ schema, data });

// Return errors instead of throwing
const result = validate({ schema, data, returnErrors: true });
if (!result.valid) {
  console.error(result.errors);
}
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `schema` | object | JSON Schema |
| `data` | any | Data to validate |
| `returnErrors` | boolean | Return errors instead of throwing |

**Return Value (with returnErrors: true):**

```javascript
// Valid
{ valid: true }

// Invalid
{
  valid: false,
  errors: [
    {
      keyword: 'required',
      dataPath: '',
      message: "should have required property 'name'"
    }
  ]
}
```

### getConfigSchemaErrors({ schema, data })

The schema errors of Lowdefy config data that hold before its operators evaluate. The build's plugin schema check and dynamic pages both use it, so they agree on what valid config is.

- `~` keys (`~k`, `~r`, `~l`, `~ignoreBuildChecks`) are left out of the data.
- Each operator node is replaced by `null` before validating, and every error at or under it is dropped: an operator may evaluate to any value.
- `required` and `additionalProperties` on a literal object still report. Keeping the operator's key (as `null`) is what lets `additionalProperties` catch a misspelt key whose value is an operator.
- Whole-value keywords (`anyOf`, `oneOf`, `not`, `if`, `contains`, `enum`, `const`, `uniqueItems`) are dropped when an operator sits under their path, and an `errorMessage` is dropped when every error it rewords is.
- Data that is itself one operator returns `[]`.

Returns the remaining ajv error objects. The shared instance keeps at most 20 errors per validation and dropped errors count toward it, so many operator values can hide a real error past the cap; it never adds a false one.

### formatSchemaError({ ajvError, pluginLabel, typeName, fieldLabel })

Turns one ajv error into a sentence such as `Block "Button" property "size" must be one of ["small","large"].` Used by the build's plugin schema check, client error logging and request validation.

## Configuration

AJV is configured with:

```javascript
const ajv = new Ajv({
  allErrors: true, // Collect all errors, not just first (ajv-errors needs it)
  strict: false,
  code: { process: capErrors },
});
```

**Error cap.** `capErrors` rewrites each compiled validator so it keeps at most `MAX_VALIDATION_ERRORS` (20) error objects: it truncates the array after every `errors++;`, and leaves the count alone, so validity (`_errs === errors`) is still decided by the count. Past the cap the count runs ahead of the array, so the two places generated code reads the array by the count are rewritten to read it by its length: ajv's branch reset (`vErrors.length = _errsN;`, after an `anyOf`/`oneOf`/`if` branch passes) only shrinks the array, and ajv-errors' path fix on a property message (`vErrors[errors-1].instancePath = …;`) is skipped when that message was not kept. Without these, a passing branch after the cap grew the array with holes, which ajv-errors read as errors (`Cannot read properties of undefined (reading 'keyword')`), as a page whose events hold several nested action lists did.

## Error Format

Errors include:

| Field        | Description                    |
| ------------ | ------------------------------ |
| `keyword`    | Validation keyword that failed |
| `dataPath`   | JSON pointer to invalid data   |
| `schemaPath` | JSON pointer to schema rule    |
| `params`     | Additional error parameters    |
| `message`    | Human-readable message         |

## Usage Examples

### Block Schema Validation

```javascript
import { validate } from '@lowdefy/ajv';

const blockSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    type: { type: 'string' },
    properties: { type: 'object' },
  },
  required: ['id', 'type'],
};

function validateBlock(block) {
  validate({ schema: blockSchema, data: block });
}
```

### Connection Validation

```javascript
const mongoSchema = {
  type: 'object',
  properties: {
    databaseUri: { type: 'string' },
    collection: { type: 'string' },
    read: { type: 'boolean', default: true },
    write: { type: 'boolean', default: false },
  },
  required: ['databaseUri', 'collection'],
};

const result = validate({
  schema: mongoSchema,
  data: connectionConfig,
  returnErrors: true,
});

if (!result.valid) {
  throw new ConfigurationError(`Invalid MongoDB connection: ${formatErrors(result.errors)}`);
}
```

### Request Validation

```javascript
const findSchema = {
  type: 'object',
  properties: {
    query: { type: 'object' },
    options: {
      type: 'object',
      properties: {
        limit: { type: 'number', minimum: 1 },
        skip: { type: 'number', minimum: 0 },
        sort: { type: 'object' },
      },
    },
  },
};

function validateRequest(request) {
  const result = validate({
    schema: findSchema,
    data: request,
    returnErrors: true,
  });

  if (!result.valid) {
    return { valid: false, errors: result.errors };
  }

  return { valid: true };
}
```

## Runtime Plugin Schema Validation

`@lowdefy/ajv` is used by the plugin schema validation system to validate block properties, action params, and operator params at runtime when errors occur.

**File:** `packages/api/src/routes/log/validatePluginSchema.js`

```javascript
import { validate } from '@lowdefy/ajv';

function validatePluginSchema({ data, schema, schemaKey }) {
  if (!schema?.[schemaKey]) return null;
  const { valid, errors } = validate({
    schema: schema[schemaKey],
    data,
    returnErrors: true,
  });
  return valid ? null : errors;
}
```

The `returnErrors: true` mode is essential here — it returns all AJV errors instead of throwing, allowing `formatSchemaError` to convert them into human-readable messages for each violation.

See [api.md](../packages/api.md#client-error-logging--plugin-schema-validation) for the full validation flow.

## Dependencies

- `ajv` (8.12.0)
- `ajv-errors` (3.0.0)
- `@lowdefy/nunjucks` (4.4.0)
- `@lowdefy/helpers` (operator detection in `getConfigSchemaErrors`)

## Key Files

| File                           | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `src/validate.js`              | Main validation function                 |
| `src/ajv.js`                   | AJV instance configuration               |
| `src/getConfigSchemaErrors.js` | Operator-aware validation of config data |
| `src/formatSchemaError.js`     | Readable messages for ajv errors         |
