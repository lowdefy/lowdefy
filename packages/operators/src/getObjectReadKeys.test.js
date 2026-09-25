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

import getObjectReadKeys from './getObjectReadKeys.js';

const arrayIndices = [3, 7];

test('getObjectReadKeys returns the namespaced key for a string path', () => {
  expect(getObjectReadKeys({ arrayIndices: [], namespace: 'state', params: 'a.b' })).toEqual([
    'state:a.b',
  ]);
});

test('getObjectReadKeys applies array indices to $ in the path', () => {
  expect(
    getObjectReadKeys({ arrayIndices, namespace: 'state', params: 'list.$.rows.$.x' })
  ).toEqual(['state:list.3.rows.7.x']);
});

test('getObjectReadKeys reads the key of an object param with a default', () => {
  expect(
    getObjectReadKeys({
      arrayIndices,
      namespace: 'global',
      params: { key: 'list.$', default: 'x' },
    })
  ).toEqual(['global:list.3']);
});

test('getObjectReadKeys converts an integer key to a string path', () => {
  expect(getObjectReadKeys({ arrayIndices: [], namespace: 'input', params: 2 })).toEqual([
    'input:2',
  ]);
});

test('getObjectReadKeys returns the namespace wildcard for true and all', () => {
  expect(getObjectReadKeys({ arrayIndices: [], namespace: 'state', params: true })).toEqual([
    'state:*',
  ]);
  expect(
    getObjectReadKeys({ arrayIndices: [], namespace: 'state', params: { all: true } })
  ).toEqual(['state:*']);
});

test('getObjectReadKeys returns no keys when key is null, as getFromObject reads nothing', () => {
  expect(
    getObjectReadKeys({ arrayIndices: [], namespace: 'state', params: { key: null, all: true } })
  ).toEqual([]);
});

test('getObjectReadKeys returns the wildcard for params getFromObject rejects', () => {
  expect(getObjectReadKeys({ arrayIndices: [], namespace: 'state', params: null })).toEqual([
    'state:*',
  ]);
  expect(getObjectReadKeys({ arrayIndices: [], namespace: 'state', params: { key: {} } })).toEqual([
    'state:*',
  ]);
  expect(getObjectReadKeys({ arrayIndices: [], namespace: 'state', params: '' })).toEqual([
    'state:*',
  ]);
});
