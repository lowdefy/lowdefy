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

import runTest from '../test/runTest.js';

test('parallel_for iterates over array', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': ['a', 'b', 'c'],
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
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toContainEqual([
    {
      event: 'debug_control_parallel',
      array: ['a', 'b', 'c'],
      itemName: 'item',
    },
  ]);
});

test('parallel_for with empty array', async () => {
  const routine = {
    ':parallel_for': 'item',
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
      event: 'debug_control_parallel',
      array: [],
      itemName: 'item',
    },
  ]);
});

test('parallel_for with object array', async () => {
  const routine = {
    ':parallel_for': 'user',
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

test('missing :parallel_for variable name', async () => {
  const routine = {
    ':parallel_for': '',
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
  expect(res.error.message).toContain(':parallel_for');
  expect(res.error.message).toContain('missing variable name');
});

test(':in is not an array', async () => {
  const routine = {
    ':parallel_for': 'item',
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
  // Received value is stored in error.received, not in message - logger formats it
  expect(res.error.received).toBe('not an array');
});

test('missing :do', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': [1, 2, 3],
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error.message).toContain('missing :do');
});

test('parallel_for logs iteration details', async () => {
  const routine = {
    ':parallel_for': 'item',
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
    (call) => call[0].event === 'debug_control_parallel_iteration'
  );
  expect(iterationLog).toBeDefined();
  expect(iterationLog[0].itemName).toEqual('item');
  expect(iterationLog[0].value).toEqual('x');
});

test('parallel_for handles error result', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': [1, 2],
    ':do': {
      ':throw': { message: 'test error' },
    },
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('error');
});

test('parallel_for handles reject result', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': [1, 2],
    ':do': {
      ':reject': { message: 'rejected' },
    },
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('reject');
});

test('parallel_for handles return result', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': [1, 2],
    ':do': {
      ':return': { value: 'returned' },
    },
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ value: 'returned' });
});

test('parallel_for error takes priority over reject', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': [1, 2],
    ':do': {
      ':if': { _eq: [{ _item: 'item' }, 1] },
      ':then': { ':throw': { message: 'error' } },
      ':else': { ':reject': { message: 'reject' } },
    },
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('error');
});
