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

import runTest, { inFlight } from '../test/runTest.js';

test('parallel_for iterates over array', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': ['a', 'b', 'c'],
    ':do': {
      id: 'request:test_endpoint:test_request',
      type: 'TestRequest',
      stepId: 'test_request',
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
      stepId: 'test_request',
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
      stepId: 'test_request',
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
      stepId: 'test_request',
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
      stepId: 'test_request',
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
      stepId: 'test_request',
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

function inFlightStep(ms) {
  return {
    id: 'request:test_endpoint:in_flight',
    type: 'TestRequestInFlight',
    stepId: 'in_flight',
    connectionId: 'test',
    properties: { ms, response: 'ok' },
  };
}

test('parallel_for runs every item at once without :concurrency', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': [1, 2, 3, 4, 5],
    ':do': inFlightStep(20),
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(inFlight.max).toEqual(5);
});

test('parallel_for with :concurrency runs at most that many items at once', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': [1, 2, 3, 4, 5, 6, 7],
    ':concurrency': 2,
    ':do': inFlightStep(10),
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(inFlight.max).toEqual(2);
  const values = context.logger.debug.mock.calls
    .filter((call) => call[0].event === 'debug_control_parallel_iteration')
    .map((call) => call[0].value);
  expect(values).toEqual([1, 2, 3, 4, 5, 6, 7]);
});

test('parallel_for evaluates :concurrency operators', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': [1, 2, 3, 4],
    ':concurrency': { _payload: 'concurrency' },
    ':do': inFlightStep(10),
  };
  const { res } = await runTest({ routine, payload: { concurrency: 3 } });
  expect(res.status).toEqual('continue');
  expect(inFlight.max).toEqual(3);
});

test('parallel_for with :concurrency still runs every item after an error and returns it', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': [1, 2, 3],
    ':concurrency': 1,
    ':do': {
      ':if': { _eq: [{ _item: 'item' }, 1] },
      ':then': {
        id: 'request:test_endpoint:test_request_error',
        type: 'TestRequestError',
        stepId: 'test_request_error',
        connectionId: 'test',
        properties: { message: 'First item failed.' },
      },
      ':else': inFlightStep(1),
    },
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error.message).toContain('First item failed.');
  const values = context.logger.debug.mock.calls
    .filter((call) => call[0].event === 'debug_control_parallel_iteration')
    .map((call) => call[0].value);
  expect(values).toEqual([1, 2, 3]);
});

test('parallel_for with a :concurrency larger than the array runs every item at once', async () => {
  const routine = {
    ':parallel_for': 'item',
    ':in': [1, 2, 3],
    ':concurrency': 10,
    ':do': inFlightStep(10),
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(inFlight.max).toEqual(3);
});

test.each([0, -1, 1.5, 'two'])(
  'parallel_for returns an error when :concurrency is %p',
  async (concurrency) => {
    const routine = {
      ':parallel_for': 'item',
      ':in': [1, 2],
      ':concurrency': concurrency,
      ':do': inFlightStep(1),
    };
    const { res } = await runTest({ routine });
    expect(res.status).toEqual('error');
    expect(res.error.message).toContain(':concurrency must be a positive integer');
    expect(res.error.received).toEqual(concurrency);
  }
);
