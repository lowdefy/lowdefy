/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import validate from './validate.js';
import { MAX_VALIDATION_ERRORS } from './ajvInstance.js';

test('Object matches schema', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
      },
    },
  };
  const data = {
    string: 'value',
  };
  expect(validate({ schema, data })).toEqual({ valid: true });
});

test('Object does not match schema, one error', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
      },
    },
  };
  const data = {
    string: 7,
  };
  expect(() => validate({ schema, data })).toThrow('must be string');
});

test('Object does not match schema, two errors', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
      },
      number: {
        type: 'number',
      },
    },
  };
  const data = {
    string: 7,
    number: '7',
  };
  expect(() => validate({ schema, data })).toThrow('must be string; must be number');
});

test('Object does not match schema, three errors', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
      },
      number: {
        type: 'number',
      },
      boolean: {
        type: 'boolean',
      },
    },
  };
  const data = {
    string: 7,
    number: '7',
    boolean: 7,
  };
  expect(() => validate({ schema, data })).toThrow('must be string; must be boolean');
});

test('Object does not match schema, one error, error message', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
        errorMessage: {
          type: 'Custom error message.',
        },
      },
    },
  };
  const data = {
    string: 7,
  };
  expect(() => validate({ schema, data })).toThrow('Custom error message.');
});

test('Object does not match schema, two errors, error messages', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
        errorMessage: {
          type: 'Custom error string.',
        },
      },
      number: {
        type: 'number',
        errorMessage: {
          type: 'Custom error number.',
        },
      },
    },
  };
  const data = {
    string: 7,
    number: '7',
  };
  expect(() => validate({ schema, data })).toThrow('Custom error string.; Custom error number.');
});

test('Object does not match schema, three errors, error messages', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
        errorMessage: {
          type: 'Custom error string.',
        },
      },
      number: {
        type: 'number',
        errorMessage: {
          type: 'Custom error number.',
        },
      },
      boolean: {
        type: 'boolean',
        errorMessage: {
          type: 'Custom error boolean.',
        },
      },
    },
  };
  const data = {
    string: 7,
    number: '7',
    boolean: 7,
  };
  expect(() => validate({ schema, data })).toThrow('Custom error string.; Custom error boolean.');
});

test('Nunjucks template in error message', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
        errorMessage: {
          type: '{{ keyword }}:{{ instancePath }}:{{ schemaPath }}:{{ message }}',
        },
      },
    },
  };
  const data = {
    string: 7,
  };
  expect(() => validate({ schema, data })).toThrow(
    'errorMessage:/string:#/properties/string/errorMessage:{{ keyword }}:{{ instancePath }}:{{ schemaPath }}:{{ message }}'
  );
});

test('Nunjucks template in error message', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
        errorMessage: {
          type: '{{ keyword }}:{{ instancePath }}:{{ schemaPath }}:{{ message }}',
        },
      },
      number: {
        type: 'number',
        errorMessage: {
          type: '{{ keyword }}:{{ instancePath }}:{{ schemaPath }}:{{ message }}',
        },
      },
    },
  };
  const data = {
    string: 7,
    number: '7',
  };
  expect(() => validate({ schema, data })).toThrow(
    'errorMessage:/string:#/properties/string/errorMessage:{{ keyword }}:{{ instancePath }}:{{ schemaPath }}:{{ message }}; errorMessage:/number:#/properties/number/errorMessage:{{ keyword }}:{{ instancePath }}:{{ schemaPath }}:{{ message }}'
  );
});

test('Object does not match schema, one error, returnErrors true', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
      },
    },
  };
  const data = {
    string: 7,
  };
  expect(validate({ schema, data, returnErrors: true })).toEqual({
    errors: [
      {
        instancePath: '/string',
        keyword: 'type',
        message: 'must be string',
        params: {
          type: 'string',
        },
        schemaPath: '#/properties/string/type',
      },
    ],
    valid: false,
  });
});

