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

import getConfigSchemaErrors from './getConfigSchemaErrors.js';
import { expect, test } from 'vitest';

const ifSchema = {
  type: 'object',
  required: ['test'],
  properties: {
    test: { type: 'boolean' },
    then: {},
    else: {},
  },
  additionalProperties: false,
};

const propertiesSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    size: { type: 'string', enum: ['small', 'large'] },
    columns: { type: 'array', items: { type: 'object' } },
    content: {
      oneOf: [{ type: 'string' }, { type: 'object', required: ['text'] }],
    },
  },
};

function summarize(errors) {
  return errors.map((error) => `${error.keyword} ${error.instancePath}`);
}

test('getConfigSchemaErrors returns no errors for valid literal data', () => {
  expect(getConfigSchemaErrors({ schema: ifSchema, data: { test: true, then: 1 } })).toEqual([]);
});

test('getConfigSchemaErrors reports a missing required key beside an operator', () => {
  const errors = getConfigSchemaErrors({
    schema: ifSchema,
    data: { _eq: [{ _state: 'a' }, 1], then: { _state: 'b' }, else: 2 },
  });
  expect(summarize(errors)).toEqual(['required ', 'additionalProperties ']);
  expect(errors[0].params.missingProperty).toBe('test');
  expect(errors[1].params.additionalProperty).toBe('_eq');
});

test('getConfigSchemaErrors drops a type error on an operator value', () => {
  expect(
    getConfigSchemaErrors({
      schema: ifSchema,
      data: { test: { _eq: [{ _state: 'a' }, 1] }, then: 1 },
    })
  ).toEqual([]);
});

test('getConfigSchemaErrors drops errors on an operator array item', () => {
  expect(
    getConfigSchemaErrors({
      schema: propertiesSchema,
      data: { columns: [{ field: 'a' }, { _state: 'column' }] },
    })
  ).toEqual([]);
});

test('getConfigSchemaErrors reports a literal array item beside an operator item', () => {
  const errors = getConfigSchemaErrors({
    schema: propertiesSchema,
    data: { columns: [{ _state: 'column' }, 'a'] },
  });
  expect(summarize(errors)).toEqual(['type /columns/1']);
});

test('getConfigSchemaErrors reports a misspelt key whose value is an operator', () => {
  const errors = getConfigSchemaErrors({
    schema: propertiesSchema,
    data: { titel: { _state: 'title' } },
  });
  expect(summarize(errors)).toEqual(['additionalProperties ']);
  expect(errors[0].params.additionalProperty).toBe('titel');
});

test('getConfigSchemaErrors drops a oneOf above an operator, with its branch errors', () => {
  const schema = {
    type: 'object',
    properties: {
      key: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
    },
  };
  expect(
    getConfigSchemaErrors({ schema, data: { key: { '_string.concat': ['a', 'b'] } } })
  ).toEqual([]);
});

test('getConfigSchemaErrors drops an anyOf branch error on an array holding an operator', () => {
  const schema = {
    type: 'object',
    properties: {
      value: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
    },
  };
  expect(getConfigSchemaErrors({ schema, data: { value: [{ _state: 'x' }] } })).toEqual([]);
  expect(
    getConfigSchemaErrors({
      schema: {
        ...schema,
        properties: { value: { ...schema.properties.value, errorMessage: 'bad' } },
      },
      data: { value: [{ _state: 'x' }] },
    })
  ).toEqual([]);
});

test('getConfigSchemaErrors drops the then and else errors of an if above an operator', () => {
  const schema = {
    type: 'object',
    if: { properties: { mode: { const: 'a' } } },
    then: { required: ['a'] },
    else: { required: ['b'] },
  };
  expect(getConfigSchemaErrors({ schema, data: { mode: { _state: 'mode' } } })).toEqual([]);
});

test('getConfigSchemaErrors keeps errors beside a dropped oneOf', () => {
  const schema = {
    type: 'object',
    required: ['name'],
    properties: {
      key: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
      size: { type: 'number' },
    },
  };
  const errors = getConfigSchemaErrors({
    schema,
    data: { key: { _state: 'k' }, size: 'big' },
  });
  expect(summarize(errors)).toEqual(['required ', 'type /size']);
});

test('getConfigSchemaErrors reports a oneOf with no operator under it', () => {
  const errors = getConfigSchemaErrors({ schema: propertiesSchema, data: { content: 5 } });
  expect(summarize(errors)).toContain('oneOf /content');
});

test('getConfigSchemaErrors reports an enum error on a literal value', () => {
  const errors = getConfigSchemaErrors({ schema: propertiesSchema, data: { size: 'huge' } });
  expect(summarize(errors)).toEqual(['enum /size']);
});

test('getConfigSchemaErrors returns no errors for data that is one operator', () => {
  expect(getConfigSchemaErrors({ schema: ifSchema, data: { _state: 'ifParams' } })).toEqual([]);
});

test('getConfigSchemaErrors leaves out ~ keys', () => {
  expect(
    getConfigSchemaErrors({
      schema: ifSchema,
      data: { test: true, '~k': '12', '~r': '3', '~ignoreBuildChecks': true },
    })
  ).toEqual([]);
});

test('getConfigSchemaErrors treats an operator beside ~ keys as an operator', () => {
  expect(
    getConfigSchemaErrors({
      schema: propertiesSchema,
      data: { title: { _state: 'title', '~k': '7' } },
    })
  ).toEqual([]);
});

test('getConfigSchemaErrors does not change the data it checks', () => {
  const data = { test: { _state: 'a', '~k': '1' }, '~k': '2' };
  getConfigSchemaErrors({ schema: ifSchema, data });
  expect(data).toEqual({ test: { _state: 'a', '~k': '1' }, '~k': '2' });
});

test('getConfigSchemaErrors drops an errorMessage whose reworded errors sit on an operator', () => {
  const schema = {
    type: 'object',
    properties: {
      count: { type: 'number', errorMessage: 'count must be a number' },
    },
  };
  expect(getConfigSchemaErrors({ schema, data: { count: { _state: 'count' } } })).toEqual([]);
  const errors = getConfigSchemaErrors({ schema, data: { count: 'many' } });
  expect(errors.map((error) => error.message)).toEqual(['count must be a number']);
});

test('getConfigSchemaErrors escapes keys in operator paths', () => {
  const schema = {
    type: 'object',
    properties: { 'a/b': { type: 'string' }, 'c~d': { type: 'string' } },
  };
  expect(
    getConfigSchemaErrors({ schema, data: { 'a/b': { _state: 'x' }, 'c~d': { _state: 'y' } } })
  ).toEqual([]);
});

test('getConfigSchemaErrors reads a null value as unset', () => {
  expect(
    getConfigSchemaErrors({ schema: propertiesSchema, data: { title: null, size: null } })
  ).toEqual([]);
  const errors = getConfigSchemaErrors({ schema: ifSchema, data: { test: null } });
  expect(summarize(errors)).toEqual(['required ']);
});
