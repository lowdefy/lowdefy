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

import recordCallerStamp from './recordCallerStamp.js';
import { expect, test } from 'vitest';

const FULL_STAMP =
  '82e92667feb5824d; session=3a1d7b6848ba4816; roles=228d50a09b1b1e2b; memberships=476954726056d64d';

test('recordCallerStamp keeps the parsed stamp on lowdefy._internal', () => {
  const lowdefy = { _internal: {} };
  recordCallerStamp({ lowdefy, serverCaller: FULL_STAMP });
  expect(lowdefy._internal.callerStamp).toEqual({
    caller: '82e92667feb5824d',
    session: '3a1d7b6848ba4816',
    roles: '228d50a09b1b1e2b',
    memberships: '476954726056d64d',
  });
});

test('recordCallerStamp replaces the previous stamp', () => {
  const lowdefy = { _internal: {} };
  recordCallerStamp({ lowdefy, serverCaller: FULL_STAMP });
  recordCallerStamp({ lowdefy, serverCaller: '' });
  expect(lowdefy._internal.callerStamp).toEqual({
    caller: '',
    session: null,
    roles: null,
    memberships: null,
  });
});

test('recordCallerStamp leaves the last stamp in place when the response has no header', () => {
  const lowdefy = { _internal: {} };
  recordCallerStamp({ lowdefy, serverCaller: FULL_STAMP });
  const stamp = lowdefy._internal.callerStamp;
  recordCallerStamp({ lowdefy, serverCaller: null });
  expect(lowdefy._internal.callerStamp).toBe(stamp);
});

test('recordCallerStamp keeps a stamp that arrives before the page context exists', () => {
  const lowdefy = {};
  recordCallerStamp({ lowdefy, serverCaller: FULL_STAMP });
  expect(lowdefy._internal.callerStamp.caller).toBe('82e92667feb5824d');
});
