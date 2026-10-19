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

import customTagTone from '@lowdefy/block-utils/format/customTagTone.js';
import TAG_TONES from '@lowdefy/block-utils/format/tagTones.js';

import getTagTone from './getTagTone.js';
import normalizeOptions from './normalizeOptions.js';

test('getTagTone uses the option colour, or neutral for an option without one', () => {
  const column = {
    cell: {},
    options: normalizeOptions([{ value: 'won', color: 'success' }, { value: 'open' }]),
  };
  expect(getTagTone({ item: 'won', column, row: {} })).toBe(TAG_TONES.success);
  expect(getTagTone({ item: 'open', column, row: {} })).toBe(TAG_TONES.default);
});

test('getTagTone falls back to the ag-grid colorFrom, colorMap and default keys', () => {
  expect(getTagTone({ item: 'a', column: { cell: { colorFrom: 'c' } }, row: { c: 'red' } })).toBe(
    TAG_TONES.red
  );
  expect(
    getTagTone({ item: 'a', column: { cell: { colorMap: { a: '#123456' } } }, row: {} })
  ).toEqual(customTagTone('#123456'));
  expect(
    getTagTone({
      item: 'b',
      column: { cell: { colorMap: { a: 'red' }, default: 'blue' } },
      row: {},
    })
  ).toBe(TAG_TONES.blue);
  expect(getTagTone({ item: 'b', column: { cell: { colorMap: { a: 'red' } } }, row: {} })).toBe(
    TAG_TONES.default
  );
});

test('getTagTone seeds a stable preset tone when the column sets no colours', () => {
  const column = { cell: {} };
  const tone = getTagTone({ item: 'Approved', column, row: {} });
  expect(Object.values(TAG_TONES)).toContain(tone);
  expect(getTagTone({ item: 'Approved', column, row: {} })).toBe(tone);
});
