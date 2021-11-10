/*
  Copyright 2020-2021 Lowdefy, Inc

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

import WebParser from '../../src/webParser.js';
import { context } from '../testContext.js';

const arrayIndices = [1];

console.error = () => {};

test('_event_log in array', async () => {
  const input = { a: { _event_log: '1.blockId' } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: 'block_b',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log full state', async () => {
  const input = { _event_log: true };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([
    {
      blockId: 'block_a',
      actionName: 'name_a',
      response: [{ data: ['a', 'b'] }],
      ts: new Date(0),
      status: 'success',
    },
    {
      blockId: 'block_b',
      actionName: 'name_b',
      ts: new Date(1),
      error: [{ error: 'error', message: 'broken', name: 'e' }],
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log null', async () => {
  const input = { _event_log: null };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _event_log params must be of type string, integer, boolean or object. Received: null at locationId.],
    ]
  `);
});

test('_event_log param object key', async () => {
  const input = {
    _event_log: {
      key: '0.actionName',
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('name_a');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object all', async () => {
  const input = {
    _event_log: {
      all: true,
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([
    {
      blockId: 'block_a',
      actionName: 'name_a',
      response: [{ data: ['a', 'b'] }],
      ts: new Date(0),
      status: 'success',
    },
    {
      blockId: 'block_b',
      actionName: 'name_b',
      ts: new Date(1),
      error: [{ error: 'error', message: 'broken', name: 'e' }],
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object all and key', async () => {
  const input = {
    _event_log: {
      all: true,
      key: 'string',
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([
    {
      blockId: 'block_a',
      actionName: 'name_a',
      response: [{ data: ['a', 'b'] }],
      ts: new Date(0),
      status: 'success',
    },
    {
      blockId: 'block_b',
      actionName: 'name_b',
      ts: new Date(1),
      error: [{ error: 'error', message: 'broken', name: 'e' }],
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object invalid', async () => {
  const input = {
    _event_log: {
      other: true,
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _event_log.key must be of type string or integer. Received: {"other":true} at locationId.],
    ]
  `);
});

test('_event_log param array', async () => {
  const input = {
    _event_log: ['string'],
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _event_log params must be of type string, integer, boolean or object. Received: ["string"] at locationId.],
    ]
  `);
});

test('_event_log param object with string default', async () => {
  const input = {
    _event_log: {
      key: 'notFound',
      default: 'defaultValue',
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object with zero default', async () => {
  const input = {
    _event_log: {
      key: 'notFound',
      default: 0,
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(0);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object with false default', async () => {
  const input = {
    _event_log: {
      key: 'notFound',
      default: false,
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object with no default', async () => {
  const input = {
    _event_log: {
      key: 'notFound',
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