test('Object does not match schema, three errors, returnErrors true', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
      },
      number: {
        type: 'number',
      },
      boolean: {
        type: 'boolean',
      },
    },
  };
  const data = {
    string: 7,
    number: '7',
    boolean: 7,
  };
  expect(validate({ schema, data, returnErrors: true })).toEqual({
    errors: [
      {
        instancePath: '/string',
        keyword: 'type',
        message: 'must be string',
        params: {
          type: 'string',
        },
        schemaPath: '#/properties/string/type',
      },
      {
        instancePath: '/number',
        keyword: 'type',
        message: 'must be number',
        params: {
          type: 'number',
        },
        schemaPath: '#/properties/number/type',
      },
      {
        instancePath: '/boolean',
        keyword: 'type',
        message: 'must be boolean',
        params: {
          type: 'boolean',
        },
        schemaPath: '#/properties/boolean/type',
      },
    ],
    valid: false,
  });
});

test('Object does not match schema, one error, error message, returnErrors true', () => {
  const schema = {
    type: 'object',
    properties: {
      string: {
        type: 'string',
        errorMessage: {
          type: 'Custom error message.',
        },
      },
    },
  };
  const data = {
    string: 7,
  };
  expect(validate({ schema, data, returnErrors: true })).toEqual({
    errors: [
      {
        instancePath: '/string',
        keyword: 'errorMessage',
        message: 'Custom error message.',
        params: {
          errors: [
            {
              emUsed: true,
              instancePath: '/string',
              keyword: 'type',
              message: 'must be string',
              params: {
                type: 'string',
              },
              schemaPath: '#/properties/string/type',
            },
          ],
        },
        schemaPath: '#/properties/string/errorMessage',
      },
    ],
    valid: false,
  });
});

test('Error allocation is hard-capped at MAX_VALIDATION_ERRORS (DoS guard)', () => {
  // 50 disallowed properties — without the cap, Ajv would produce 50 errors.
  // With code.process injection, the generated validator early-exits at the cap.
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {},
  };
  const data = {};
  for (let i = 0; i < 50; i++) {
    data[`extra_${i}`] = i;
  }
  const result = validate({ schema, data, returnErrors: true });
  expect(result.valid).toBe(false);
  expect(result.errors).toHaveLength(MAX_VALIDATION_ERRORS);
});

test('Error count below cap is returned in full', () => {
  // Legitimate use case: a handful of errors should pass through unchanged.
  const schema = {
    type: 'object',
    properties: {
      a: { type: 'string' },
      b: { type: 'string' },
      c: { type: 'string' },
    },
  };
  const data = { a: 1, b: 2, c: 3 };
  const result = validate({ schema, data, returnErrors: true });
  expect(result.valid).toBe(false);
  expect(result.errors).toHaveLength(3);
});

test('A oneOf branch still matches when earlier branches exhaust the error cap', () => {
  // The shape every Lowdefy selector's `options` uses: a list of primitives, or
  // a list of label/value objects. Each branch that rejects the data spends one
  // error per entry, so a list long enough to exhaust the cap on the earlier
  // branches alone must still be judged on the branch that fits it.
  const schema = {
    type: 'object',
    properties: {
      options: {
        oneOf: [
          { type: 'array', items: { type: 'string' } },
          { type: 'array', items: { type: 'number' } },
          {
            type: 'array',
            items: {
              type: 'object',
              properties: { label: { type: 'string' }, value: { type: 'string' } },
            },
          },
        ],
      },
    },
  };
  const long = (make) => Array.from({ length: MAX_VALIDATION_ERRORS * 5 }, (_, i) => make(i));

  expect(validate({ schema, data: { options: long((i) => `option ${i}`) } })).toEqual({
    valid: true,
  });
  expect(validate({ schema, data: { options: long((i) => i) } })).toEqual({ valid: true });
  expect(
    validate({
      schema,
      data: { options: long((i) => ({ label: `option ${i}`, value: `${i}` })) },
    })
  ).toEqual({ valid: true });
});

test('A oneOf that no branch satisfies still fails, with errors capped', () => {
  const schema = {
    type: 'object',
    properties: {
      options: {
        oneOf: [
          { type: 'array', items: { type: 'string' } },
          { type: 'array', items: { type: 'number' } },
        ],
      },
    },
  };
  const data = { options: Array.from({ length: MAX_VALIDATION_ERRORS * 5 }, () => true) };
  const result = validate({ schema, data, returnErrors: true });
  expect(result.valid).toBe(false);
  expect(result.errors.length).toBeLessThanOrEqual(MAX_VALIDATION_ERRORS);
});
