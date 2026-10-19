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

const labelOptions = [
  { label: 'agent-rules', value: 'agent-rules' },
  { label: 'ui', value: 'ui' },
  { label: 'docs', value: 'docs' },
  { label: 'api', value: 'api' },
];

function labels(properties = {}, rest = {}) {
  return {
    id: 'labels',
    type: 'MultipleSelector',
    properties: {
      title: 'Labels',
      variant: 'sheet',
      menuTitle: 'Labels',
      options: labelOptions,
      ...properties,
    },
    events: { onChange: record('change'), onOpenChange: record('open') },
    ...rest,
  };
}

function sheet() {
  return screen.getByTestId('expo-ui-bottom-sheet');
}

function optionKeys() {
  return screen
    .getAllByTestId(/^labels_option_(create|\d+)$/)
    .map((option) => option.props.testID.replace('labels_option_', ''));
}

async function openSheet() {
  await press(await screen.findByTestId('labels_input'));
}

// A copy of the labels the row measures, which screen readers do not see.
function measure(testID) {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

function changes(calls) {
  return calls.filter((call) => call.name === 'change').map((call) => call.event.value);
}

test('the sheet variant is a row with the title and the placeholder that opens a sheet', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({ blocks: [labels()], mirrorKey: 'labels' }),
  });
  const input = await screen.findByTestId('labels_input');
  expect(screen.getByText('Labels')).toBeTruthy();
  expect(screen.getByText('None')).toBeTruthy();
  expect(screen.getByTestId('expo-ui-icon-chevron.up.chevron.down')).toBeTruthy();
  expect(input.props.accessibilityRole).toBe('button');
  expect(input.props.accessibilityLabel).toBe('Labels');
  expect(input.props.accessibilityValue).toEqual({ text: 'None' });
  expect(sheet().props.index).toBe(-1);

  await openSheet();
  expect(sheet().props.index).toBe(0);
  expect(within(screen.getByTestId('labels_sheet')).getByText('Labels')).toBeTruthy();
  expect(screen.getByTestId('labels_done')).toBeTruthy();
  expect(screen.queryByTestId('labels_close')).toBeNull();
  expect(optionKeys()).toEqual(['0', '1', '2', '3']);
  // No no-value row, and no search field for a short list.
  expect(screen.queryByTestId('labels_option_no_value')).toBeNull();
  expect(screen.queryByTestId('labels_search')).toBeNull();
  const row = screen.getByTestId('labels_option_1');
  expect(row.props.accessibilityRole).toBe('checkbox');
  expect(row.props.accessibilityState).toEqual({ checked: false, disabled: false });
  expect(calls).toEqual([{ name: 'open', event: { open: true } }]);
});

test('toggling checks options without closing, and onChange fires once on Done', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({ blocks: [labels()], mirrorKey: 'labels' }),
  });
  await openSheet();
  await press(screen.getByTestId('labels_option_1'));
  await press(screen.getByTestId('labels_option_3'));
  expect(sheet().props.index).toBe(0);
  expect(changes(calls)).toEqual([]);
  const checked = screen.getByTestId('labels_option_1');
  expect(checked.props.accessibilityState).toEqual({ checked: true, disabled: false });
  expect(within(checked).getByTestId('expo-ui-icon-checkmark').props.color).toBe(
    theme.light.colorPrimary
  );
  expect(screen.getAllByTestId('expo-ui-icon-checkmark')).toHaveLength(2);
  // The row shows the checked labels while the sheet is open.
  expect(screen.getByTestId('labels_input').props.accessibilityValue).toEqual({ text: 'ui, api' });

  await press(screen.getByTestId('labels_done'));
  expect(sheet().props.index).toBe(-1);
  expect(changes(calls)).toEqual([['ui', 'api']]);
  expect(calls.at(-1)).toEqual({ name: 'open', event: { open: false } });
  expect(screen.getByText('ui, api')).toBeTruthy();
});

