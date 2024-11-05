import { jest } from '@jest/globals';

import runTest from '../test/runTest.js';

test('single return', async () => {
  const routine = {
    ':return': true,
  };
  const { res } = await runTest({ routine });
  expect(res.status).toBe('return');
  expect(res.response).toEqual(true);
});

test('return null', async () => {
  const routine = {
    ':return': null,
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('return');
  expect(res.response).toEqual(null);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_return', response: null }],
  ]);
});

test('return at end of routine', async () => {
  const routine = [
    {
      id: 'request:test_request_1',
      type: 'TestRequestWait',
      properties: {
        ms: 10,
      },
    },
    {
      id: 'request:test_request_2',
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
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('return');
  expect(res.response).toEqual({ message: 'Successful' });
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_step',
        step: {
          id: 'request:test_request_1',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [
      {
        event: 'debug_start_step',
        step: {
          id: 'request:test_request_2',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [{ event: 'debug_control_return', response: { message: 'Successful' } }],
  ]);
});

test('return in the middle of routine', async () => {
  const routine = [
    {
      id: 'request:test_request_1',
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
      id: 'request:test_request_2',
      type: 'TestRequestWait',
      properties: {
        ms: 10,
      },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('return');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_step',
        step: {
          id: 'request:test_request_1',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [{ event: 'debug_control_return', response: { message: 'Successful' } }],
  ]);
  expect(res.response).toEqual({ message: 'Successful' });
});

test('multiple returns in routine', async () => {
  const routine = [
    {
      id: 'request:test_request_1',
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
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('return');
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'debug_start_step',
        step: {
          id: 'request:test_request_1',
          type: 'TestRequestWait',
          properties: {
            ms: 10,
          },
        },
      },
    ],
    [{ event: 'debug_control_return', response: { message: 'First' } }],
  ]);
  expect(res.response).toEqual({ message: 'First' });
});

test('truthy guard statement return', async () => {
  const routine = [
    {
      ':if': true,
      ':then': [
        {
          id: 'request:test_request_guard_statement',
          type: 'TestRequest',
          properties: {
            response: 'guard statement',
          },
        },
        { ':return': { message: 'returned by guard statement' } },
      ],
    },
    {
      id: 'request:test_request_end',
      type: 'TestRequest',
      properties: {
        response: 'end',
      },
    },
    { ':return': { message: 'made it to the end' } },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('return');
  expect(res.response).toEqual({ message: 'returned by guard statement' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_if', condition: { input: true, evaluated: true } }],
    [{ event: 'debug_control_if_run_then' }],
    [
      {
        event: 'debug_start_step',
        step: {
          id: 'request:test_request_guard_statement',
          type: 'TestRequest',
          properties: {
            response: 'guard statement',
          },
        },
      },
    ],
    [{ event: 'debug_control_return', response: { message: 'returned by guard statement' } }],
  ]);
});

test('falsy guard statement return', async () => {
  const routine = [
    {
      ':if': false,
      ':then': [
        {
          id: 'request:test_request_guard_statement',
          type: 'TestRequest',
          properties: {
            response: 'guard statement',
          },
        },
        { ':return': { message: 'returned by guard statement' } },
      ],
    },
    {
      id: 'request:test_request_end',
      type: 'TestRequest',
      properties: {
        response: 'end',
      },
    },
    { ':return': { message: 'made it to the end' } },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('return');
  expect(res.response).toEqual({ message: 'made it to the end' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_if', condition: { input: false, evaluated: false } }],
    [
      {
        event: 'debug_start_step',
        step: {
          id: 'request:test_request_end',
          type: 'TestRequest',
          properties: {
            response: 'end',
          },
        },
      },
    ],
    [{ event: 'debug_control_return', response: { message: 'made it to the end' } }],
  ]);
});

test('deep nested return', async () => {
  const routine = [
    {
      ':if': true,
      ':then': [
        {
          id: 'request:test_request_first_if',
          type: 'TestRequest',
          properties: {
            response: 'first if',
          },
        },
        {
          ':if': true,
          ':then': [
            {
              id: 'request:test_request_second_if',
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
  const { res, context } = await runTest({ routine });
  expect(res.status).toBe('return');
  expect(res.response).toEqual({ message: 'returned by first if' });
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_if', condition: { input: true, evaluated: true } }],
    [{ event: 'debug_control_if_run_then' }],
    [
      {
        event: 'debug_start_step',
        step: {
          id: 'request:test_request_first_if',
          type: 'TestRequest',
          properties: {
            response: 'first if',
          },
        },
      },
    ],
    [{ event: 'debug_control_if', condition: { input: true, evaluated: true } }],
    [{ event: 'debug_control_if_run_then' }],
    [
      {
        event: 'debug_start_step',
        step: {
          id: 'request:test_request_second_if',
          type: 'TestRequest',
          properties: {
            response: 'second if',
          },
        },
      },
    ],
    [{ event: 'debug_control_return', response: { message: 'returned by first if' } }],
  ]);
});
