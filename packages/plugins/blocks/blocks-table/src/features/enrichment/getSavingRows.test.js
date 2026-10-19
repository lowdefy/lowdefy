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

import createRowKeyGetter from '@lowdefy/blocks-antd/table/createRowKeyGetter.js';

import getSavingRows from './getSavingRows.js';

const getKey = createRowKeyGetter({});

test('getSavingRows returns the pending rows themselves when the data has none of their keys', () => {
  const pending = [{ _id: 'k1', name: 'Ada' }];
  const rows = [{ _id: 'a', name: 'Ben' }];
  expect(getSavingRows({ getKey, pending, rows })).toBe(pending);
});

test('getSavingRows drops a pending row once the data has a row with its key', () => {
  const pending = [
    { _id: 'k1', name: 'Ada' },
    { _id: 'k2', name: 'Cara' },
  ];
  const rows = [
    { _id: 'a', name: 'Ben' },
    { _id: 'k1', name: 'Ada', company: 'Software' },
  ];
  expect(getSavingRows({ getKey, pending, rows })).toEqual([{ _id: 'k2', name: 'Cara' }]);
});

test('getSavingRows matches keys by their text, so a number key matches its string form', () => {
  const pending = [{ id: '5', name: 'Ada' }];
  const rows = [{ id: 5, name: 'Ada' }];
  expect(getSavingRows({ getKey, pending, rows })).toEqual([]);
});

test('getSavingRows reads keys at the rowKey path', () => {
  const getPathKey = createRowKeyGetter({ rowKey: 'meta.key' });
  const pending = [{ meta: { key: 'k1' }, name: 'Ada' }];
  const rows = [{ _id: 'k1', meta: { key: 'other' } }];
  expect(getSavingRows({ getKey: getPathKey, pending, rows })).toBe(pending);
  const saved = [{ meta: { key: 'k1' }, name: 'Ada' }];
  expect(getSavingRows({ getKey: getPathKey, pending, rows: saved })).toEqual([]);
});

test('getSavingRows returns the empty pending list as it is', () => {
  const pending = [];
  expect(getSavingRows({ getKey, pending, rows: [{ _id: 'a' }] })).toBe(pending);
});
