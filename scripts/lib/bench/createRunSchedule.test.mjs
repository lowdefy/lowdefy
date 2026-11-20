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

import assert from 'node:assert/strict';
import { test } from 'node:test';

import createRunSchedule from './createRunSchedule.mjs';

test('createRunSchedule warms each side up once, then alternates the sides', () => {
  const schedule = createRunSchedule({ runs: 2, sides: ['baseline', 'current'] });
  assert.deepEqual(schedule, [
    { side: 'baseline', run: 0, warmUp: true },
    { side: 'current', run: 0, warmUp: true },
    { side: 'baseline', run: 1, warmUp: false },
    { side: 'current', run: 1, warmUp: false },
    { side: 'baseline', run: 2, warmUp: false },
    { side: 'current', run: 2, warmUp: false },
  ]);
});
