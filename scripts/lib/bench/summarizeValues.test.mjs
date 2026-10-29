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

import summarizeValues from './summarizeValues.mjs';

test('summarizeValues gives the median, min and max of an odd count', () => {
  assert.deepEqual(summarizeValues([3, 1, 2]), { median: 2, min: 1, max: 3 });
});

test('summarizeValues averages the middle two of an even count', () => {
  assert.deepEqual(summarizeValues([4, 1, 3, 2]), { median: 2.5, min: 1, max: 4 });
});

test('summarizeValues throws on no values', () => {
  assert.throws(() => summarizeValues([]), /at least one value/);
});
