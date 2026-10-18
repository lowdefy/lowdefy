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

import getSwipeDirection from './getSwipeDirection.js';

test('getSwipeDirection takes a drag across more than 40pt as a swipe that way', () => {
  expect(getSwipeDirection({ dx: -41, dy: 0, vx: 0 })).toBe('left');
  expect(getSwipeDirection({ dx: 41, dy: 5, vx: 0 })).toBe('right');
});

test('getSwipeDirection takes no drag of 40pt or less without a flick', () => {
  expect(getSwipeDirection({ dx: -40, dy: 0, vx: 0 })).toBeNull();
  expect(getSwipeDirection({ dx: 30, dy: 0, vx: 0.2 })).toBeNull();
});

test('getSwipeDirection leaves a drag that is not more than twice as far across as down', () => {
  expect(getSwipeDirection({ dx: 80, dy: 40, vx: 0 })).toBeNull();
  expect(getSwipeDirection({ dx: -80, dy: -41, vx: -2 })).toBeNull();
  expect(getSwipeDirection({ dx: 80, dy: 39, vx: 0 })).toBe('right');
  // A vertical scroll.
  expect(getSwipeDirection({ dx: 4, dy: 120, vx: 0 })).toBeNull();
});

test('getSwipeDirection takes a fast flick past 10pt as a swipe', () => {
  expect(getSwipeDirection({ dx: -12, dy: 2, vx: -0.6 })).toBe('left');
  expect(getSwipeDirection({ dx: 12, dy: 2, vx: 0.6 })).toBe('right');
  // Too short, too slow, or flicked back the other way.
  expect(getSwipeDirection({ dx: 10, dy: 0, vx: 2 })).toBeNull();
  expect(getSwipeDirection({ dx: 12, dy: 0, vx: 0.5 })).toBeNull();
  expect(getSwipeDirection({ dx: 30, dy: 0, vx: -1 })).toBeNull();
});
