import { jest } from '@jest/globals';

import runTest from './runTest.js';

test('two steps in parallel', async () => {
  const routine = {
    ':parallel': [
      {
        id: 'test_request_wait_30',
        type: 'TestRequestWait',
        properties: {
          ms: 30,
        },
      },
      {
        id: 'test_request_wait_10',
        type: 'TestRequestWait',
        properties: {
          ms: 10,
        },
      },
    ],
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_wait_10',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_wait_30',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  expect(res.response).toEqual(null);
});

test('steps after parallel', async () => {
  const routine = [
    {
      ':parallel': [
        {
          id: 'test_request_wait_30',
          type: 'TestRequestWait',
          properties: {
            ms: 30,
          },
        },
        {
          id: 'test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
    {
      id: 'test_request_after_parallel',
      type: 'TestRequest',
      properties: {
        response: 'after parallel',
      },
    },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_wait_10',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_wait_30',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_after_parallel',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'after parallel',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('steps before and after parallel', async () => {
  const routine = [
    {
      id: 'test_request_before_parallel',
      type: 'TestRequest',
      properties: {
        response: 'before parallel',
      },
    },
    {
      ':parallel': [
        {
          id: 'test_request_wait_30',
          type: 'TestRequestWait',
          properties: {
            ms: 30,
          },
        },
        {
          id: 'test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
    {
      id: 'test_request_after_parallel',
      type: 'TestRequest',
      properties: {
        response: 'after parallel',
      },
    },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_before_parallel',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'before parallel',
    },
    {
      stepId: 'test_request_wait_10',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_wait_30',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_after_parallel',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'after parallel',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('return in parallel', async () => {
  const routine = [
    {
      ':parallel': [
        { ':return': { message: 'returned in parallel' } },
        {
          id: 'test_request_wait_30',
          type: 'TestRequestWait',
          properties: {
            ms: 30,
          },
        },
        {
          id: 'test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
    {
      stepId: 'test_request_after_parallel',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'after parallel',
    },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_wait_10',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_wait_30',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  expect(res.response).toEqual({ message: 'returned in parallel' });
});

test('multiple returns in parallel', async () => {
  const routine = [
    {
      ':parallel': [
        { ':return': { message: 'first return in parallel' } },
        { ':return': { message: 'second return in parallel' } },
        {
          id: 'test_request_wait_30',
          type: 'TestRequestWait',
          properties: {
            ms: 30,
          },
        },
        {
          id: 'test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
    {
      stepId: 'test_request_after_parallel',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'after parallel',
    },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_wait_10',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_wait_30',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  expect(res.response).toEqual({ message: 'first return in parallel' });
});

test('multiple returns in parallel with wait before first return', async () => {
  const routine = [
    {
      ':parallel': [
        [
          {
            id: 'test_request_wait_30',
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
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_wait_30',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  expect(res.response).toEqual({ message: 'first return in parallel with wait' });
});

test('if in parallel', async () => {
  const routine = [
    {
      ':parallel': [
        {
          ':if': true,
          ':then': {
            id: 'test_request_wait_40',
            type: 'TestRequestWait',
            properties: {
              ms: 40,
            },
          },
          ':else': {
            id: 'test_request_wait_50',
            type: 'TestRequestWait',
            properties: {
              ms: 50,
            },
          },
        },
        {
          id: 'test_request_wait_30',
          type: 'TestRequestWait',
          properties: {
            ms: 30,
          },
        },
        {
          id: 'test_request_wait_10',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      ],
    },
    {
      stepId: 'test_request_after_parallel',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'after parallel',
    },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_wait_10',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_wait_30',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_wait_40',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_after_parallel',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'after parallel',
    },
  ]);
  expect(res.response).toEqual(null);
});
