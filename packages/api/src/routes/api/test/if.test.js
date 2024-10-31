import { jest } from '@jest/globals';

import runTest from './runTest.js';

test('if condition is true', async () => {
  const routine = {
    ':if': true,
    ':then': {
      id: 'test_request_true',
      type: 'TestRequest',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'test_request_false',
      type: 'TestRequest',
      properties: {
        response: 'Was false',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_true',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Was true',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('if condition is false', async () => {
  const routine = {
    ':if': false,
    ':then': {
      id: 'test_request_true',
      type: 'TestRequest',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'test_request_false',
      type: 'TestRequest',
      properties: {
        response: 'Was false',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_false',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Was false',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('if condition is truthy', async () => {
  const routine = {
    ':if': 1,
    ':then': {
      id: 'test_request_true',
      type: 'TestRequest',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'test_request_false',
      type: 'TestRequest',
      properties: {
        response: 'Was false',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_true',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Was true',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('if condition is falsey', async () => {
  const routine = {
    ':if': 0,
    ':then': {
      id: 'test_request_true',
      type: 'TestRequest',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'test_request_false',
      type: 'TestRequest',
      properties: {
        response: 'Was false',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_false',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Was false',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('if condition is null', async () => {
  const routine = {
    ':if': null,
    ':then': {
      id: 'test_request_true',
      type: 'TestRequest',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'test_request_false',
      type: 'TestRequest',
      properties: {
        response: 'Was false',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_false',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Was false',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('if condition operators are evaluated', async () => {
  const routine = {
    ':if': {
      _eq: [1, 2],
    },
    ':then': {
      id: 'test_request_true',
      type: 'TestRequest',
      properties: {
        response: 'Was true',
      },
    },
    ':else': {
      id: 'test_request_false',
      type: 'TestRequest',
      properties: {
        response: 'Was false',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_false',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Was false',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('if condition is false with no else', async () => {
  const routine = {
    ':if': false,
    ':then': {
      id: 'test_request_true',
      type: 'TestRequest',
      properties: {
        response: 'Was true',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([]);
  expect(res.response).toEqual(null);
});

test('if condition is true with no else', async () => {
  const routine = {
    ':if': true,
    ':then': {
      id: 'test_request_true',
      type: 'TestRequest',
      properties: {
        response: 'Was true',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_true',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Was true',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('missing :then', async () => {
  const routine = {
    ':if': true,
  };
  expect(async () => await runTest({ routine })).rejects.toThrow('TODO: Missing :then');
});
