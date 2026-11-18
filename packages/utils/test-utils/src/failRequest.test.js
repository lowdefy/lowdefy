/*
  Copyright 2020-2026 Lowdefy, Inc

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

import { beforeEach, expect, test } from 'vitest';

import failRequest from './failRequest.js';

let testSession;
let session;
beforeEach(() => {
  session = { failGates: [] };
  testSession = { closed: false, dataSession: { session } };
});

test('failRequest sets a fail gate on the data session, once by default', () => {
  failRequest({ gate: { requestId: 'insert_run', message: 'Down' }, testSession });
  failRequest({
    gate: {
      requestId: 'insert_run',
      endpoint: 'approve',
      pageId: 'runs',
      message: 'Still down',
      times: 'all',
    },
    testSession,
  });
  expect(session.failGates).toEqual([
    { requestId: 'insert_run', message: 'Down', times: 1, fired: 0 },
    {
      requestId: 'insert_run',
      endpoint: 'approve',
      pageId: 'runs',
      message: 'Still down',
      times: 'all',
      fired: 0,
    },
  ]);
});

test('failRequest refuses a gate it cannot set, naming what is wrong', () => {
  const cases = [
    [
      undefined,
      'fail takes { requestId, endpoint?, pageId?, message, times? }. Received undefined.',
    ],
    [{ requestId: 'a', message: 'Down', stepId: 'a' }, 'fail does not take "stepId".'],
    [{ message: 'Down' }, 'fail takes a requestId. Received undefined.'],
    [{ requestId: 'a' }, 'fail takes the message the request fails with. Received undefined.'],
    [
      { requestId: 'a', message: 'Down', endpoint: '' },
      'fail "endpoint" should be an endpoint id. Received "".',
    ],
    [
      { requestId: 'a', message: 'Down', pageId: 3 },
      'fail "pageId" should be a page id. Received 3.',
    ],
    [
      { requestId: 'a', message: 'Down', times: 0 },
      'fail "times" should be a whole number above 0 or "all". Received 0.',
    ],
  ];
  cases.forEach(([gate, message]) => {
    expect(() => failRequest({ gate, testSession })).toThrow(message);
  });
  expect(session.failGates).toEqual([]);
});

test('failRequest refuses a closed session', () => {
  testSession.closed = true;
  expect(() => failRequest({ gate: { requestId: 'a', message: 'Down' }, testSession })).toThrow(
    'The session is closed'
  );
});
