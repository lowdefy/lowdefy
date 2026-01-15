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

test('for loop iterates over array', async () => {
  const routine = {
    ':for': 'item',
    ':in': ['a', 'b', 'c'],
    ':do': {
      id: 'request:test_endpoint:test_request',
      type: 'TestRequest',
      requestId: 'test_request',
      connectionId: 'test',
      properties: {
        response: { _item: 'item' },
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toContainEqual([
    {
      event: 'debug_control_for',
      array: ['a', 'b', 'c'],
      itemName: 'item',
    },
  ]);
});

test('for loop with empty array', async () => {
  const routine = {
    ':for': 'item',
    ':in': [],
    ':do': {
      id: 'request:test_endpoint:test_request',
      type: 'TestRequest',
      requestId: 'test_request',
      connectionId: 'test',
      properties: {
        response: 'should not run',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toContainEqual([
    {
      event: 'debug_control_for',
      array: [],
      itemName: 'item',
    },
  ]);
});

test('for loop with object array', async () => {
  const routine = {
    ':for': 'user',
    ':in': [{ name: 'Alice' }, { name: 'Bob' }],
    ':do': {
      id: 'request:test_endpoint:test_request',
      type: 'TestRequest',
      requestId: 'test_request',
      connectionId: 'test',
      properties: {
        response: 'processed',
      },
    },
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('continue');
});

test('for loop evaluates :in with operators', async () => {
  const routine = {
    ':for': 'num',
    ':in': { '_array.map': [[1, 2], { '_function': { __args: 0 } }] },
    ':do': {
      id: 'request:test_endpoint:test_request',
      type: 'TestRequest',
      requestId: 'test_request',
      connectionId: 'test',
      properties: {
        response: 'ok',
      },
    },
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('continue');
});

test('missing :for variable name', async () => {
  const routine = {
    ':for': '',
    ':in': [1, 2, 3],
    ':do': {
      id: 'request:test_endpoint:test_request',
      type: 'TestRequest',
      requestId: 'test_request',
      connectionId: 'test',
      properties: {
        response: 'ok',
      },
    },
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error.message).toContain(':for');
  expect(res.error.message).toContain('missing variable name');
});

test(':in is not an array', async () => {
  const routine = {
    ':for': 'item',
    ':in': 'not an array',
    ':do': {
      id: 'request:test_endpoint:test_request',
      type: 'TestRequest',
      requestId: 'test_request',
      connectionId: 'test',
      properties: {
        response: 'ok',
      },
    },
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error.message).toContain(':in must evaluate to an array');
  expect(res.error.message).toContain('not an array');
});

test('missing :do', async () => {
  const routine = {
    ':for': 'item',
    ':in': [1, 2, 3],
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error.message).toContain('missing :do');
});

test('for loop with return in routine', async () => {
  const routine = {
    ':for': 'item',
    ':in': [1, 2, 3],
    ':do': [
      {
        ':if': { _eq: [{ _item: 'item' }, 2] },
        ':then': {
          ':return': { result: 'found 2' },
        },
      },
    ],
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ result: 'found 2' });
});

test('for loop logs iteration details', async () => {
  const routine = {
    ':for': 'item',
    ':in': ['x'],
    ':do': {
      id: 'request:test_endpoint:test_request',
      type: 'TestRequest',
      requestId: 'test_request',
      connectionId: 'test',
      properties: {
        response: 'ok',
      },
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  const iterationLog = context.logger.debug.mock.calls.find(
    (call) => call[0].event === 'debug_control_for_iteration'
  );
  expect(iterationLog).toBeDefined();
  expect(iterationLog[0].itemName).toEqual('item');
  expect(iterationLog[0].value).toEqual('x');
});