test('the chosen options are listed first when the sheet opens, not while toggling', async () => {
  await renderPage({
    pageConfig: formPage({ blocks: [labels()], mirrorKey: 'labels' }),
  });
  await openSheet();
  await press(screen.getByTestId('labels_option_2'));
  await press(screen.getByTestId('labels_option_3'));
  expect(optionKeys()).toEqual(['0', '1', '2', '3']);
  await press(screen.getByTestId('labels_done'));
  await openSheet();
  expect(optionKeys()).toEqual(['2', '3', '0', '1']);
  // Unchecking a chosen option keeps its place.
  await press(screen.getByTestId('labels_option_2'));
  expect(optionKeys()).toEqual(['2', '3', '0', '1']);
});

test('closing with the same set of values fires no onChange', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({ blocks: [labels()], mirrorKey: 'labels' }),
  });
  await openSheet();
  await press(screen.getByTestId('labels_option_0'));
  await press(screen.getByTestId('labels_option_0'));
  await press(screen.getByTestId('labels_done'));
  expect(changes(calls)).toEqual([]);
});

test('a swipe down and the screen being hidden close the sheet and set the value', async () => {
  const { calls, setFocused } = await renderPage({
    pageConfig: formPage({ blocks: [labels()], mirrorKey: 'labels' }),
  });
  await openSheet();
  await press(screen.getByTestId('labels_option_0'));
  await act(async () => {
    fireEvent(sheet(), 'swipeDismiss');
  });
  expect(sheet().props.index).toBe(-1);
  expect(changes(calls)).toEqual([['agent-rules']]);

  await openSheet();
  await press(screen.getByTestId('labels_option_1'));
  await setFocused(false);
  expect(sheet().props.index).toBe(-1);
  expect(changes(calls)).toEqual([['agent-rules'], ['agent-rules', 'ui']]);
  expect(calls.filter((call) => call.name === 'open').map((call) => call.event.open)).toEqual([
    true,
    false,
    true,
    false,
  ]);
});

test('changeOn toggle sets the value and fires onChange on each toggle', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({ blocks: [labels({ changeOn: 'toggle' })], mirrorKey: 'labels' }),
  });
  await openSheet();
  await press(screen.getByTestId('labels_option_1'));
  await press(screen.getByTestId('labels_option_2'));
  await press(screen.getByTestId('labels_option_1'));
  expect(changes(calls)).toEqual([['ui'], ['ui', 'docs'], ['docs']]);
  await press(screen.getByTestId('labels_done'));
  expect(changes(calls)).toHaveLength(3);
  expect(screen.getByTestId('labels_input').props.accessibilityValue).toEqual({ text: 'docs' });
});

test('allowCreate adds the search text as a new value that stays an option', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({
      blocks: [
        labels({
          allowCreate: true,
          createPattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
          createPatternMessage: 'Use lowercase letters, digits and hyphens.',
        }),
      ],
      mirrorKey: 'labels',
    }),
  });
  await openSheet();
  // The search field shows for a short list, to type a new value in.
  const search = screen.getByTestId('labels_search');
  expect(search.props.placeholder).toBe('Search or add');
  await act(async () => {
    fireEvent.changeText(search, 'Needs Design');
  });
  const refused = screen.getByTestId('labels_option_create');
  expect(screen.getByText('Add “Needs Design”')).toBeTruthy();
  expect(screen.getByText('Use lowercase letters, digits and hyphens.')).toBeTruthy();
  expect(refused.props.accessibilityState).toEqual({ disabled: true, selected: false });
  expect(styleOf(refused).opacity).toBe(1);
  await press(refused);

  // Text that is an option adds nothing.
  await act(async () => {
    fireEvent.changeText(search, 'UI');
  });
  expect(screen.queryByTestId('labels_option_create')).toBeNull();

  await act(async () => {
    fireEvent.changeText(search, 'needs-design');
  });
  expect(screen.getByText('Add “needs-design”')).toBeTruthy();
  await press(screen.getByTestId('labels_option_create'));
  // The search clears, and the new value is checked with the options chosen when the sheet opened.
  expect(screen.getByTestId('labels_search').props.value).toBe('');
  expect(optionKeys()).toEqual(['4', '0', '1', '2', '3']);
  expect(screen.getByTestId('labels_option_4').props.accessibilityState).toEqual({
    checked: true,
    disabled: false,
  });
  await press(screen.getByTestId('labels_done'));
  expect(changes(calls)).toEqual([['needs-design']]);

  // It stays an option once unchecked.
  await openSheet();
  await press(screen.getByTestId('labels_option_4'));
  await press(screen.getByTestId('labels_done'));
  expect(changes(calls)).toEqual([['needs-design'], []]);
  await openSheet();
  expect(screen.getByText('needs-design')).toBeTruthy();
});

