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

import createScanFilter from './createScanFilter.js';

test('a single-scan filter keeps only the first read', () => {
  const keep = createScanFilter({ continuous: false });
  expect(keep({ data: 'A' })).toBe(true);
  expect(keep({ data: 'B' })).toBe(false);
});

test('a continuous filter keeps a new code and the same code only after repeatAfter', () => {
  let time = 0;
  const keep = createScanFilter({ continuous: true, repeatAfter: 1000, now: () => time });
  expect(keep({ data: 'A' })).toBe(true);
  time = 500;
  expect(keep({ data: 'A' })).toBe(false);
  expect(keep({ data: 'B' })).toBe(true);
  time = 1600;
  expect(keep({ data: 'A' })).toBe(true);
});
