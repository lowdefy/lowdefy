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

import createRowKeyGetter from './createRowKeyGetter.js';

test('createRowKeyGetter reads _id, then id', () => {
  const getRowKey = createRowKeyGetter();
  expect(getRowKey({ _id: 'a', id: 'b' })).toBe('a');
  expect(getRowKey({ id: 3 })).toBe(3);
});

test('createRowKeyGetter reads the rowKey field path when set', () => {
  const getRowKey = createRowKeyGetter({ rowKey: 'meta.code' });
  expect(getRowKey({ _id: 'a', meta: { code: 'X1' } })).toBe('X1');
});

test('createRowKeyGetter gives rows without an id a key stable for the same object', () => {
  const getRowKey = createRowKeyGetter();
  const row = { name: 'a' };
  const other = { name: 'a' };
  expect(getRowKey(row)).toBe(getRowKey(row));
  expect(getRowKey(other)).not.toBe(getRowKey(row));
});

test('createRowKeyGetter serialises object ids', () => {
  expect(createRowKeyGetter()({ _id: { $oid: '1' } })).toBe('{"$oid":"1"}');
});
