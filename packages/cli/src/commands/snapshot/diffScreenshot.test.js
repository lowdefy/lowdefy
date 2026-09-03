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

import { PNG } from 'pngjs';

import diffScreenshot from './diffScreenshot.js';

function makePng({ width = 100, height = 100, paint = () => [255, 255, 255] } = {}) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = paint(x, y);
      const index = (width * y + x) * 4;
      png.data[index] = r;
      png.data[index + 1] = g;
      png.data[index + 2] = b;
      png.data[index + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

test('diffScreenshot reports identical PNGs as no drift', () => {
  const png = makePng();
  const result = diffScreenshot({ expected: png, actual: makePng() });
  expect(result.changed).toBe(false);
  expect(result.changedPixels).toBe(0);
  expect(result.totalPixels).toBe(10000);
  expect(result.diff).toBeUndefined();
  expect(result.message).toMatch(/screenshot unchanged/);
});

test('diffScreenshot reports a one-pixel change under the default tolerance as no drift', () => {
  const expected = makePng();
  const actual = makePng({ paint: (x, y) => (x === 5 && y === 5 ? [0, 0, 0] : [255, 255, 255]) });
  const result = diffScreenshot({ expected, actual });
  expect(result.changedPixels).toBe(1);
  expect(result.changed).toBe(false);
});

test('diffScreenshot reports a large change as drift with a diff image', () => {
  const expected = makePng();
  const actual = makePng({ paint: (x) => (x < 50 ? [0, 0, 0] : [255, 255, 255]) });
  const result = diffScreenshot({ expected, actual });
  expect(result.changed).toBe(true);
  expect(result.changedPixels).toBe(5000);
  expect(result.fraction).toBe(0.5);
  expect(result.message).toMatch(/5000 of 10000 pixels \(50.000%\) differ/);
  const diff = PNG.sync.read(result.diff);
  expect(diff.width).toBe(100);
  expect(diff.height).toBe(100);
});

test('diffScreenshot honours a custom tolerance', () => {
  const expected = makePng();
  const actual = makePng({ paint: (x, y) => (y === 0 && x < 20 ? [0, 0, 0] : [255, 255, 255]) });
  expect(diffScreenshot({ expected, actual, tolerance: 0.001 }).changed).toBe(true);
  expect(diffScreenshot({ expected, actual, tolerance: 0.01 }).changed).toBe(false);
});

test('diffScreenshot reports a size mismatch as drift with a clear message and no throw', () => {
  const result = diffScreenshot({
    expected: makePng({ width: 100, height: 100 }),
    actual: makePng({ width: 100, height: 120 }),
  });
  expect(result.changed).toBe(true);
  expect(result.message).toBe('screenshot size changed from 100x100 to 100x120');
  expect(result.diff).toBeUndefined();
});
