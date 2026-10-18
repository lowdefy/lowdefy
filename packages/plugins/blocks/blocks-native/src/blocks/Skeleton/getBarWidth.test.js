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

import getBarWidth from './getBarWidth.js';

test('getBarWidth gives a width between min and max', () => {
  for (let index = 0; index < 30; index += 1) {
    const width = parseInt(getBarWidth({ index, max: 80, min: 60 }), 10);
    expect(width).toBeGreaterThanOrEqual(60);
    expect(width).toBeLessThanOrEqual(80);
  }
});

test('getBarWidth gives the same width for the same row, and varies from row to row', () => {
  expect(getBarWidth({ index: 3, max: 80, min: 60 })).toEqual(
    getBarWidth({ index: 3, max: 80, min: 60 })
  );
  const widths = new Set([0, 1, 2, 3, 4].map((index) => getBarWidth({ index, max: 80, min: 60 })));
  expect(widths.size).toBe(5);
});

test('getBarWidth varies the bars of one row with the salt', () => {
  expect(getBarWidth({ index: 0, max: 80, min: 60 })).toEqual('74%');
  expect(getBarWidth({ index: 0, max: 80, min: 60, salt: 1 })).toEqual('62%');
});
