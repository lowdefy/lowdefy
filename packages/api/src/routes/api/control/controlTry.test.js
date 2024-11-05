import { jest } from '@jest/globals';

import runTest from '../test/runTest.js';

/*
try catch with successful try √
try catch with unsuccessful try √
try only, successful √
try only, fail √
try with finally, without catch, successful try √
try with finally, without catch, unsuccessful try √
try catch finally, try pass √
try catch finally, try fail √
catch without try √
finally without try √
*/

test('try catch with successful try', async () => {
  const routine = {
    ':try': {
      id: 'try_pass',
      type: 'TestRequest',
      properties: {
        response: 'Success',
      },
    },
    ':catch': {
      id: 'test_request_error',
      type: 'TestRequest',
      properties: {
        response: 'Do this if fail',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'try_pass',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Success',
    },
  ]);
  expect(res.response).toEqual('Success');
});

test('try catch with unsuccessful try', async () => {
  const routine = {
    ':try': {
      id: 'try_fail',
      type: 'TestRequest',
      properties: {
        response: 'Try and fail',
      },
    },
    ':catch': {
      id: 'test_request_error',
      type: 'TestRequest',
      properties: {
        response: 'Fallback thing',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      id: 'test_request_error',
      type: 'TestRequest',
      properties: {
        response: 'Fallback thing',
      },
    },
  ]);
  expect(res.response).toEqual('Fallback thing');
});

test('try only, success', async () => {
  const routine = {
    ':try': {
      id: 'try_pass',
      type: 'TestRequest',
      properties: {
        response: 'Success',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_happy_path',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Success',
    },
  ]);
  expect(res.response).toEqual('Success');
});

test('try only, fail', async () => {
  const routine = {
    ':try': {
      id: 'try_fail',
      type: 'TestRequest',
      properties: {
        response: 'Success',
      },
    },
  };
  expect(async () => await runTest({ routine })).rejects.toThrow('TODO: uncaught error'); // ??
});

test('try with finally, try pass', async () => {
  const routine = {
    ':try': {
      id: 'try_pass',
      type: 'TestRequest',
      properties: {
        response: 'Success',
      },
    },
    ':finally': {
      id: 'test_request_finally',
      type: 'TestRequest',
      properties: {
        response: 'Always do this',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'try_pass',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Success',
    },
    {
      stepId: 'test_request_finally',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Always do this',
    },
  ]);
  expect(res.response).toEqual(null); //??
});
test('try with finally, try fail', async () => {
  const routine = {
    ':try': {
      id: 'try_fail',
      type: 'TestRequest',
      properties: {
        response: 'Try and fail',
      },
    },
    ':finally': {
      id: 'test_request_finally',
      type: 'TestRequest',
      properties: {
        response: 'Always do this',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'test_request_finally',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Always do this',
    },
  ]);
  expect(res.response).toEqual(null); //??
});

test('try catch finally, try pass', async () => {
  const routine = {
    ':try': {
      id: 'try_pass',
      type: 'TestRequest',
      properties: {
        response: 'Success',
      },
    },
    ':catch': {
      id: 'catch_backup',
      type: 'TestRequest',
      properties: {
        response: 'Do this if fail',
      },
    },
    ':finally': {
      id: 'test_request_finally',
      type: 'TestRequest',
      properties: {
        response: 'Always do this',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'try_pass',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Success',
    },
    {
      stepId: 'test_request_finally',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Always do this',
    },
  ]);
  expect(res.response).toEqual(null); //??
});

test('try catch finally, try fail', async () => {
  const routine = {
    ':try': {
      id: 'try_fail',
      type: 'TestRequest',
      properties: {
        response: 'Try and fail',
      },
    },
    ':catch': {
      id: 'catch_backup',
      type: 'TestRequest',
      properties: {
        response: 'Do this if fail',
      },
    },
    ':finally': {
      id: 'test_request_finally',
      type: 'TestRequest',
      properties: {
        response: 'Always do this',
      },
    },
  };
  const res = await runTest({ routine });
  expect(res.success).toBe(true);
  expect(res.steps).toEqual([
    {
      stepId: 'catch_backup',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Do this if fail',
    },
    {
      stepId: 'test_request_finally',
      startTimestamp: 'fake_time',
      endTimestamp: 'fake_time',
      success: true,
      response: 'Always do this',
    },
  ]);
  expect(res.response).toEqual(null); //??
});

test('catch without try', async () => {
  const routine = {
    ':catch': {
      id: 'catch_no_try',
      type: 'TestRequest',
      properties: {
        response: 'INVALID',
      },
    },
  };
  expect(async () => await runTest({ routine })).rejects.toThrow('TODO: No :try specified'); // ??
});

test('finally without try', async () => {
  const routine = {
    ':finally': {
      id: 'finally_no_try',
      type: 'TestRequest',
      properties: {
        response: 'INVALID',
      },
    },
  };
  expect(async () => await runTest({ routine })).rejects.toThrow('TODO: No :try specified'); // ??
});
