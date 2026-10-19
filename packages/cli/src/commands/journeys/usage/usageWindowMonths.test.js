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

import usageWindowMonths from './usageWindowMonths.js';

test('usageWindowMonths lists the months ending at the anchor, oldest first', () => {
  expect(usageWindowMonths({ anchor: '2026-10', months: 3 })).toEqual([
    '2026-08',
    '2026-09',
    '2026-10',
  ]);
});

test('usageWindowMonths crosses a year boundary', () => {
  expect(usageWindowMonths({ anchor: '2027-02', months: 4 })).toEqual([
    '2026-11',
    '2026-12',
    '2027-01',
    '2027-02',
  ]);
});

test('usageWindowMonths is empty without an anchor', () => {
  expect(usageWindowMonths({ anchor: undefined, months: 3 })).toEqual([]);
});
