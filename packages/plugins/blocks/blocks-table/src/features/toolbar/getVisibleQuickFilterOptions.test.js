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

import assert from 'node:assert/strict';

import getVisibleQuickFilterOptions from './getVisibleQuickFilterOptions.js';

const options = [
  { value: 'ada', label: 'Ada Lovelace' },
  { value: 'grace', label: 'Grace Hopper' },
  { value: 'alan', label: 'Alan Turing' },
  { value: 7, label: 7 },
];

test('getVisibleQuickFilterOptions lists every option for an empty or blank search', () => {
  assert.deepEqual(getVisibleQuickFilterOptions({ options, search: '', values: [] }), [0, 1, 2, 3]);
  assert.deepEqual(
    getVisibleQuickFilterOptions({ options, search: '  ', values: [] }),
    [0, 1, 2, 3]
  );
});

test('getVisibleQuickFilterOptions matches labels case-insensitively, in option order', () => {
  assert.deepEqual(getVisibleQuickFilterOptions({ options, search: 'AL', values: [] }), [2]);
  assert.deepEqual(getVisibleQuickFilterOptions({ options, search: ' a ', values: [] }), [0, 1, 2]);
  assert.deepEqual(getVisibleQuickFilterOptions({ options, search: '7', values: [] }), [3]);
  assert.deepEqual(getVisibleQuickFilterOptions({ options, search: 'zed', values: [] }), []);
});

test('getVisibleQuickFilterOptions keeps checked options listed', () => {
  assert.deepEqual(
    getVisibleQuickFilterOptions({ options, search: 'grace', values: ['ada', 7] }),
    [0, 1, 3]
  );
});
