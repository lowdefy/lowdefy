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

import isSwipeGesture from './isSwipeGesture.js';

const both = ['left', 'right'];

test('isSwipeGesture takes a clear horizontal swipe in a direction the Box has an event for', () => {
  expect(isSwipeGesture({ directions: both, dx: -50, dy: 4, moveX: 150, vx: 0 })).toBe(true);
  expect(isSwipeGesture({ directions: ['left'], dx: -50, dy: 4, moveX: 150, vx: 0 })).toBe(true);
  expect(isSwipeGesture({ directions: ['left'], dx: 50, dy: 4, moveX: 250, vx: 0 })).toBe(false);
  expect(isSwipeGesture({ directions: [], dx: 50, dy: 4, moveX: 250, vx: 0 })).toBe(false);
});

test('isSwipeGesture leaves vertical scrolls and short drags to the page', () => {
  expect(isSwipeGesture({ directions: both, dx: 30, dy: 60, moveX: 130, vx: 0 })).toBe(false);
  expect(isSwipeGesture({ directions: both, dx: 20, dy: 0, moveX: 120, vx: 0 })).toBe(false);
});

test('isSwipeGesture leaves a drag that starts within 20pt of the left edge, the back gesture', () => {
  // Started at 15pt and 19pt.
  expect(isSwipeGesture({ directions: both, dx: 60, dy: 0, moveX: 75, vx: 0 })).toBe(false);
  expect(isSwipeGesture({ directions: both, dx: 60, dy: 0, moveX: 79, vx: 0 })).toBe(false);
  // Started at 20pt.
  expect(isSwipeGesture({ directions: both, dx: 60, dy: 0, moveX: 80, vx: 0 })).toBe(true);
});
