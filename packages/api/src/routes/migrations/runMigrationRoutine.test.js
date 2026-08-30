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

import { countDocuments } from './runMigrationRoutine.js';

test('countDocuments sums MongoDB write counts across step results', () => {
  const steps = {
    s1: { modifiedCount: 10, matchedCount: 10 },
    s2: { insertedCount: 3 },
    s3: { deletedCount: 2 },
    s4: { upsertedCount: 1 },
  };
  expect(countDocuments(steps)).toBe(10 + 10 + 3 + 2 + 1);
});

test('countDocuments ignores non-count step results', () => {
  const steps = {
    s1: [{ _id: 'a' }, { _id: 'b' }],
    s2: { modifiedCount: 4 },
    s3: 'a string',
    s4: null,
  };
  expect(countDocuments(steps)).toBe(4);
});

test('countDocuments returns 0 for empty or undefined steps', () => {
  expect(countDocuments({})).toBe(0);
  expect(countDocuments(undefined)).toBe(0);
});
