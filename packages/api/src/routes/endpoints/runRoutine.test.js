/*
  Copyright 2020-2024 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

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

test.todo('_payload operator');
test.todo('_state operator');
test.todo('_secrets operator');
test.todo('_user operator');
test.todo('_js operator');
