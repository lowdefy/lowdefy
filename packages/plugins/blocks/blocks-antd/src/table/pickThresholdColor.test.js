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

import pickThresholdColor from './pickThresholdColor.js';

test('pickThresholdColor picks the colour of the band the value falls in', () => {
  const config = { thresholds: [50, 80], colors: ['red', 'orange', 'green'] };
  expect(pickThresholdColor({ value: 10, ...config })).toBe('red');
  expect(pickThresholdColor({ value: 50, ...config })).toBe('orange');
  expect(pickThresholdColor({ value: 80, ...config })).toBe('green');
  expect(pickThresholdColor({ value: 10, thresholds: [50, 80], colors: ['red'] })).toBe('red');
});

test('pickThresholdColor returns undefined without thresholds and colours', () => {
  expect(pickThresholdColor({ value: 1 })).toBeUndefined();
  expect(pickThresholdColor({ value: 1, thresholds: [1], colors: [] })).toBeUndefined();
});
