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

import getScrollTarget from './getScrollTarget.js';

const strip = { contentWidth: 1000, margin: 24, viewportWidth: 390 };

test('getScrollTarget leaves a chip in view where it is', () => {
  expect(getScrollTarget({ ...strip, chip: { x: 16, width: 100 }, offset: 0 })).toBeNull();
  expect(getScrollTarget({ ...strip, chip: { x: 300, width: 60 }, offset: 0 })).toBeNull();
});

test('getScrollTarget scrolls a chip past the trailing edge just into view, clear of the fade', () => {
  expect(getScrollTarget({ ...strip, chip: { x: 500, width: 100 }, offset: 0 })).toBe(234);
});

test('getScrollTarget scrolls a chip past the leading edge back into view', () => {
  expect(getScrollTarget({ ...strip, chip: { x: 300, width: 100 }, offset: 400 })).toBe(276);
});

test('getScrollTarget clamps to the ends of the content', () => {
  expect(getScrollTarget({ ...strip, chip: { x: 16, width: 100 }, offset: 200 })).toBe(0);
  expect(getScrollTarget({ ...strip, chip: { x: 880, width: 104 }, offset: 0 })).toBe(610);
});

test('getScrollTarget shows the start of a chip wider than the view', () => {
  expect(getScrollTarget({ ...strip, chip: { x: 100, width: 500 }, offset: 0 })).toBe(76);
});
