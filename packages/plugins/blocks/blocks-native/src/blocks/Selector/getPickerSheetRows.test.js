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

import getPickerSheetRows, { CREATE_KEY, NO_VALUE_KEY } from './getPickerSheetRows.js';

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
    noValue: true,
    options,
    placeholder: 'Unassigned',
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

test('getPickerSheetRows leaves out the no-value row when asked', () => {
  const rows = getPickerSheetRows({
    noValue: false,
    options,
    placeholder: 'Unassigned',
    selected: [2],
  });
  expect(summary(rows)).toEqual([
    ['1', 'Assign to me', 'group'],
    ['0', 'Grace Hopper', 'inset'],
    ['2', 'José Núñez', 'inset'],
    ['3', 'Old account', 'none'],
  ]);
  expect(rows.filter((row) => row.selected).map((row) => row.key)).toEqual(['2']);
});

test('getPickerSheetRows chooses the no-value row while nothing is chosen', () => {
  const rows = getPickerSheetRows({
    noValue: true,
    options: ['Red', 'Green'],
    placeholder: 'Select item',
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
    noValue: true,
    options,
    placeholder: 'Unassigned',
    query: ' JOSE ',
  });
  expect(summary(rows)).toEqual([['2', 'José Núñez', 'none']]);
  expect(
    summary(
      getPickerSheetRows({
        noValue: true,
        options,
        placeholder: 'Unassigned',
        query: 'un',
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
    noValue: true,
    options,
    placeholder: 'Unassigned',
    query: 'assign',
  });
  expect(summary(rows)).toEqual([
    [NO_VALUE_KEY, 'Unassigned', 'inset'],
    ['1', 'Assign to me', 'none'],
  ]);
  expect(
    getPickerSheetRows({
      noValue: true,
      options,
      placeholder: 'Unassigned',
      query: 'nobody',
    })
  ).toEqual([]);
});

test('getPickerSheetRows lists the options in first ahead of the others in their group', () => {
  const rows = getPickerSheetRows({
    first: [3, 2],
    options,
    selected: [2],
  });
  expect(summary(rows)).toEqual([
    ['1', 'Assign to me', 'group'],
    ['2', 'José Núñez', 'inset'],
    ['3', 'Old account', 'inset'],
    ['0', 'Grace Hopper', 'none'],
  ]);
  expect(rows.map((row) => row.selected)).toEqual([false, true, false, false]);
});

test('getPickerSheetRows disables the unchosen options when the selection is full', () => {
  const rows = getPickerSheetRows({ full: true, options: ['ui', 'api', 'docs'], selected: [1] });
  expect(rows.map((row) => [row.key, row.disabled])).toEqual([
    ['0', true],
    ['1', false],
    ['2', true],
  ]);
});

test('getPickerSheetRows leads with an add row while the search text is no option', () => {
  const create = { pattern: '^[a-z0-9-]+$', message: 'Use lowercase letters, digits and hyphens.' };
  const labels = ['agent-rules', 'ui'];
  const rows = getPickerSheetRows({ create, options: labels, query: ' u ' });
  expect(summary(rows)).toEqual([
    [CREATE_KEY, 'Add “u”', 'group'],
    ['0', 'agent-rules', 'inset'],
    ['1', 'ui', 'none'],
  ]);
  expect(rows[0]).toMatchObject({
    create: true,
    description: null,
    disabled: false,
    index: null,
    invalid: false,
    value: 'u',
  });
  // Text that is an option's label (ignoring case) adds nothing.
  expect(
    getPickerSheetRows({ create, options: labels, query: 'UI' }).map((row) => row.key)
  ).toEqual(['1']);
  // Text the pattern refuses gives a row that cannot be picked, with the message.
  expect(getPickerSheetRows({ create, options: labels, query: 'New UI' })[0]).toMatchObject({
    description: 'Use lowercase letters, digits and hyphens.',
    disabled: true,
    invalid: true,
    label: 'Add “New UI”',
  });
  // No add row without create, without text, or once the selection is full.
  expect(getPickerSheetRows({ options: labels, query: 'docs' })).toEqual([]);
  expect(getPickerSheetRows({ create, options: labels, query: '  ' })).toHaveLength(2);
  expect(
    getPickerSheetRows({ create, full: true, options: labels, query: 'docs' })[0]
  ).toMatchObject({ disabled: true, invalid: false });
});

test('getPickerSheetRows adds any text without a create pattern', () => {
  const rows = getPickerSheetRows({ create: {}, options: [], query: 'Needs Design' });
  expect(rows).toEqual([
    expect.objectContaining({ disabled: false, separator: 'none', value: 'Needs Design' }),
  ]);
});
