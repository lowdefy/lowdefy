import { jest } from '@jest/globals';

import runTest from '../test/runTest.js';

//TODO Implement wait requests
function getRequestLogs(logs) {
  return logs.filter((log) => log[0]?.event === 'debug_start_request');
}
test('two steps in parallel', async () => {
  const routine = {
    ':parallel': [
      {
        id: 'request:test_request_wait_30',
        type: 'TestRequestWait',
        properties: {
          ms: 30,
        },
      },
      {
        id: 'request:test_request_wait_10',
        type: 'TestRequestWait',
        properties: {
          ms: 10,
        },
      },
    ],
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(res.response).toEqual(undefined);
});

test('steps after parallel', async () => {
  const routine = [
    {
      ':parallel': [
        {
          id: 'request:test_request_wait_30',
          type: 'TestRequestWait',
          properties: {
            ms: 30,
          },
        },
        {
          id: 'request:test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
    {
      id: 'request:test_request_after_parallel',
      type: 'TestRequest',
      properties: {
        response: 'after parallel',
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(res.response).toEqual(undefined);
});

test('steps before and after parallel', async () => {
  const routine = [
    {
      id: 'request:test_request_before_parallel',
      type: 'TestRequest',
      properties: {
        response: 'before parallel',
      },
    },
    {
      ':parallel': [
        {
          id: 'request:test_request_wait_30',
          type: 'TestRequestWait',
          properties: {
            ms: 30,
          },
        },
        {
          id: 'request:test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
    {
      id: 'request:test_request_after_parallel',
      type: 'TestRequest',
      properties: {
        response: 'after parallel',
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(res.response).toEqual(undefined);
});

test('return in parallel', async () => {
  const routine = [
    {
      ':parallel': [
        { ':return': { message: 'returned in parallel' } },
        {
          id: 'request:test_request_wait_30',
          type: 'TestRequestWait',
          properties: {
            ms: 30,
          },
        },
        {
          id: 'request:test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
    {
      stepId: 'request:test_request_after_parallel',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'after parallel',
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ message: 'returned in parallel' });
});

test('multiple returns in parallel', async () => {
  const routine = [
    {
      ':parallel': [
        { ':return': { message: 'first return in parallel' } },
        { ':return': { message: 'second return in parallel' } },
        {
          id: 'request:test_request_wait_30',
          type: 'TestRequestWait',
          properties: {
            ms: 30,
          },
        },
        {
          id: 'request:test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
    {
      stepId: 'request:test_request_after_parallel',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'after parallel',
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ message: 'first return in parallel' });
});

test('multiple returns in parallel with wait before first return', async () => {
  const routine = [
    {
      ':parallel': [
        [
          {
            id: 'request:test_request_wait_30',
            type: 'TestRequestWait',
            properties: {
              ms: 30,
            },
          },
          { ':return': { message: 'first return in parallel with wait' } },
        ],
        { ':return': { message: 'second return in parallel' } },
      ],
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ message: 'first return in parallel with wait' });
});

test('if in parallel', async () => {
  const routine = [
    {
      ':parallel': [
        {
          ':if': true,
          ':then': {
            id: 'request:test_request_wait_40',
            type: 'TestRequestWait',
            properties: {
              ms: 40,
            },
          },
          ':else': {
            id: 'request:test_request_wait_50',
            type: 'TestRequestWait',
            properties: {
              ms: 50,
            },
          },
        },
        {
          id: 'request:test_request_wait_30',
          type: 'TestRequestWait',
          properties: {
            ms: 30,
          },
        },
        {
          id: 'request:test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(res.response).toEqual(undefined);
});

// TODO:
test('parallel with return and throw', async () => {
  const routine = [
    {
      ':parallel': [
        [
          {
            id: 'request:test_request_wait_40',
            type: 'TestRequestWait',
            properties: {
              ms: 40,
            },
          },
          { ':return': { message: 'Return parallel' } },
        ],
        {
          id: 'request:test_request_wait_50',
          type: 'TestRequestWait',
          properties: {
            ms: 50,
          },
        },
        [
          {
            id: 'request:test_request_wait_30',
            type: 'TestRequestWait',
            properties: {
              ms: 30,
            },
          },
          { ':throw': 'Error in parallel routine' },
        ],
        {
          id: 'request:test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(new Error('Error in parallel routine'));
});

test('parallel with reject and throw', async () => {
  const routine = [
    {
      ':parallel': [
        [
          {
            id: 'request:test_request_wait_40',
            type: 'TestRequestWait',
            properties: {
              ms: 40,
            },
          },
          { ':throw': 'Error in parallel routine' },
        ],
        {
          id: 'request:test_request_wait_50',
          type: 'TestRequestWait',
          properties: {
            ms: 50,
          },
        },
        [
          {
            id: 'request:test_request_wait_30',
            type: 'TestRequestWait',
            properties: {
              ms: 30,
            },
          },
          { ':reject': { info: 'Rejection in parallel' } },
        ],
        {
          id: 'request:test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(new Error('Error in parallel routine'));
});

test('parallel with return and reject', async () => {
  const routine = [
    {
      ':parallel': [
        [
          {
            id: 'request:test_request_wait_40',
            type: 'TestRequestWait',
            properties: {
              ms: 40,
            },
          },
          { ':return': { message: 'Return from parallel' } },
        ],
        {
          id: 'request:test_request_wait_50',
          type: 'TestRequestWait',
          properties: {
            ms: 50,
          },
        },
        [
          {
            id: 'request:test_request_wait_30',
            type: 'TestRequestWait',
            properties: {
              ms: 30,
            },
          },
          { ':reject': { info: 'Rejection in parallel' } },
        ],
        {
          id: 'request:test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('reject');
  expect(res.response).toEqual({ info: 'Rejection in parallel' });
});
