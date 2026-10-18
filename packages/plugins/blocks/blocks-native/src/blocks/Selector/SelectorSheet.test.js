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

import { act, fireEvent, within } from '@testing-library/react-native';

import formPage from '../../test/formPage.js';
import { press, record, renderPage, screen, styleOf, theme } from '../../test/renderPage.js';

const people = [
  { label: 'Assign to me', value: 'me', pinned: true, avatar: { name: 'Sam Tolmay' } },
  {
    label: 'Ada Lovelace',
    value: 'ada',
    description: 'ada@example.com',
    avatar: { name: 'Ada Lovelace', src: 'https://img.example/ada.png' },
  },
  { label: 'Grace Hopper', value: 'grace', avatar: { name: 'Grace Hopper' } },
];

function assignee(properties = {}) {
  return {
    id: 'assignee',
    type: 'Selector',
    properties: {
      title: 'Assignee',
      variant: 'sheet',
      menuTitle: 'Assign to',
      placeholder: 'Unassigned',
      options: people,
      ...properties,
    },
    events: { onChange: record('change'), onClear: record('clear') },
  };
}

function sheet() {
  return screen.getByTestId('expo-ui-bottom-sheet');
}

async function openSheet() {
  await press(await screen.findByTestId('assignee_input'));
}

test('the sheet variant is the menu row, and opens a sheet of the options', async () => {
  await renderPage({ pageConfig: formPage({ blocks: [assignee()], mirrorKey: 'assignee' }) });
  const row = await screen.findByTestId('assignee_input');
  expect(screen.getByText('Assignee')).toBeTruthy();
  expect(screen.getByText('Unassigned')).toBeTruthy();
  expect(screen.getByTestId('expo-ui-icon-chevron.up.chevron.down')).toBeTruthy();
  expect(row.props.accessibilityRole).toBe('button');
  expect(row.props.accessibilityValue).toEqual({ text: 'Unassigned' });
  expect(sheet().props.index).toBe(-1);
  expect(screen.queryByTestId('assignee_sheet')).toBeNull();

  await openSheet();
  expect(sheet().props.index).toBe(0);
  expect(screen.getByText('Assign to')).toBeTruthy();
  expect(screen.getByTestId('assignee_close')).toBeTruthy();
  // Unassigned and the pinned option come first, above a hairline the width of the sheet.
  const keys = screen
    .getAllByTestId(/^assignee_option_(no_value|\d+)$/)
    .map((option) => option.props.testID.replace('assignee_option_', ''));
  expect(keys).toEqual(['no_value', '0', '1', '2']);
  expect(screen.getByTestId('assignee_option_no_value_none')).toBeTruthy();
  expect(styleOf(screen.getByTestId('assignee_option_no_value_separator')).left).toBe(56);
  expect(styleOf(screen.getByTestId('assignee_option_0_separator')).left).toBe(0);
  expect(styleOf(screen.getByTestId('assignee_option_1_separator')).left).toBe(56);
  expect(screen.queryByTestId('assignee_option_2_separator')).toBeNull();
  // A short list has no search field and rests at the medium detent.
  expect(screen.queryByTestId('assignee_search')).toBeNull();
  expect(sheet().props.snapPoints).toEqual(['50%']);
  expect(sheet().props.handleComponent).toBeNull();
});

test('a sheet row shows the avatar picture over the initials, and the description', async () => {
  await renderPage({ pageConfig: formPage({ blocks: [assignee()], mirrorKey: 'assignee' }) });
  await openSheet();
  expect(screen.getByTestId('expo-image').props.source).toEqual({
    uri: 'https://img.example/ada.png',
  });
  expect(styleOf(screen.getByTestId('assignee_option_1_glyph')).width).toBe(28);
  // A person without a picture shows their initials.
  expect(screen.getByText('GH')).toBeTruthy();
  expect(screen.getByText('ada@example.com')).toBeTruthy();
  expect(screen.getByTestId('assignee_option_1').props.accessibilityLabel).toBe(
    'Ada Lovelace, ada@example.com'
  );
});

