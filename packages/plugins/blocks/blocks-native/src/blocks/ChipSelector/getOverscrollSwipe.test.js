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

import getOverscrollSwipe from './getOverscrollSwipe.js';

// A strip 400pt wide holding 700pt of chips scrolls from 0 to 300.
const strip = { contentWidth: 700, viewportWidth: 400 };

test('getOverscrollSwipe passes a pull past the trailing end on as a swipe left', () => {
  expect(getOverscrollSwipe({ ...strip, offset: 321, velocity: 0 })).toBe('left');
  expect(getOverscrollSwipe({ ...strip, offset: 305, velocity: 0.8 })).toBe('left');
});

test('getOverscrollSwipe passes a pull past the leading end on as a swipe right', () => {
  expect(getOverscrollSwipe({ ...strip, offset: -21, velocity: 0 })).toBe('right');
  expect(getOverscrollSwipe({ ...strip, offset: -4, velocity: -0.8 })).toBe('right');
});

test('getOverscrollSwipe keeps a drag that scrolled the strip, or barely pulled it', () => {
  expect(getOverscrollSwipe({ ...strip, offset: 150, velocity: 2 })).toBeNull();
  expect(getOverscrollSwipe({ ...strip, offset: 300, velocity: 2 })).toBeNull();
  expect(getOverscrollSwipe({ ...strip, offset: 315, velocity: 0.2 })).toBeNull();
  // Flicked back toward the content.
  expect(getOverscrollSwipe({ ...strip, offset: 310, velocity: -1 })).toBeNull();
  expect(getOverscrollSwipe({ ...strip, offset: -10, velocity: 1 })).toBeNull();
});

test('getOverscrollSwipe reads a strip whose chips fit as scrolled to both ends', () => {
  const fits = { contentWidth: 300, viewportWidth: 400 };
  expect(getOverscrollSwipe({ ...fits, offset: 25, velocity: 0 })).toBe('left');
  expect(getOverscrollSwipe({ ...fits, offset: -25, velocity: 0 })).toBe('right');
});
