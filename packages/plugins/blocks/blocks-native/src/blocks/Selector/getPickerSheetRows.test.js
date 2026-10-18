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

import getPickerSheetRows, { NO_VALUE_KEY } from './getPickerSheetRows.js';

const options = [
  { label: 'Grace Hopper', value: 'grace', description: 'grace@example.com' },
  { label: 'Assign to me', value: 'me', pinned: true },
  { label: 'José Núñez', value: 'jose' },
  { label: 'Old account', value: 'old', disabled: true },
];

function summary(rows) {
  return rows.map((row) => [row.key, row.label, row.separator]);
}

test('getPickerSheetRows puts the no-value row and pinned options first, then the rest', () => {
  const rows = getPickerSheetRows({
    allowClear: true,
    options,
    placeholder: 'Unassigned',
    selectedIndex: null,
  });
  expect(summary(rows)).toEqual([
    [NO_VALUE_KEY, 'Unassigned', 'inset'],
    ['1', 'Assign to me', 'group'],
    ['0', 'Grace Hopper', 'inset'],
    ['2', 'José Núñez', 'inset'],
    ['3', 'Old account', 'none'],
  ]);
  expect(rows[0]).toMatchObject({ index: null, noValue: true, selected: true });
  expect(rows[2]).toMatchObject({ description: 'grace@example.com', index: 0, selected: false });
  expect(rows[4].disabled).toBe(true);
});

test('getPickerSheetRows leaves out the no-value row when a chosen value cannot be cleared', () => {
  const rows = getPickerSheetRows({
    allowClear: false,
    options,
    placeholder: 'Unassigned',
    selectedIndex: 2,
  });
  expect(summary(rows)).toEqual([
    ['1', 'Assign to me', 'group'],
    ['0', 'Grace Hopper', 'inset'],
    ['2', 'José Núñez', 'inset'],
    ['3', 'Old account', 'none'],
  ]);
  expect(rows.filter((row) => row.selected).map((row) => row.key)).toEqual(['2']);
});

test('getPickerSheetRows keeps the no-value row while nothing is chosen, even without allowClear', () => {
  const rows = getPickerSheetRows({
    allowClear: false,
    options: ['Red', 'Green'],
    placeholder: 'Select item',
    selectedIndex: null,
  });
  expect(summary(rows)).toEqual([
    [NO_VALUE_KEY, 'Select item', 'group'],
    ['0', 'Red', 'inset'],
    ['1', 'Green', 'none'],
  ]);
  expect(rows[1]).toMatchObject({ description: null, option: null, pinned: false });
});

test('getPickerSheetRows filters by label, ignoring case and accents', () => {
  const rows = getPickerSheetRows({
    allowClear: true,
    options,
    placeholder: 'Unassigned',
    query: ' JOSE ',
    selectedIndex: null,
  });
  expect(summary(rows)).toEqual([['2', 'José Núñez', 'none']]);
  expect(
    summary(
      getPickerSheetRows({
        allowClear: true,
        options,
        placeholder: 'Unassigned',
        query: 'un',
        selectedIndex: null,
      })
    )
  ).toEqual([
    [NO_VALUE_KEY, 'Unassigned', 'group'],
    ['2', 'José Núñez', 'inset'],
    ['3', 'Old account', 'none'],
  ]);
});

test('getPickerSheetRows draws no group hairline when only one group is left', () => {
  const rows = getPickerSheetRows({
    allowClear: true,
    options,
    placeholder: 'Unassigned',
    query: 'assign',
    selectedIndex: null,
  });
  expect(summary(rows)).toEqual([
    [NO_VALUE_KEY, 'Unassigned', 'inset'],
    ['1', 'Assign to me', 'none'],
  ]);
  expect(
    getPickerSheetRows({
      allowClear: true,
      options,
      placeholder: 'Unassigned',
      query: 'nobody',
      selectedIndex: null,
    })
  ).toEqual([]);
});