test('picking a row sets the value, fires onChange and closes the sheet', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({ blocks: [assignee()], mirrorKey: 'assignee' }),
  });
  await openSheet();
  expect(screen.getByTestId('assignee_option_no_value').props.accessibilityState).toEqual({
    disabled: false,
    selected: true,
  });
  await press(screen.getByTestId('assignee_option_1'));
  expect(calls).toEqual([{ name: 'change', event: { value: 'ada' } }]);
  expect(sheet().props.index).toBe(-1);
  expect(screen.queryByTestId('assignee_sheet')).toBeNull();
  // The mirror shows the value; the row shows the label and the avatar.
  expect(screen.getByText('ada')).toBeTruthy();
  expect(screen.getByText('Ada Lovelace')).toBeTruthy();
  expect(screen.getByTestId('assignee_glyph')).toBeTruthy();

  await openSheet();
  const chosen = screen.getByTestId('assignee_option_1');
  expect(chosen.props.accessibilityRole).toBe('button');
  expect(chosen.props.accessibilityState).toEqual({ disabled: false, selected: true });
  expect(within(chosen).getByTestId('expo-ui-icon-checkmark').props.color).toBe(
    theme.light.colorPrimary
  );
  expect(screen.getAllByTestId('expo-ui-icon-checkmark')).toHaveLength(1);
  // Picking the chosen row again closes the sheet without a change.
  await press(chosen);
  expect(calls).toHaveLength(1);
  expect(sheet().props.index).toBe(-1);
});

test('picking the no-value row clears the value and fires onClear', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({ blocks: [assignee()], mirrorKey: 'assignee' }),
  });
  await openSheet();
  await press(screen.getByTestId('assignee_option_2'));
  await openSheet();
  await press(screen.getByTestId('assignee_option_no_value'));
  expect(screen.queryByText('grace')).toBeNull();
  expect(calls.map((call) => [call.name, call.event?.value])).toEqual([
    ['change', 'grace'],
    ['change', null],
    ['clear', undefined],
  ]);
});

test('without allowClear a chosen value has no no-value row', async () => {
  await renderPage({
    pageConfig: formPage({ blocks: [assignee({ allowClear: false })], mirrorKey: 'assignee' }),
  });
  await openSheet();
  expect(screen.getByTestId('assignee_option_no_value')).toBeTruthy();
  await press(screen.getByTestId('assignee_option_2'));
  await openSheet();
  expect(screen.queryByTestId('assignee_option_no_value')).toBeNull();
});

test('a long list gets a search field that filters by label, ignoring case and accents', async () => {
  const many = [
    ...people,
    ...['José Núñez', 'Zoë Smit', 'Lin Wei', 'Omar Haddad', 'Priya Nair'].map((name) => ({
      label: name,
      value: name,
      avatar: { name },
    })),
  ];
  await renderPage({
    pageConfig: formPage({ blocks: [assignee({ options: many })], mirrorKey: 'assignee' }),
  });
  await openSheet();
  expect(sheet().props.snapPoints).toBeUndefined();
  expect(sheet().props.handleComponent).toBeUndefined();
  const search = screen.getByTestId('assignee_search');
  expect(search.props.accessibilityLabel).toBe('Search Assign to');
  expect(screen.getByTestId('expo-ui-icon-magnifyingglass')).toBeTruthy();
  // Focusing the field takes the sheet to the large detent.
  await act(async () => {
    fireEvent(search, 'focus');
  });
  expect(sheet().props.index).toBe(1);
  await act(async () => {
    fireEvent.changeText(search, 'JOSE');
  });
  expect(
    screen.getAllByTestId(/^assignee_option_(no_value|\d+)$/).map((row) => row.props.testID)
  ).toEqual(['assignee_option_3']);
  await act(async () => {
    fireEvent.changeText(search, 'nobody');
  });
  expect(screen.getByText('No results')).toBeTruthy();
  await press(screen.getByTestId('assignee_search_clear'));
  expect(screen.getAllByTestId(/^assignee_option_(no_value|\d+)$/).length).toBeGreaterThan(5);
});

