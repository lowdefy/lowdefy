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

import parseUsageWindow from './parseUsageWindow.js';

test('parseUsageWindow defaults to 3 months', () => {
  expect(parseUsageWindow()).toBe(3);
  expect(parseUsageWindow(null)).toBe(3);
});

test('parseUsageWindow reads a number of months', () => {
  expect(parseUsageWindow('1m')).toBe(1);
  expect(parseUsageWindow('12m')).toBe(12);
});

test.each(['0m', '3', '3d', '-1m', '1.5m', 3])(
  'parseUsageWindow refuses %j with the received value',
  (value) => {
    expect(() => parseUsageWindow(value)).toThrow(
      `--usage-window takes a number of calendar months such as 3m. Received ${JSON.stringify(
        value
      )}.`
    );
  }
);