test('the search key adds the search text', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({ blocks: [labels({ allowCreate: true })], mirrorKey: 'labels' }),
  });
  await openSheet();
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('labels_search'), 'release');
  });
  await act(async () => {
    fireEvent(screen.getByTestId('labels_search'), 'submitEditing');
  });
  await press(screen.getByTestId('labels_done'));
  expect(changes(calls)).toEqual([['release']]);
});

test('a chosen value no option holds shows in the row and can be unchecked', async () => {
  const { calls } = await renderPage({
    pageConfig: {
      ...formPage({ blocks: [labels()], mirrorKey: 'labels' }),
      events: {
        onInit: [{ id: 'seed', type: 'SetState', params: { labels: ['legacy', 'ui'] } }],
      },
    },
  });
  expect((await screen.findByTestId('labels_input')).props.accessibilityValue).toEqual({
    text: 'legacy, ui',
  });
  await openSheet();
  expect(optionKeys()).toEqual(['1', '4', '0', '2', '3']);
  await press(screen.getByTestId('labels_option_4'));
  await press(screen.getByTestId('labels_done'));
  expect(changes(calls)).toEqual([['ui']]);
});

test('maxCount disables the unchosen options once reached', async () => {
  await renderPage({
    pageConfig: formPage({ blocks: [labels({ maxCount: 2 })], mirrorKey: 'labels' }),
  });
  await openSheet();
  await press(screen.getByTestId('labels_option_0'));
  await press(screen.getByTestId('labels_option_1'));
  const other = screen.getByTestId('labels_option_2');
  expect(other.props.accessibilityState).toEqual({ checked: false, disabled: true });
  expect(styleOf(other).opacity).toBe(0.4);
  await press(screen.getByTestId('labels_option_1'));
  expect(screen.getByTestId('labels_option_2').props.accessibilityState.disabled).toBe(false);
});

test('a disabled option shows dimmed and cannot be toggled', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({
      blocks: [
        labels({ options: [...labelOptions, { label: 'old', value: 'old', disabled: true }] }),
      ],
      mirrorKey: 'labels',
    }),
  });
  await openSheet();
  await press(screen.getByTestId('labels_option_4'));
  await press(screen.getByTestId('labels_done'));
  expect(changes(calls)).toEqual([]);
});

test('options show their descriptions and glyphs', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [
        labels({
          options: [
            { label: 'Bug', value: 'bug', symbol: 'ladybug', iconColor: '#EF4444' },
            { label: 'Feature', value: 'feature', description: 'New behaviour' },
          ],
        }),
      ],
      mirrorKey: 'labels',
    }),
  });
  await openSheet();
  expect(screen.getByTestId('expo-ui-icon-ladybug').props.color).toBe('#EF4444');
  expect(screen.getByText('New behaviour')).toBeTruthy();
  expect(screen.getByTestId('labels_option_1').props.accessibilityLabel).toBe(
    'Feature, New behaviour'
  );
});

