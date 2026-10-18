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

import getIllustrationBox from './getIllustrationBox.js';

test('getIllustrationBox fills a box of the viewBox aspect ratio', () => {
  expect(getIllustrationBox({ height: 170, viewBox: [0, 0, 115, 85], width: 230 })).toEqual({
    drawing: { height: 170, left: 0, top: 0, width: 230 },
    height: 170,
    scale: 2,
    width: 230,
  });
});

test('getIllustrationBox fits the drawing whole and centres it in a wider box', () => {
  expect(getIllustrationBox({ height: 50, viewBox: [0, 0, 10, 10], width: 100 })).toEqual({
    drawing: { height: 50, left: 25, top: 0, width: 50 },
    height: 50,
    scale: 5,
    width: 100,
  });
});

test('getIllustrationBox takes a missing side from the viewBox aspect ratio', () => {
  expect(getIllustrationBox({ viewBox: [0, 0, 40, 20], width: 80 })).toMatchObject({
    height: 40,
    scale: 2,
    width: 80,
  });
  expect(getIllustrationBox({ height: 10, viewBox: [0, 0, 40, 20] })).toMatchObject({
    height: 10,
    scale: 0.5,
    width: 20,
  });
});

test('getIllustrationBox draws the viewBox in points with no size set', () => {
  expect(getIllustrationBox({ viewBox: [5, 5, 40, 20] })).toMatchObject({
    height: 20,
    scale: 1,
    width: 40,
  });
});
