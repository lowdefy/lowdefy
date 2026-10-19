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

import fs from 'fs';

import CELL_TYPE_FAMILIES from './cellTypeFamilies.js';
import getOperators from './getOperators.js';

const COMMON = ['eq', 'ne', 'in', 'nin', 'empty', 'notEmpty'];

test('getOperators gives text-like types the text operators first', () => {
  ['text', 'email', 'phone', 'url', 'link', 'html', 'relation', 'tag', 'status'].forEach(
    (cellType) => {
      expect(getOperators(cellType)).toEqual([
        'contains',
        'notContains',
        'startsWith',
        'endsWith',
        ...COMMON,
      ]);
    }
  );
});

test('getOperators gives numeric types the range operators', () => {
  ['number', 'currency', 'percent', 'progress', 'rating'].forEach((cellType) => {
    const operators = getOperators(cellType);
    expect(operators).toEqual(
      expect.arrayContaining([...COMMON, 'gt', 'gte', 'lt', 'lte', 'between'])
    );
    expect(operators).not.toContain('contains');
  });
});

test('getOperators gives date types before, after, between and within', () => {
  expect(getOperators('date')).toEqual(['before', 'after', 'between', 'within', ...COMMON]);
  expect(getOperators('datetime')).toEqual(getOperators('date'));
});

test('getOperators gives booleans isTrue and isFalse first', () => {
  expect(getOperators('boolean')).toEqual(['isTrue', 'isFalse', ...COMMON]);
});

test('getOperators gives tags and people the membership operators', () => {
  expect(getOperators('tags')).toEqual([
    'in',
    'nin',
    'contains',
    'notContains',
    'eq',
    'ne',
    'empty',
    'notEmpty',
  ]);
  expect(getOperators('people')).toEqual(getOperators('tags'));
});

test('getOperators gives json and image the common operators and actions none', () => {
  expect(getOperators('json')).toEqual(COMMON);
  expect(getOperators('image')).toEqual(COMMON);
  expect(getOperators('buttons')).toEqual([]);
  expect(getOperators('menu')).toEqual([]);
});

test('getOperators treats a missing type as text', () => {
  expect(getOperators(undefined)).toEqual(getOperators('text'));
});

test('getOperators returns a copy the caller may change', () => {
  getOperators('text').push('x');
  expect(getOperators('text')).not.toContain('x');
});

test('getOperators throws on an unknown type', () => {
  expect(() => getOperators('txt')).toThrow('Unknown table cell type "txt".');
});

// The same fixture is checked into @lowdefy/connection-mongodb (test/tableFilterOperators.json),
// whose MongoDBTableQuery must accept every operator a filter menu offers, so a change to the
// operators here fails until both copies and the server field types are changed together.
test('getOperators matches the filter operator fixture shared with MongoDBTableQuery', () => {
  const fixture = JSON.parse(
    fs.readFileSync(new URL('../../test/tableFilterOperators.json', import.meta.url), 'utf8')
  );
  const operatorsByType = Object.fromEntries(
    Object.keys(CELL_TYPE_FAMILIES)
      .sort()
      .map((cellType) => [cellType, getOperators(cellType).sort()])
  );
  expect(operatorsByType).toEqual(fixture);
});
