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

import { expect, test } from 'vitest';

import toSelectOptions from './toSelectOptions.js';

function createSpec(options) {
  return { column: { key: 'stage', type: 'status' }, options };
}

test('toSelectOptions keeps the label for search and the title, and the value', () => {
  const [option] = toSelectOptions({
    components: {},
    spec: createSpec([{ value: 'won', label: 'Won' }]),
    row: {},
  });
  expect(option.text).toBe('Won');
  expect(option.title).toBe('Won');
  expect(option.value).toBe('won');
  expect(option.label.props.value).toBe('won');
});

test('toSelectOptions carries a description only when the option has a non-empty string', () => {
  const options = toSelectOptions({
    components: {},
    spec: createSpec([
      { value: 'lead', label: 'Lead', description: 'Not yet spoken to.' },
      { value: 'won', label: 'Won' },
      { value: 'lost', label: 'Lost', description: '' },
      { value: 'parked', label: 'Parked', description: null },
    ]),
    row: {},
  });
  expect(options.map((option) => option.description)).toEqual([
    'Not yet spoken to.',
    undefined,
    undefined,
    undefined,
  ]);
});

test('toSelectOptions returns no options for a column without options', () => {
  expect(toSelectOptions({ components: {}, spec: createSpec(undefined), row: {} })).toEqual([]);
});
