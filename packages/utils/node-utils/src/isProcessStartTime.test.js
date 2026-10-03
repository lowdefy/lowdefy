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

import isProcessStartTime from './isProcessStartTime.js';

test('isProcessStartTime accepts epoch milliseconds and the Linux boot id with ticks', () => {
  expect(isProcessStartTime(1790000000000)).toBe(true);
  expect(isProcessStartTime('linux:3f2b8c1e-5d4a-4f6b-9c7d-0e1f2a3b4c5d:987654')).toBe(true);
});

test('isProcessStartTime rejects a failed read and the formats older versions wrote', () => {
  [
    null,
    undefined,
    1790000000000.5,
    'Fri Oct  2 20:55:31 2026',
    '2026-10-02T20:55:31.0000000Z',
    'linux:3f2b8c1e-5d4a-4f6b-9c7d-0e1f2a3b4c5d:',
    { bootId: 'x', ticks: 1 },
  ].forEach((value) => {
    expect(isProcessStartTime(value)).toBe(false);
  });
});
