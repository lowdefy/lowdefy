import { jest } from '@jest/globals';

import runTest from './test/runTest.js';

test('single stage', async () => {
  const routine = {
    id: 'test_request',
    type: 'TestRequestWait',
    properties: {
      ms: 10,
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request',
      type: 'TestRequest',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  // TODO: Do we return null or undefined
  expect(res.response).toEqual(undefined);
});

test('array with single stage', async () => {
  const routine = [
    {
      id: 'test_request',
      type: 'TestRequestWait',
      properties: {
        ms: 10,
      },
    },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request',
      type: 'TestRequest',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  expect(res.response).toEqual(undefined);
});

test('array with two stages', async () => {
  const routine = [
    {
      id: 'test_request_1',
      type: 'TestRequestWait',
      properties: {
        ms: 10,
      },
    },
    {
      id: 'test_request_2',
      type: 'TestRequestWait',
      properties: {
        ms: 10,
      },
    },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_1',
      type: 'TestRequest',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_2',
      type: 'TestRequest',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  expect(res.response).toEqual(undefined);
});

test('nested array', async () => {
  const routine = [
    [
      {
        id: 'test_request_1',
        type: 'TestRequestWait',
        properties: {
          ms: 10,
        },
      },
      {
        id: 'test_request_2',
        type: 'TestRequestWait',
        properties: {
          ms: 10,
        },
      },
    ],
    {
      id: 'test_request_3',
      type: 'TestRequestWait',
      properties: {
        ms: 10,
      },
    },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_1',
      type: 'TestRequest',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_2',
      type: 'TestRequest',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_3',
      type: 'TestRequest',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  expect(res.response).toEqual(undefined);
});

test('unknown control', async () => {
  const routine = {
    ':unknown': {
      id: 'test_request',
      type: 'TestRequest',
      properties: {
        response: 'test',
      },
    },
  };
  expect(async () => await runTest({ routine })).rejects.toThrow('TODO: unknown control');
});
