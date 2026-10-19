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

import newestMonth from './newestMonth.js';

function journey(months) {
  return { evidence: { production: { months: months.map((month) => ({ month })) } } };
}

test('newestMonth is the newest month any journey holds', () => {
  expect(
    newestMonth({ journeys: [journey(['2026-07', '2026-08']), journey(['2026-10']), journey([])] })
  ).toBe('2026-10');
});

test('newestMonth ignores journeys without monthly evidence', () => {
  expect(
    newestMonth({
      journeys: [
        {},
        { evidence: { production: { sessions: 3, window: '2026-09-03/2026-10-02' } } },
        journey(['2026-05']),
      ],
    })
  ).toBe('2026-05');
  expect(newestMonth({ journeys: [{}] })).toBeUndefined();
});
