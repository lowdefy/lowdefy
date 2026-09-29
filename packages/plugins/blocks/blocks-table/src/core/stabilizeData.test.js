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

import stabilizeData from './stabilizeData.js';

const getKey = (row) => row.id;

test('stabilizeData keeps a row whose version did not change', () => {
  const first = stabilizeData({
    data: [{ id: 1, name: 'Ann', updated: { timestamp: 1 } }],
    getKey,
    rowVersionField: 'updated.timestamp',
  });
  const second = stabilizeData({
    data: [{ id: 1, name: 'Ann', updated: { timestamp: 1 } }],
    previous: first,
    getKey,
    rowVersionField: 'updated.timestamp',
  });
  expect(second.rows[0]).toBe(first.rows[0]);
});

test('stabilizeData takes a new row when a dot path version changed', () => {
  const first = stabilizeData({
    data: [{ id: 1, name: 'Ann', updated: { timestamp: 1 } }],
    getKey,
    rowVersionField: 'updated.timestamp',
  });
  const next = { id: 1, name: 'Anna', updated: { timestamp: 2 } };
  const second = stabilizeData({
    data: [next],
    previous: first,
    getKey,
    rowVersionField: 'updated.timestamp',
  });
  expect(second.rows[0]).toBe(next);
});

test('stabilizeData compares the whole row when a row has no version', () => {
  const first = stabilizeData({
    data: [{ id: 1, name: 'Ann' }],
    getKey,
    rowVersionField: 'updated.timestamp',
  });
  const changed = { id: 1, name: 'Anna' };
  const second = stabilizeData({
    data: [changed],
    previous: first,
    getKey,
    rowVersionField: 'updated.timestamp',
  });
  expect(second.rows[0]).toBe(changed);
  const third = stabilizeData({
    data: [{ id: 1, name: 'Anna' }],
    previous: second,
    getKey,
    rowVersionField: 'updated.timestamp',
  });
  expect(third.rows[0]).toBe(changed);
});

test('stabilizeData compares the whole row when only the new row has a version', () => {
  const first = stabilizeData({
    data: [{ id: 1, name: 'Ann' }],
    getKey,
    rowVersionField: 'version',
  });
  const next = { id: 1, name: 'Ann', version: 1 };
  const second = stabilizeData({
    data: [next],
    previous: first,
    getKey,
    rowVersionField: 'version',
  });
  expect(second.rows[0]).toBe(next);
});

test('stabilizeData compares date versions by time', () => {
  const first = stabilizeData({
    data: [{ id: 1, name: 'Ann', updated: new Date(1000) }],
    getKey,
    rowVersionField: 'updated',
  });
  const second = stabilizeData({
    data: [{ id: 1, name: 'Ann', updated: new Date(1000) }],
    previous: first,
    getKey,
    rowVersionField: 'updated',
  });
  expect(second.rows[0]).toBe(first.rows[0]);
});
