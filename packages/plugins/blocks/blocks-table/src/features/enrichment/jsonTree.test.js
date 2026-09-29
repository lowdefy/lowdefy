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

import formatJsonPreview from './formatJsonPreview.js';
import getJsonValueKind from './getJsonValueKind.js';
import getJsonChildren from './getJsonChildren.js';
import humanizePath from './humanizePath.js';
import inferColumnType from './inferColumnType.js';

test('getJsonChildren lists object entries with dot paths from the root', () => {
  expect(getJsonChildren({ value: { a: 1, b: { c: 2 }, d: {} }, path: '' })).toEqual({
    total: 3,
    children: [
      { key: 'a', path: 'a', value: 1, expandable: false },
      { key: 'b', path: 'b', value: { c: 2 }, expandable: true },
      { key: 'd', path: 'd', value: {}, expandable: false },
    ],
  });
});

test('getJsonChildren lists array items with numeric path segments', () => {
  expect(getJsonChildren({ value: [{ name: 'Ada' }, 'x'], path: 'people' }).children).toEqual([
    { key: '0', path: 'people.0', value: { name: 'Ada' }, expandable: true },
    { key: '1', path: 'people.1', value: 'x', expandable: false },
  ]);
});

test('getJsonChildren returns a page of a large object with its total', () => {
  const value = Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`k${i}`, i]));
  const { total, children } = getJsonChildren({ value, path: 'big', limit: 100 });
  expect(total).toBe(1000);
  expect(children).toHaveLength(100);
  expect(children[99].path).toBe('big.k99');
});

test('getJsonChildren of a primitive has no children', () => {
  expect(getJsonChildren({ value: 'x', path: 'a' })).toEqual({ total: 0, children: [] });
  expect(getJsonChildren({ value: null, path: 'a' })).toEqual({ total: 0, children: [] });
});

test('humanizePath titles a path, counting array indices from one', () => {
  expect(humanizePath('company.linkedin_url')).toBe('Company linkedin url');
  expect(humanizePath('people.0.firstName')).toBe('People 1 first name');
  expect(humanizePath('')).toBe('Result');
});

test('inferColumnType reads the type from the value', () => {
  expect(inferColumnType(3)).toBe('number');
  expect(inferColumnType(true)).toBe('boolean');
  expect(inferColumnType('2026-01-02')).toBe('date');
  expect(inferColumnType('2026-01-02T10:00:00Z')).toBe('datetime');
  expect(inferColumnType('ada@acme.com')).toBe('email');
  expect(inferColumnType('https://acme.com/about')).toBe('url');
  expect(inferColumnType('hello')).toBe('text');
  expect(inferColumnType(['a', 'b'])).toBe('tags');
  expect(inferColumnType([1, 2])).toBe('json');
  expect(inferColumnType({ a: 1 })).toBe('json');
  expect(inferColumnType(null)).toBe('text');
});

test('formatJsonPreview shows primitives as JSON and containers by size', () => {
  expect(formatJsonPreview('x')).toBe('"x"');
  expect(formatJsonPreview(2)).toBe('2');
  expect(formatJsonPreview(null)).toBe('null');
  expect(formatJsonPreview([1])).toBe('[1 item]');
  expect(formatJsonPreview({ a: 1, b: 2 })).toBe('{2 keys}');
  // The tree cuts previews to its width with CSS; the text is only bounded.
  expect(formatJsonPreview('y'.repeat(200))).toBe(`"${'y'.repeat(200)}"`);
  expect(formatJsonPreview('y'.repeat(5000))).toHaveLength(2000);
});

test('getJsonValueKind names the kind a preview is coloured by', () => {
  expect(getJsonValueKind('x')).toBe('string');
  expect(getJsonValueKind(2)).toBe('number');
  expect(getJsonValueKind(false)).toBe('boolean');
  expect(getJsonValueKind(null)).toBe('null');
  expect(getJsonValueKind(undefined)).toBe('null');
  expect(getJsonValueKind(new Date(0))).toBe('date');
  expect(getJsonValueKind([1])).toBe('array');
  expect(getJsonValueKind({ a: 1 })).toBe('object');
});
