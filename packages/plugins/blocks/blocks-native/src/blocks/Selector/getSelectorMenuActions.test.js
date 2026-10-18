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

import getSelectorMenuActions from './getSelectorMenuActions.js';

const options = [
  { label: 'Todo', value: 'todo', symbol: 'circle' },
  { label: 'In <b>progress</b>', value: 'in_progress', symbol: 'circle.lefthalf.filled' },
  { label: 'Ada', value: 'ada', avatar: { name: 'Ada Lovelace' } },
  { label: 'Done', value: 'done', disabled: true },
];

test('options are checkable items, the chosen one checked, with their symbols', () => {
  expect(
    getSelectorMenuActions({ allowClear: false, options, placeholder: 'None', selectedIndex: 1 })
  ).toEqual([
    { id: '0', title: 'Todo', image: 'circle', state: 'off', attributes: { disabled: false } },
    {
      id: '1',
      title: 'In progress',
      image: 'circle.lefthalf.filled',
      state: 'on',
      attributes: { disabled: false },
    },
    {
      id: '2',
      title: 'Ada',
      image: 'person.crop.circle',
      state: 'off',
      attributes: { disabled: false },
    },
    { id: '3', title: 'Done', image: undefined, state: 'off', attributes: { disabled: true } },
  ]);
});

test('the placeholder comes first while the value can be cleared or is empty', () => {
  const [clearable] = getSelectorMenuActions({
    allowClear: true,
    options,
    placeholder: 'None',
    selectedIndex: 0,
  });
  expect(clearable).toEqual({ id: 'no_value', title: 'None', state: 'off' });
  const [empty] = getSelectorMenuActions({
    allowClear: false,
    options: ['a', 'b'],
    placeholder: 'None',
    selectedIndex: null,
  });
  expect(empty).toEqual({ id: 'no_value', title: 'None', state: 'on' });
});
