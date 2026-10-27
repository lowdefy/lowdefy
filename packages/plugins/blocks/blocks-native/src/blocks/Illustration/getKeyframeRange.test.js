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

import getKeyframeRange from './getKeyframeRange.js';

test('getKeyframeRange draws a linear segment as its two ends', () => {
  expect(
    getKeyframeRange({
      easing: 'linear',
      keyframes: [
        { at: 0, value: 0 },
        { at: 1, value: 10 },
      ],
    })
  ).toEqual({ inputRange: [0, 1], outputRange: [0, 10] });
});

test('getKeyframeRange holds the first value from 0 and the last until 1, sorted by at', () => {
  expect(
    getKeyframeRange({
      easing: 'linear',
      keyframes: [
        { at: 0.75, value: 4 },
        { at: 0.25, value: 2 },
      ],
    })
  ).toEqual({ inputRange: [0, 0.25, 0.75, 1], outputRange: [2, 2, 4, 4] });
});

test('getKeyframeRange holds a step value until just before the next keyframe', () => {
  const range = getKeyframeRange({
    easing: 'step',
    keyframes: [
      { at: 0, value: 1 },
      { at: 0.5, value: 0 },
    ],
  });
  expect(range.inputRange).toEqual([0, 0.4999, 0.5, 0.9999, 1]);
  expect(range.outputRange).toEqual([1, 1, 0, 0, 0]);
});

test('getKeyframeRange samples an eased segment along its curve', () => {
  const { inputRange, outputRange } = getKeyframeRange({
    keyframes: [
      { at: 0, value: 0 },
      { at: 1, value: 100 },
    ],
  });
  expect(inputRange).toHaveLength(13);
  expect(inputRange[6]).toBeCloseTo(0.5);
  // easeInOut is half way at the middle, slow at the start and the end.
  expect(outputRange[6]).toBeCloseTo(50);
  expect(outputRange[1]).toBeLessThan(100 / 12);
  expect(outputRange[11]).toBeGreaterThan(100 - 100 / 12);
});

test('getKeyframeRange takes a keyframe easing over the animation easing', () => {
  const { inputRange, outputRange } = getKeyframeRange({
    easing: 'linear',
    keyframes: [
      { at: 0, value: 0, easing: 'step' },
      { at: 0.5, value: 4 },
      { at: 1, value: 0 },
    ],
  });
  expect(inputRange).toEqual([0, 0.4999, 0.5, 1]);
  expect(outputRange).toEqual([0, 0, 4, 0]);
});

test('getKeyframeRange keeps its input increasing for keyframes at the same place', () => {
  const { inputRange, outputRange } = getKeyframeRange({
    easing: 'linear',
    keyframes: [
      { at: 0, value: 0 },
      { at: 0.5, value: 0 },
      { at: 0.5, value: 3 },
      { at: 1, value: 3 },
    ],
  });
  inputRange.slice(1).forEach((at, index) => {
    expect(at).toBeGreaterThan(inputRange[index]);
  });
  expect(outputRange).toEqual([0, 0, 3, 3]);
});
