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

import getFadeRanges from './getFadeRanges.js';

test('getFadeRanges fades the leading edge in and the trailing edge out over the fade width', () => {
  expect(getFadeRanges({ contentWidth: 1000, fadeWidth: 24, viewportWidth: 390 })).toEqual({
    start: { inputRange: [0, 24], outputRange: [0, 1] },
    end: { inputRange: [586, 610], outputRange: [1, 0] },
  });
});

test('getFadeRanges has no fades while the content fits, or before the strip is laid out', () => {
  expect(getFadeRanges({ contentWidth: 300, fadeWidth: 24, viewportWidth: 390 })).toBeNull();
  expect(getFadeRanges({ contentWidth: 390, fadeWidth: 24, viewportWidth: 390 })).toBeNull();
  expect(getFadeRanges({ contentWidth: 0, fadeWidth: 24, viewportWidth: 0 })).toBeNull();
});

test('getFadeRanges shortens the fades when the content scrolls less than a fade width', () => {
  expect(getFadeRanges({ contentWidth: 400, fadeWidth: 24, viewportWidth: 390 })).toEqual({
    start: { inputRange: [0, 10], outputRange: [0, 1] },
    end: { inputRange: [0, 10], outputRange: [1, 0] },
  });
});
