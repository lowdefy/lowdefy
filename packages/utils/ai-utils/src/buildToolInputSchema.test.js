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

import buildToolInputSchema from './buildToolInputSchema.js';

test('buildToolInputSchema returns a schema without combinators unchanged', () => {
  const schema = {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
  };
  expect(buildToolInputSchema({ schema, description: 'Read one.' })).toEqual({
    inputSchema: schema,
    description: 'Read one.',
  });
});

test('buildToolInputSchema drops a top-level oneOf and states it at the head of the description', () => {
  const schema = {
    type: 'object',
    oneOf: [{ required: ['title', 'body'], not: { required: ['id'] } }, { required: ['id'] }],
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      body: { type: 'string' },
    },
  };
  expect(buildToolInputSchema({ schema, description: 'Write a task.' })).toEqual({
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string' },
      },
    },
    description:
      'Input constraint: Provide parameters for exactly one of: (title, body) or (id).\n\nWrite a task.',
  });
});

test('buildToolInputSchema describes a top-level anyOf as at least one of', () => {
  const schema = {
    type: 'object',
    anyOf: [{ required: ['shipped'] }, { required: ['remove'] }],
    properties: { shipped: { type: 'array' }, remove: { type: 'array' } },
  };
  const { inputSchema, description } = buildToolInputSchema({ schema, description: 'Ship.' });
  expect(inputSchema.anyOf).toBeUndefined();
  expect(description).toBe(
    'Input constraint: Provide parameters for at least one of: (shipped) or (remove).\n\nShip.'
  );
});

test('buildToolInputSchema describes a top-level allOf as all of', () => {
  const schema = {
    type: 'object',
    allOf: [{ required: ['a'] }, { required: ['b'] }],
    properties: { a: { type: 'string' }, b: { type: 'string' } },
  };
  const { inputSchema, description } = buildToolInputSchema({ schema, description: 'Both.' });
  expect(inputSchema.allOf).toBeUndefined();
  expect(description).toBe(
    'Input constraint: Provide parameters for all of: (a) and (b).\n\nBoth.'
  );
});

test('buildToolInputSchema lifts properties defined only inside branches', () => {
  const schema = {
    type: 'object',
    properties: { run_id: { type: 'string', description: 'Top level.' } },
    oneOf: [
      { properties: { text: { type: 'string' } }, required: ['text'] },
      {
        properties: { number: { type: 'integer' }, run_id: { type: 'number' } },
        required: ['number'],
      },
    ],
  };
  const { inputSchema } = buildToolInputSchema({ schema, description: 'Tick.' });
  expect(inputSchema).toEqual({
    type: 'object',
    properties: {
      run_id: { type: 'string', description: 'Top level.' },
      text: { type: 'string' },
      number: { type: 'integer' },
    },
  });
});

test('buildToolInputSchema leaves nested combinators in place', () => {
  const schema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { type: 'object', oneOf: [{ required: ['text'] }, { required: ['number'] }] },
      },
    },
  };
  expect(buildToolInputSchema({ schema, description: 'Tick.' })).toEqual({
    inputSchema: schema,
    description: 'Tick.',
  });
});

test('buildToolInputSchema writes a branch with no required list as JSON', () => {
  const schema = {
    type: 'object',
    oneOf: [{ required: ['id'] }, { properties: { mode: { const: 'all' } } }],
  };
  const { description } = buildToolInputSchema({ schema, description: 'Pick.' });
  expect(description).toBe(
    'Input constraint: Provide parameters for exactly one of: (id) or {"properties":{"mode":{"const":"all"}}}.\n\nPick.'
  );
});

test('buildToolInputSchema gives the constraint alone when the endpoint has no description', () => {
  const schema = {
    type: 'object',
    oneOf: [{ required: ['a'] }, { required: ['b'] }],
    properties: { a: { type: 'string' }, b: { type: 'string' } },
  };
  const { description } = buildToolInputSchema({ schema, description: undefined });
  expect(description).toBe('Input constraint: Provide parameters for exactly one of: (a) or (b).');
});

test('buildToolInputSchema states each top-level combinator on its own line', () => {
  const schema = {
    type: 'object',
    oneOf: [{ required: ['a'] }, { required: ['b'] }],
    anyOf: [{ required: ['c'] }, { required: ['d'] }],
    properties: {},
  };
  const { inputSchema, description } = buildToolInputSchema({ schema, description: 'Both.' });
  expect(inputSchema).toEqual({ type: 'object', properties: {} });
  expect(description).toBe(
    'Input constraint: Provide parameters for exactly one of: (a) or (b).\n\n' +
      'Input constraint: Provide parameters for at least one of: (c) or (d).\n\nBoth.'
  );
});

test('buildToolInputSchema does not change the schema it is given', () => {
  const schema = {
    type: 'object',
    oneOf: [{ required: ['a'] }, { required: ['b'] }],
    properties: { a: { type: 'string' } },
  };
  const copy = JSON.parse(JSON.stringify(schema));
  buildToolInputSchema({ schema, description: 'Pick.' });
  expect(schema).toEqual(copy);
});
