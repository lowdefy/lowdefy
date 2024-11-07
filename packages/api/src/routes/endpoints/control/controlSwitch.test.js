import { jest } from '@jest/globals';

import runTest from '../test/runTest.js';

test('single switch case', async () => {
  const routine = {
    ':switch': [
      {
        ':case': true,
        ':then': [
          {
            id: 'request:test_endpoint:test_request_true',
            type: 'TestRequest',
            connectionId: 'test',
            properties: {
              response: 'Was true',
            },
          },
          { ':return': { message: 'Case passed' } },
        ],
      },
    ],
    ':default': [{ ':return': { message: 'default case' } }],
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ message: 'Case passed' });
});

test('switch with passing case in the middle', async () => {
  const routine = {
    ':switch': [
      {
        ':case': false,
        ':then': [{ ':return': { message: 'Case 1 passed' } }],
      },
      {
        ':case': true,
        ':then': [{ ':return': { message: 'Case 2 passed' } }],
      },
      {
        ':case': true,
        ':then': [{ ':return': { message: 'Case 3 passed' } }],
      },
    ],
    ':default': [{ ':return': { message: 'default case' } }],
  };
  const { res, context } = await runTest({ routine });
  const expectedRes = { message: 'Case 2 passed' };
  expect(res.status).toEqual('return');
  expect(res.response).toEqual(expectedRes);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_switch' }],
    [{ event: 'debug_control_switch_case', case: { input: false, evaluated: false } }],
    [{ event: 'debug_control_switch_case', case: { input: true, evaluated: true } }],
    [{ event: 'debug_control_switch_run_then' }],
    [{ event: 'debug_control_return', response: expectedRes }],
  ]);
});

test('switch with passing case at the end', async () => {
  const routine = {
    ':switch': [
      {
        ':case': false,
        ':then': [{ ':return': { message: 'Case 1 passed' } }],
      },
      {
        ':case': false,
        ':then': [{ ':return': { message: 'Case 2 passed' } }],
      },
      {
        ':case': true,
        ':then': [{ ':return': { message: 'Case 3 passed' } }],
      },
    ],
    ':default': [{ ':return': { message: 'default case' } }],
  };
  const { res, context } = await runTest({ routine });
  const expectedRes = { message: 'Case 3 passed' };
  expect(res.status).toEqual('return');
  expect(res.response).toEqual(expectedRes);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_switch' }],
    [{ event: 'debug_control_switch_case', case: { input: false, evaluated: false } }],
    [{ event: 'debug_control_switch_case', case: { input: false, evaluated: false } }],
    [{ event: 'debug_control_switch_case', case: { input: true, evaluated: true } }],
    [{ event: 'debug_control_switch_run_then' }],
    [{ event: 'debug_control_return', response: expectedRes }],
  ]);
});

test('switch with passing default case', async () => {
  const routine = {
    ':switch': [
      {
        ':case': false,
        ':then': [{ ':return': { message: 'Case 1 passed' } }],
      },
      {
        ':case': false,
        ':then': [{ ':return': { message: 'Case 2 passed' } }],
      },
      {
        ':case': false,
        ':then': [{ ':return': { message: 'Case 3 passed' } }],
      },
    ],
    ':default': [{ ':return': { message: 'default case' } }],
  };
  const { res, context } = await runTest({ routine });
  const expectedRes = { message: 'default case' };
  expect(res.status).toEqual('return');
  expect(res.response).toEqual(expectedRes);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_switch' }],
    [{ event: 'debug_control_switch_case', case: { input: false, evaluated: false } }],
    [{ event: 'debug_control_switch_case', case: { input: false, evaluated: false } }],
    [{ event: 'debug_control_switch_case', case: { input: false, evaluated: false } }],
    [{ event: 'debug_control_switch_run_default' }],
    [{ event: 'debug_control_return', response: expectedRes }],
  ]);
});

test('switch with all cases false and no default', async () => {
  const routine = {
    ':switch': [
      {
        ':case': false,
        ':then': [{ ':return': { message: 'Case 1 passed' } }],
      },
      {
        ':case': false,
        ':then': [{ ':return': { message: 'Case 2 passed' } }],
      },
      {
        ':case': false,
        ':then': [{ ':return': { message: 'Case 3 passed' } }],
      },
    ],
  };
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_switch' }],
    [{ event: 'debug_control_switch_case', case: { input: false, evaluated: false } }],
    [{ event: 'debug_control_switch_case', case: { input: false, evaluated: false } }],
    [{ event: 'debug_control_switch_case', case: { input: false, evaluated: false } }],
  ]);
});

test('switch case with missing :then', async () => {
  const routine = {
    ':switch': [
      {
        ':case': false,
        ':then': [{ ':return': { message: 'Case 1 passed' } }],
      },
      {
        ':case': false,
        ':then': [{ ':return': { message: 'Case 2 passed' } }],
      },
      {
        ':case': true,
      },
    ],
  };
  const { res, context } = await runTest({ routine });
  const error = new Error('Invalid switch :case - missing :then');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([
    [{ event: 'debug_control_switch' }],
    [{ event: 'debug_control_switch_case', case: { input: false, evaluated: false } }],
    [{ event: 'debug_control_switch_case', case: { input: false, evaluated: false } }],
    [{ event: 'debug_control_switch_case', case: { input: true, evaluated: true } }],
    [{ event: 'debug_control_switch_run_then' }],
  ]);
  expect(context.logger.error.mock.calls).toEqual([[error]]);
});
