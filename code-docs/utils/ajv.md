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

## Configuration

AJV is configured with:

```javascript
const ajv = new Ajv({
  allErrors: true, // Collect all errors, not just first
  verbose: true, // Include schema in errors
  $data: true, // Enable $data reference
});
```

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

## Dependencies

- `ajv` (8.12.0)
- `ajv-errors` (3.0.0)
- `@lowdefy/nunjucks` (4.4.0)

## Key Files

| File              | Purpose                    |
| ----------------- | -------------------------- |
| `src/validate.js` | Main validation function   |
| `src/ajv.js`      | AJV instance configuration |
