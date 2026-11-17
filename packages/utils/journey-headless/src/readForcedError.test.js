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

import { expect, test } from 'vitest';

import readForcedError from './readForcedError.js';

const session = { forced: [{ rid: 'rid-1', message: 'Write failed on purpose' }] };

test('readForcedError reads the forced message of a thrown error by the request id it carries', () => {
  const body = {
    '~e': { name: 'ServiceError', message: 'An error occurred.', requestId: 'rid-1' },
  };
  expect(readForcedError({ body, session })).toEqual('Write failed on purpose');
});

test("readForcedError reads the forced message of a routine's error", () => {
  const body = {
    success: false,
    error: { '~e': { name: 'ServiceError', message: 'An error occurred.', requestId: 'rid-1' } },
  };
  expect(readForcedError({ body, session })).toEqual('Write failed on purpose');
});

test('readForcedError answers null for an error no fail gate forced, an answer with none, or no data session', () => {
  const other = { '~e': { name: 'Error', message: 'An error occurred.', requestId: 'rid-2' } };
  expect(readForcedError({ body: other, session })).toBeNull();
  expect(readForcedError({ body: { success: true, error: null }, session })).toBeNull();
  expect(readForcedError({ body: 'Unauthorized', session })).toBeNull();
  const forced = { '~e': { requestId: 'rid-1' } };
  expect(readForcedError({ body: forced, session: null })).toBeNull();
});
