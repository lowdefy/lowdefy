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

function month(name, sessions) {
  return { month: name, days: 30, sessions, persons: sessions, orgs: 0, failures: 0 };
}

function result(name, months, mutation) {
  const after = { production: { sequence: 'v1-00000000', pageId: 'p', flow: [], months } };
  if (mutation) after.mutation = mutation;
  return { name, after };
}

test('formatZeroBacked lists journeys unbacked over the usage window with their mutation numbers', () => {
  expect(
    formatZeroBacked({
      results: [
        result('admin runs the year-end close', [month('2026-01', 40), month('2026-09', 0)], {
          killed: 4,
          total: 5,
          unique: 2,
        }),
        result('member saves a ticket', [month('2026-09', 12), month('2026-10', 3)]),
        result('owner restores a deleted framework', [month('2026-10', 0)]),
      ],
    })
  ).toEqual([
    'No production backing in 2026-08 to 2026-10 (nothing is removed):',
    '  admin runs the year-end close       0 sessions · 4/5 mutants · 2 only this journey kills',
    '  owner restores a deleted framework  0 sessions · no mutation report yet',
    'Three months cannot see yearly work. A journey that is the only one to kill a mutant is load-bearing whatever its traffic.',
  ]);
});

test('formatZeroBacked prints nothing when every journey is backed', () => {
  expect(formatZeroBacked({ results: [result('a', [month('2026-10', 1)])] })).toEqual([]);
});

test('formatZeroBacked skips journeys without monthly evidence', () => {
  expect(
    formatZeroBacked({
      results: [
        { name: 'legacy', after: { production: { sessions: 0, window: '2026-09-03/2026-10-02' } } },
        { name: 'none', after: {} },
      ],
    })
  ).toEqual([]);
});
