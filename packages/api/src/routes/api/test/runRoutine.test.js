import { jest } from '@jest/globals';

import runTest from './runTest.js';

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
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  expect(res.response).toEqual(null);
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
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  expect(res.response).toEqual(null);
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
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_2',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  expect(res.response).toEqual(null);
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
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_2',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
    {
      stepId: 'test_request_3',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: null,
    },
  ]);
  expect(res.response).toEqual(null);
});
