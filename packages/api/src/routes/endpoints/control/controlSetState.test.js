/*
  Copyright 2020-2024 Lowdefy, Inc

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

import runTest from '../test/runTest.js';

test('set_state sets simple value', async () => {
  const routine = [
    {
      ':set_state': {
        key: 'value',
      },
    },
    {
      ':return': { _state: 'key' },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual('value');
  expect(context.logger.debug.mock.calls).toContainEqual([
    {
      event: 'debug_control_set_state',
      input: { key: 'value' },
      evaluated: { key: 'value' },
    },
  ]);
});

test('set_state sets multiple values', async () => {
  const routine = [
    {
      ':set_state': {
        key1: 'value1',
        key2: 'value2',
      },
    },
    {
      ':return': { key1: { _state: 'key1' }, key2: { _state: 'key2' } },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ key1: 'value1', key2: 'value2' });
});

test('set_state sets nested path', async () => {
  const routine = [
    {
      ':set_state': {
        'user.name': 'John',
        'user.age': 30,
      },
    },
    {
      ':return': { _state: 'user' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ name: 'John', age: 30 });
});

test('set_state evaluates operators in value', async () => {
  const routine = [
    {
      ':set_state': {
        computed: { _sum: [1, 2, 3] },
      },
    },
    {
      ':return': { _state: 'computed' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual(6);
});

test('set_state with empty object', async () => {
  const routine = [
    {
      ':set_state': {},
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toContainEqual([
    {
      event: 'debug_control_set_state',
      input: {},
      evaluated: {},
    },
  ]);
});

test('set_state overwrites existing value', async () => {
  const routine = [
    {
      ':set_state': {
        key: 'first',
      },
    },
    {
      ':set_state': {
        key: 'second',
      },
    },
    {
      ':return': { _state: 'key' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual('second');
});

test('set_state with array value', async () => {
  const routine = [
    {
      ':set_state': {
        items: [1, 2, 3],
      },
    },
    {
      ':return': { _state: 'items' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual([1, 2, 3]);
});

test('set_state with object value', async () => {
  const routine = [
    {
      ':set_state': {
        config: { enabled: true, count: 5 },
      },
    },
    {
      ':return': { _state: 'config' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ enabled: true, count: 5 });
});

test('set_state with null value', async () => {
  const routine = [
    {
      ':set_state': {
        nullable: null,
      },
    },
    {
      ':return': { _state: 'nullable' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual(null);
});

test('set_state returns continue status', async () => {
  const routine = {
    ':set_state': {
      key: 'value',
    },
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('continue');
});
