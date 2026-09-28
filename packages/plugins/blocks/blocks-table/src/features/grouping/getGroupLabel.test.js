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

import getGroupLabel from './getGroupLabel.js';

test('getGroupLabel labels the empty group "(Empty)"', () => {
  const level = { column: { type: 'text', cell: {} }, options: undefined };
  assert.equal(getGroupLabel({ level, item: { empty: true, value: null } }), '(Empty)');
});

test('getGroupLabel uses the option label for enum values', () => {
  const level = {
    column: { type: 'tag', cell: {} },
    options: [{ value: 'lead', label: 'Lead', index: 0 }],
  };
  assert.equal(getGroupLabel({ level, item: { empty: false, value: 'lead' } }), 'Lead');
  assert.equal(getGroupLabel({ level, item: { empty: false, value: 'other' } }), 'other');
});

test('getGroupLabel formats values with the column type', () => {
  const level = { column: { type: 'boolean', cell: {} }, options: undefined };
  assert.equal(getGroupLabel({ level, item: { empty: false, value: true } }), 'Yes');
  const numberLevel = { column: { type: 'number', cell: { locale: 'en-US' } }, options: undefined };
  assert.equal(getGroupLabel({ level: numberLevel, item: { empty: false, value: 1500 } }), '1,500');
});
