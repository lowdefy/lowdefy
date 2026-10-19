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

import getParagraphWidths from './getParagraphWidths.js';

const percent = (width) => parseInt(width, 10);

test('getParagraphWidths ends a paragraph in ragged lines', () => {
  const widths = getParagraphWidths({ lines: 5 }).map(percent);
  expect(widths).toHaveLength(5);
  widths.slice(0, 3).forEach((width) => expect(width).toBeGreaterThanOrEqual(94));
  expect(widths[3]).toBeGreaterThanOrEqual(80);
  expect(widths[3]).toBeLessThanOrEqual(92);
  expect(widths[4]).toBeLessThanOrEqual(70);
  expect(widths[4]).toBeLessThan(widths[3]);
});

test('getParagraphWidths draws two lines as a full line and a short one', () => {
  const [first, last] = getParagraphWidths({ lines: 2 }).map(percent);
  expect(first).toBeGreaterThanOrEqual(94);
  expect(last).toBeLessThanOrEqual(70);
});

test('getParagraphWidths draws one line as a short sentence, varied by the salt', () => {
  const [line] = getParagraphWidths({ lines: 1 }).map(percent);
  expect(line).toBeGreaterThanOrEqual(55);
  expect(line).toBeLessThanOrEqual(85);
  expect(getParagraphWidths({ lines: 1, salt: 1 })).not.toEqual(getParagraphWidths({ lines: 1 }));
});