test('labels that overflow the row end in a count of the rest', async () => {
  await renderPage({
    pageConfig: {
      ...formPage({ blocks: [labels()], mirrorKey: 'labels' }),
      events: {
        onInit: [
          {
            id: 'seed',
            type: 'SetState',
            params: { labels: ['agent-rules', 'ui', 'docs', 'api'] },
          },
        ],
      },
    },
  });
  const value = await screen.findByTestId('labels_value');
  expect(within(value).getByText('agent-rules, ui, docs, api')).toBeTruthy();
  await act(async () => {
    fireEvent(value, 'layout', { nativeEvent: { layout: { width: 160 } } });
  });
  await act(async () => {
    fireEvent(measure('labels_value_measure_suffix'), 'layout', {
      nativeEvent: { layout: { width: 24 } },
    });
  });
  await act(async () => {
    fireEvent(measure('labels_value_measure_whole'), 'textLayout', {
      nativeEvent: { lines: [{ text: 'agent-rules, ui, ' }, { text: 'docs, api' }] },
    });
  });
  expect(styleOf(measure('labels_value_measure')).width).toBe(136);
  await act(async () => {
    fireEvent(measure('labels_value_measure'), 'textLayout', {
      nativeEvent: { lines: [{ text: 'agent-rules, ui, ' }, { text: 'docs, api' }] },
    });
  });
  expect(within(value).getByText('agent-rules, ui')).toBeTruthy();
  expect(within(value).getByText(' +2')).toBeTruthy();
  // A screen reader hears every label.
  expect(screen.getByTestId('labels_input').props.accessibilityValue).toEqual({
    text: 'agent-rules, ui, docs, api',
  });
});

test('labels that fit the whole row show without a count', async () => {
  await renderPage({
    pageConfig: {
      ...formPage({ blocks: [labels()], mirrorKey: 'labels' }),
      events: {
        onInit: [{ id: 'seed', type: 'SetState', params: { labels: ['ui', 'api'] } }],
      },
    },
  });
  const value = await screen.findByTestId('labels_value');
  await act(async () => {
    fireEvent(value, 'layout', { nativeEvent: { layout: { width: 160 } } });
  });
  await act(async () => {
    fireEvent(measure('labels_value_measure_suffix'), 'layout', {
      nativeEvent: { layout: { width: 24 } },
    });
  });
  await act(async () => {
    fireEvent(measure('labels_value_measure_whole'), 'textLayout', {
      nativeEvent: { lines: [{ text: 'ui, api' }] },
    });
  });
  // Labels that fit need no measure of the room beside the count.
  expect(screen.queryByTestId('labels_value_measure', { includeHiddenElements: true })).toBeNull();
  expect(within(value).getByText('ui, api')).toBeTruthy();
  expect(within(value).queryByText(/\+/)).toBeNull();
});

test('without the sheet variant the field is a box under the title', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({ blocks: [labels({ variant: undefined })], mirrorKey: 'labels' }),
  });
  const input = await screen.findByTestId('labels_input');
  // The Label draws the title above the box.
  expect(screen.getByText('Labels')).toBeTruthy();
  expect(screen.queryByTestId('labels_row')).toBeNull();
  expect(input.props.accessibilityValue).toEqual({ text: 'Select items' });
  expect(screen.getByText('Select items')).toBeTruthy();
  expect(styleOf(input).minHeight).toBeGreaterThan(0);
  await openSheet();
  await press(screen.getByTestId('labels_option_2'));
  await press(screen.getByTestId('labels_done'));
  expect(changes(calls)).toEqual([['docs']]);
  expect(within(screen.getByTestId('labels_value')).getByText('docs')).toBeTruthy();
});

test('a disabled field does not open the sheet', async () => {
  await renderPage({
    pageConfig: formPage({ blocks: [labels({ disabled: true })], mirrorKey: 'labels' }),
  });
  const input = await screen.findByTestId('labels_input');
  expect(input.props.accessibilityState).toMatchObject({ disabled: true });
  await press(input);
  expect(sheet().props.index).toBe(-1);
});

test('a long list gets a search field', async () => {
  const many = Array.from({ length: 9 }, (_, index) => `label-${index}`);
  await renderPage({
    pageConfig: formPage({ blocks: [labels({ options: many })], mirrorKey: 'labels' }),
  });
  await openSheet();
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('labels_search'), 'label-3');
  });
  expect(optionKeys()).toEqual(['3']);
  // Toggling a match keeps the search.
  await press(screen.getByTestId('labels_option_3'));
  expect(screen.getByTestId('labels_search').props.value).toBe('label-3');
});

test('a required row shows the required mark before its title', async () => {
  await renderPage({
    pageConfig: formPage({ blocks: [labels({}, { required: true })], mirrorKey: 'labels' }),
  });
  const row = await screen.findByTestId('labels_row');
  expect(within(row).getByText('*', { exact: false })).toBeTruthy();
});
