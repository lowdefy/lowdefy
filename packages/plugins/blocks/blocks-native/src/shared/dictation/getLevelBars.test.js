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

import getLevelBars from './getLevelBars.js';

test('getLevelBars draws eight low bars in silence', () => {
  expect(getLevelBars({ level: 0 })).toEqual([4, 4, 4, 4, 4, 4, 4, 4]);
});

test('getLevelBars draws the tallest bar at 22 points at full level', () => {
  const bars = getLevelBars({ level: 1 });
  expect(bars).toHaveLength(8);
  expect(Math.max(...bars)).toBe(22);
  expect(bars).toEqual([9, 15, 22, 14, 18, 11, 17, 9]);
});

test('getLevelBars grows every bar with the level', () => {
  const quiet = getLevelBars({ level: 0.25 });
  const loud = getLevelBars({ level: 0.75 });
  quiet.forEach((height, index) => {
    expect(loud[index]).toBeGreaterThan(height);
  });
});
