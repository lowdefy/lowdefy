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

import compareProcessStartTimes from './compareProcessStartTimes.js';

test('compareProcessStartTimes tells the same process from another by epoch milliseconds', () => {
  expect(compareProcessStartTimes({ recorded: 1790000000000, current: 1790000000000 })).toEqual(
    'same'
  );
  expect(compareProcessStartTimes({ recorded: 1790000000000, current: 1790000001000 })).toEqual(
    'different'
  );
});

test('compareProcessStartTimes returns unknown when either start time is missing or in an older format', () => {
  [
    { recorded: null, current: 1790000000000 },
    { recorded: undefined, current: 1790000000000 },
    { recorded: 1790000000000, current: null },
    { recorded: 'Fri Oct  2 20:55:31 2026', current: 1790000000000 },
    { recorded: '2026-10-02T20:55:31.0000000Z', current: 1790000000000 },
  ].forEach((times) => {
    expect(compareProcessStartTimes(times)).toEqual('unknown');
  });
});
