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

import toSignatureValue, { toPath } from './toSignatureValue.js';

test('toSignatureValue returns null for a pad with no strokes', () => {
  expect(
    toSignatureValue({ color: '#000', height: 100, strokes: [], strokeWidth: 2, width: 300 })
  ).toBe(null);
});

test('toSignatureValue gives the strokes, size and an SVG of them, rounded to a tenth', () => {
  const value = toSignatureValue({
    color: '#111111',
    height: 120,
    strokes: [
      [
        [1.234, 2],
        [10, 20.06],
      ],
    ],
    strokeWidth: 2.5,
    width: 320,
  });
  expect(value.strokes).toEqual([
    [
      [1.2, 2],
      [10, 20.1],
    ],
  ]);
  expect(value.width).toBe(320);
  expect(value.height).toBe(120);
  expect(value.svg).toBe(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120"><path d="M1.2 2L10 20.1" fill="none" stroke="#111111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  );
});

test('toPath draws a dot for a stroke of one point', () => {
  expect(toPath([[5, 6]])).toBe('M5 6l0.1 0');
});
