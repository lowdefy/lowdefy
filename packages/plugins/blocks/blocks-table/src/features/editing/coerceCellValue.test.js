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

import coerceCellValue from './coerceCellValue.js';
import getEditorKind from './getEditorKind.js';

function spec(type, extra = {}) {
  return { type, kind: getEditorKind(type), max: 5, options: undefined, ...extra };
}

const stageOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'won', label: 'Closed won' },
];

test('coerceCellValue keeps text as typed', () => {
  expect(coerceCellValue({ spec: spec('text'), text: ' Ann ' })).toEqual({ value: ' Ann ' });
  expect(coerceCellValue({ spec: spec('email'), text: '' })).toEqual({ value: '' });
});

test('coerceCellValue reads numbers with grouping separators and currency symbols', () => {
  expect(coerceCellValue({ spec: spec('number'), text: '1,234.5' })).toEqual({ value: 1234.5 });
  expect(coerceCellValue({ spec: spec('currency'), text: '$ 1 200' })).toEqual({ value: 1200 });
  expect(coerceCellValue({ spec: spec('number'), text: '-3' })).toEqual({ value: -3 });
  expect(coerceCellValue({ spec: spec('number'), text: '' })).toEqual({ value: null });
});

test('coerceCellValue reports a word pasted into a number column', () => {
  expect(coerceCellValue({ spec: spec('number'), text: 'abc' })).toEqual({
    error: '"abc" is not a number.',
  });
});

test('coerceCellValue reads a percent with a % sign as a fraction', () => {
  expect(coerceCellValue({ spec: spec('percent'), text: '12%' })).toEqual({ value: 0.12 });
  expect(coerceCellValue({ spec: spec('percent'), text: '0.12' })).toEqual({ value: 0.12 });
});

test('coerceCellValue rounds ratings and rejects values outside 0 to max', () => {
  expect(coerceCellValue({ spec: spec('rating'), text: '3.6' })).toEqual({ value: 4 });
  expect(coerceCellValue({ spec: spec('rating'), text: '9' }).error).toMatch(/0 to 5/);
});

test('coerceCellValue reads booleans from common words', () => {
  expect(coerceCellValue({ spec: spec('boolean'), text: 'Yes' })).toEqual({ value: true });
  expect(coerceCellValue({ spec: spec('boolean'), text: 'false' })).toEqual({ value: false });
  expect(coerceCellValue({ spec: spec('boolean'), text: 'maybe' }).error).toMatch(/true or false/);
});

test('coerceCellValue parses a date into the shape of the previous value', () => {
  const asDate = coerceCellValue({ spec: spec('date'), text: '2026-03-01', previous: null });
  expect(asDate.value).toEqual(new Date('2026-03-01T00:00:00.000Z'));
  const asString = coerceCellValue({
    spec: spec('date'),
    text: '2026-03-01',
    previous: '2025-01-01',
  });
  expect(asString).toEqual({ value: '2026-03-01' });
  expect(coerceCellValue({ spec: spec('date'), text: 'soon' }).error).toMatch(/not a date/);
});

test('coerceCellValue matches options by value or label, ignoring case', () => {
  const tag = spec('tag', { options: stageOptions });
  expect(coerceCellValue({ spec: tag, text: 'closed WON' })).toEqual({ value: 'won' });
  expect(coerceCellValue({ spec: tag, text: 'LEAD' })).toEqual({ value: 'lead' });
  expect(coerceCellValue({ spec: tag, text: 'lost' }).error).toMatch(/not one of the options/);
});

test('coerceCellValue splits a tags list and rejects an unknown option', () => {
  const tags = spec('tags', { options: stageOptions });
  expect(coerceCellValue({ spec: tags, text: 'Lead, Closed won' })).toEqual({
    value: ['lead', 'won'],
  });
  expect(coerceCellValue({ spec: tags, text: 'Lead, lost' }).error).toMatch(/"lost"/);
  expect(coerceCellValue({ spec: spec('tags'), text: 'a;b' })).toEqual({ value: ['a', 'b'] });
});

test('coerceCellValue refuses types without an editor', () => {
  expect(coerceCellValue({ spec: spec('json'), text: '{}' }).error).toMatch(/not editable/);
});
