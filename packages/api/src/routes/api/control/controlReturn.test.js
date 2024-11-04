import { jest } from '@jest/globals';

import runTest from '../test/runTest.js';

test('single return', async () => {
  const routine = {
    ':return': true,
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([]); // add step for return?
  expect(res.response).toEqual(true);
});

test('return null', async () => {
  const routine = {
    ':return': null,
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([]);
  expect(res.response).toEqual(null);
});

test('return at end of routine', async () => {
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
    {
      ':return': {
        message: 'Successful',
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
  expect(res.response).toEqual({ message: 'Successful' });
});

test('return in the middle of routine', async () => {
  const routine = [
    {
      id: 'test_request_1',
      type: 'TestRequestWait',
      properties: {
        ms: 10,
      },
    },
    {
      ':return': {
        message: 'Successful',
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
  ]);
  expect(res.response).toEqual({ message: 'Successful' });
});

test('multiple returns in routine', async () => {
  const routine = [
    {
      id: 'test_request_1',
      type: 'TestRequestWait',
      properties: {
        ms: 10,
      },
    },
    {
      ':return': {
        message: 'First',
      },
    },
    {
      ':return': {
        message: 'Second',
      },
    },
    {
      ':return': {
        message: 'Third',
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
  ]);
  expect(res.response).toEqual({ message: 'First' });
});

test('truthy guard statement return', async () => {
  const routine = [
    {
      ':if': true,
      ':then': [
        {
          id: 'test_request_guard_statement',
          type: 'TestRequest',
          properties: {
            response: 'guard statement',
          },
        },
        { ':return': { message: 'returned by guard statement' } },
      ],
    },
    {
      id: 'test_request_end',
      type: 'TestRequest',
      properties: {
        response: 'end',
      },
    },
    { ':return': { message: 'made it to the end' } },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_guard_statement',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'guard statement',
    },
  ]);
  expect(res.response).toEqual({ message: 'returned by guard statement' });
});

test('falsy guard statement return', async () => {
  const routine = [
    {
      ':if': false,
      ':then': [
        {
          id: 'test_request_guard_statement',
          type: 'TestRequest',
          properties: {
            response: 'guard statement',
          },
        },
        { ':return': { message: 'returned by guard statement' } },
      ],
    },
    {
      id: 'test_request_end',
      type: 'TestRequest',
      properties: {
        response: 'end',
      },
    },
    { ':return': { message: 'made it to the end' } },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_end',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'end',
    },
  ]);
  expect(res.response).toEqual({ message: 'made it to the end' });
});

test('error thrown in routine', async () => {
  const routine = [
    {
      id: 'test_error_1',
      type: 'TestRequestError',
      properties: {
        throw: true,
        message: 'bad',
      },
    },
    {
      ':return': {
        message: 'successful',
      },
    },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(false);
  expect(res.steps).toEqual([
    {
      stepId: 'test_error_1',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: false,
      response: null,
    },
  ]);
  expect(res.response).toEqual({ error: { message: 'bad' } });
});

test('deep nested return', async () => {
  const routine = [
    {
      ':if': true,
      ':then': [
        {
          id: 'test_request_first_if',
          type: 'TestRequest',
          properties: {
            response: 'first if',
          },
        },
        {
          ':if': true,
          ':then': [
            {
              id: 'test_request_second_if',
              type: 'TestRequest',
              properties: {
                response: 'second if',
              },
            },
            { ':return': { message: 'returned by first if' } },
          ],
        },
        { ':return': { message: 'returned by second if' } },
      ],
    },
    {
      id: 'test_request_end',
      type: 'TestRequest',
      properties: {
        response: 'end',
      },
    },
    { ':return': { message: 'made it to the end' } },
  ];
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_first_if',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'first if',
    },
    {
      stepId: 'test_request_first_if',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'second if',
    },
  ]);
  expect(res.response).toEqual({ message: 'returned by second if' });
});
