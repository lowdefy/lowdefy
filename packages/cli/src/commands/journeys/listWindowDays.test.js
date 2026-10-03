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

import listWindowDays from './listWindowDays.js';

test('listWindowDays lists every UTC day of a window, both ends included', () => {
  expect(listWindowDays({ from: '2026-09-29', to: '2026-10-02' })).toEqual([
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
  ]);
});

test('listWindowDays gives one day for a window that starts and ends on it', () => {
  expect(listWindowDays({ from: '2026-10-03', to: '2026-10-03' })).toEqual(['2026-10-03']);
});
