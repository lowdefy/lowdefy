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

test('compareProcessStartTimes tells the same process from another by boot id and ticks on Linux', () => {
  const recorded = 'linux:3f2b8c1e-5d4a-4f6b-9c7d-0e1f2a3b4c5d:987654';
  expect(compareProcessStartTimes({ recorded, current: recorded })).toEqual('same');
  expect(
    compareProcessStartTimes({
      recorded,
      current: 'linux:3f2b8c1e-5d4a-4f6b-9c7d-0e1f2a3b4c5d:987655',
    })
  ).toEqual('different');
  expect(
    compareProcessStartTimes({
      recorded,
      current: 'linux:8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d:987654',
    })
  ).toEqual('different');
});

test('compareProcessStartTimes returns unknown when either start time is missing or in an older format', () => {
  [
    { recorded: null, current: 1790000000000 },
    { recorded: undefined, current: 1790000000000 },
    { recorded: 1790000000000, current: null },
    { recorded: 'Fri Oct  2 20:55:31 2026', current: 1790000000000 },
    { recorded: '2026-10-02T20:55:31.0000000Z', current: 1790000000000 },
    // Epoch milliseconds an older Lowdefy read from the Linux wall clock.
    { recorded: 1790000000000, current: 'linux:3f2b8c1e-5d4a-4f6b-9c7d-0e1f2a3b4c5d:987654' },
  ].forEach((times) => {
    expect(compareProcessStartTimes(times)).toEqual('unknown');
  });
});
