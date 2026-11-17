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

import readForcedFailure from './readForcedFailure.js';
import recordForcedFailure from './recordForcedFailure.js';

test('readForcedFailure answers the last forced failure recorded for the call, or null', () => {
  const session = { forced: [] };
  recordForcedFailure({ error: new Error('First'), rid: 'a', session });
  recordForcedFailure({ error: new Error('Other call'), rid: 'b', session });
  recordForcedFailure({ error: new Error('Second'), rid: 'a', session });
  expect(readForcedFailure({ rid: 'a', session })).toEqual('Second');
  expect(readForcedFailure({ rid: 'b', session })).toEqual('Other call');
  expect(readForcedFailure({ rid: 'c', session })).toBeNull();
});
