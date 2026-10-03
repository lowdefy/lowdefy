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

import formatZeroBacked from './formatZeroBacked.js';

const window = { from: '2026-09-03', to: '2026-10-02' };

function result(name, sessions, mutation) {
  const after = { production: { sessions } };
  if (mutation) after.mutation = mutation;
  return { name, after };
}

test('formatZeroBacked lists unbacked journeys with their mutation numbers and removes nothing', () => {
  expect(
    formatZeroBacked({
      window,
      results: [
        result('admin runs the year-end close', 0, { killed: 4, total: 5, unique: 2 }),
        result('member saves a ticket', 12),
        result('owner restores a deleted framework', 0),
      ],
    })
  ).toEqual([
    'No production backing in 2026-09-03/2026-10-02 (nothing is removed):',
    '  admin runs the year-end close       0 sessions · 4/5 mutants · 2 only this journey kills',
    '  owner restores a deleted framework  0 sessions · no mutation report yet',
    'A 30-day window cannot see quarterly or yearly work. A journey that is the only one to kill a mutant is load-bearing whatever its traffic.',
  ]);
});

test('formatZeroBacked prints nothing when every journey is backed', () => {
  expect(formatZeroBacked({ window, results: [result('a', 1)] })).toEqual([]);
});
