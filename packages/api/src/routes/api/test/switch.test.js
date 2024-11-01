import { jest } from '@jest/globals';

import runTest from './runTest.js';

test('first case holds', async () => {
  const routine = {
    ':switch': [
      {
        ':case': true,
        ':then': {
          id: 'test_request_case_1',
          type: 'TestRequest',
          properties: {
            response: 'case 1',
          },
        },
      },
      {
        ':case': false,
        ':then': {
          id: 'test_request_case_2',
          type: 'TestRequest',
          properties: {
            response: 'case 2',
          },
        },
      },
    ],
    ':default': {
      id: 'test_request_default',
      type: 'TestRequest',
      properties: {
        response: 'default case',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_case_1',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'case 1',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('second case holds', async () => {
  const routine = {
    ':switch': [
      {
        ':case': false,
        ':then': {
          id: 'test_request_case_1',
          type: 'TestRequest',
          properties: {
            response: 'case 1',
          },
        },
      },
      {
        ':case': true,
        ':then': {
          id: 'test_request_case_2',
          type: 'TestRequest',
          properties: {
            response: 'case 2',
          },
        },
      },
    ],
    ':default': {
      id: 'test_request_default',
      type: 'TestRequest',
      properties: {
        response: 'default case',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_case_2',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'case 2',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('no cases truthy', async () => {
  const routine = {
    ':switch': [
      {
        ':case': false,
        ':then': {
          id: 'test_request_case_1',
          type: 'TestRequest',
          properties: {
            response: 'case 1',
          },
        },
      },
      {
        ':case': false,
        ':then': {
          id: 'test_request_case_2',
          type: 'TestRequest',
          properties: {
            response: 'case 2',
          },
        },
      },
    ],
    ':default': {
      id: 'test_request_default',
      type: 'TestRequest',
      properties: {
        response: 'default case',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_default',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'default case',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('no cases truthy, no default defined', async () => {
  const routine = {
    ':switch': [
      {
        ':case': false,
        ':then': {
          id: 'test_request_case_1',
          type: 'TestRequest',
          properties: {
            response: 'case 1',
          },
        },
      },
      {
        ':case': false,
        ':then': {
          id: 'test_request_case_2',
          type: 'TestRequest',
          properties: {
            response: 'case 2',
          },
        },
      },
    ],
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([]);
  expect(res.response).toEqual(null);
});

test('all cases truthy', async () => {
  const routine = {
    ':switch': [
      {
        ':case': true,
        ':then': {
          id: 'test_request_case_1',
          type: 'TestRequest',
          properties: {
            response: 'case 1',
          },
        },
      },
      {
        ':case': true,
        ':then': {
          id: 'test_request_case_2',
          type: 'TestRequest',
          properties: {
            response: 'case 2',
          },
        },
      },
      {
        ':case': true,
        ':then': {
          id: 'test_request_case_3',
          type: 'TestRequest',
          properties: {
            response: 'case 3',
          },
        },
      },
    ],
    ':default': {
      id: 'test_request_default',
      type: 'TestRequest',
      properties: {
        response: 'default case',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_case_1',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'case 1',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('case missing then', async () => {
  const routine = {
    ':switch': [
      {
        ':case': true,
      },
    ],
    ':default': {
      id: 'test_request_default',
      type: 'TestRequest',
      properties: {
        response: 'default case',
      },
    },
  };
  expect(async () => await runTest({ routine })).rejects.toThrow('TODO: Missing :then'); // unsure
});

test('return in switch', async () => {
  const routine = {
    ':switch': [
      {
        ':case': true,
        ':then': [
          {
            id: 'test_request_before_return',
            type: 'TestRequest',
            properties: {
              response: 'before return',
            },
          },
          {
            ':return': {
              message: 'returned in switch',
            },
          },
          {
            id: 'test_request_after_return',
            type: 'TestRequest',
            properties: {
              response: 'after return',
            },
          },
        ],
      },
    ],
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_before_return',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'before return',
    },
  ]);
  expect(res.response).toEqual({
    message: 'returned in switch',
  });
});

test('operators are evaluated', async () => {
  const routine = {
    ':switch': [
      {
        ':case': { _eq: [1, 2] },
        ':then': {
          id: 'test_request_case_1',
          type: 'TestRequest',
          properties: {
            response: 'case 1',
          },
        },
      },
      {
        ':case': { _eq: [1, 1] },
        ':then': {
          id: 'test_request_case_2',
          type: 'TestRequest',
          properties: {
            response: 'case 2',
          },
        },
      },
    ],
    ':default': {
      id: 'test_request_default',
      type: 'TestRequest',
      properties: {
        response: 'default case',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_case_2',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'case 2',
    },
  ]);
  expect(res.response).toEqual(null);
});

test('throw error inside of switch', async () => {
  const routine = [
    {
      ':switch': [
        {
          ':case': true,
          ':then': {
            id: 'test_error_1',
            type: 'TestRequestError',
            properties: {
              throw: true,
              message: 'bad',
            },
          },
        },
      ],
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