test('searchThreshold sets how many options show the search field', async () => {
  await renderPage({
    pageConfig: formPage({ blocks: [assignee({ searchThreshold: 2 })], mirrorKey: 'assignee' }),
  });
  await openSheet();
  expect(screen.getByTestId('assignee_search')).toBeTruthy();
});

test('the close button and a swipe down close the sheet, and the search clears', async () => {
  const many = Array.from({ length: 9 }, (_, index) => `Person ${index}`);
  await renderPage({
    pageConfig: formPage({ blocks: [assignee({ options: many })], mirrorKey: 'assignee' }),
  });
  await openSheet();
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('assignee_search'), 'Person 3');
  });
  await press(screen.getByTestId('assignee_close'));
  expect(sheet().props.index).toBe(-1);
  await openSheet();
  expect(screen.getByTestId('assignee_search').props.value).toBe('');
  await act(async () => {
    fireEvent(sheet(), 'swipeDismiss');
  });
  expect(sheet().props.index).toBe(-1);
  // It opens again.
  await openSheet();
  expect(sheet().props.index).toBe(0);
});

test('a disabled sheet row does not open the sheet', async () => {
  await renderPage({
    pageConfig: formPage({ blocks: [assignee({ disabled: true })], mirrorKey: 'assignee' }),
  });
  const row = await screen.findByTestId('assignee_input');
  expect(row.props.accessibilityState).toMatchObject({ disabled: true });
  expect(styleOf(row).opacity).toBe(0.5);
  await press(row);
  expect(sheet().props.index).toBe(-1);
});

test('a disabled option shows dimmed in the sheet and cannot be picked', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({
      blocks: [
        assignee({ options: [...people, { label: 'Old account', value: 'old', disabled: true }] }),
      ],
      mirrorKey: 'assignee',
    }),
  });
  await openSheet();
  const old = screen.getByTestId('assignee_option_3');
  expect(old.props.accessibilityState).toEqual({ disabled: true, selected: false });
  expect(styleOf(old).opacity).toBe(0.4);
  await press(old);
  expect(calls).toEqual([]);
});

test('options with symbols show their glyphs, and the no-value row its dashed circle', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [
        assignee({
          options: [
            { label: 'Todo', value: 'todo', symbol: 'circle' },
            { label: 'Done', value: 'done', symbol: 'checkmark.circle.fill', iconColor: '#22C55E' },
          ],
        }),
      ],
      mirrorKey: 'assignee',
    }),
  });
  await openSheet();
  expect(screen.getByTestId('expo-ui-icon-checkmark.circle.fill').props.color).toBe('#22C55E');
  expect(screen.getByTestId('assignee_option_no_value_none')).toBeTruthy();
});

test('plain options have no leading space, so the separators sit at the cell inset', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [assignee({ options: ['Red', 'Green', 'Blue'] })],
      mirrorKey: 'assignee',
    }),
  });
  await openSheet();
  expect(screen.queryByTestId('assignee_option_no_value_none')).toBeNull();
  expect(styleOf(screen.getByTestId('assignee_option_0_separator')).left).toBe(16);
});

test('the sheet takes the solid elevated background in dark mode', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: formPage({ blocks: [assignee()], mirrorKey: 'assignee' }),
  });
  await screen.findByTestId('assignee_input');
  expect(sheet().props.backgroundStyle).toEqual({ backgroundColor: '#1C1C1E' });
});

test('a required sheet row shows its message after Validate', async () => {
  await renderPage({
    pageConfig: formPage({ blocks: [{ ...assignee(), required: true }], mirrorKey: 'assignee' }),
  });
  await screen.findByTestId('assignee_input');
  await act(async () => {
    fireEvent.press(screen.getByText('Submit'));
  });
  expect(screen.getByTestId('assignee_feedback')).toBeTruthy();
  await openSheet();
  await press(screen.getByTestId('assignee_option_0'));
  expect(screen.queryByTestId('assignee_feedback')).toBeNull();
});
