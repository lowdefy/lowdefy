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

import { act, fireEvent, screen } from '@testing-library/react-native';

import formPage from '../../test/formPage.js';
import renderPage from '../../test/renderPage.js';

const colours = {
  id: 'colour',
  type: 'Selector',
  properties: {
    title: 'Colour',
    options: [
      { label: '<b>Red</b>', value: 'red' },
      { label: 'Green', value: 'green' },
      { label: 'Blue', value: 'blue', disabled: true },
    ],
  },
};

test('picking an option sets its value', async () => {
  await renderPage({ pageConfig: formPage({ blocks: [colours], mirrorKey: 'colour' }) });
  const picker = await screen.findByTestId('colour_input');
  // Labels are plain text; the disabled option is left out; the placeholder stands for no value.
  expect(picker.props.items.map((item) => item.label)).toEqual(['Select item', 'Red', 'Green']);
  expect(picker.props.selectedValue).toBe(-1);
  await act(async () => {
    fireEvent(picker, 'valueChange', 1);
  });
  expect(screen.getByText('green')).toBeTruthy();
  expect(screen.getByTestId('colour_input').props.selectedValue).toBe(1);
});

test('options can hold any value, matched by content', async () => {
  const record = [];
  await renderPage({
    actions: { Record: ({ params }) => record.push(params) },
    pageConfig: formPage({
      blocks: [
        {
          id: 'user',
          type: 'Selector',
          properties: {
            options: [
              { label: 'Ada', value: { id: 1, name: 'Ada' } },
              { label: 'Grace', value: { id: 2, name: 'Grace' } },
            ],
          },
          events: { onChange: [{ id: 'record', type: 'Record', params: { _event: 'value' } }] },
        },
      ],
      mirrorKey: 'user.name',
    }),
  });
  await act(async () => {
    fireEvent(await screen.findByTestId('user_input'), 'valueChange', 1);
  });
  expect(record).toEqual([{ id: 2, name: 'Grace' }]);
  // The picker's own item and the Paragraph showing user.name.
  expect(screen.getAllByText('Grace')).toHaveLength(2);
  expect(screen.getByTestId('user_input').props.selectedValue).toBe(1);
});

test('picking the placeholder clears the value and fires onClear', async () => {
  const record = [];
  await renderPage({
    actions: { Record: ({ params }) => record.push(params) },
    pageConfig: formPage({
      blocks: [
        {
          ...colours,
          events: { onClear: [{ id: 'record', type: 'Record', params: 'cleared' }] },
        },
      ],
      mirrorKey: 'colour',
    }),
  });
  await act(async () => {
    fireEvent(await screen.findByTestId('colour_input'), 'valueChange', 0);
  });
  expect(screen.getByText('red')).toBeTruthy();
  await act(async () => {
    fireEvent(screen.getByTestId('colour_input'), 'valueChange', -1);
  });
  expect(screen.queryByText('red')).toBeNull();
  expect(record).toEqual(['cleared']);
});

test('a required Selector shows its message after Validate', async () => {
  await renderPage({
    pageConfig: formPage({ blocks: [{ ...colours, required: true }], mirrorKey: 'colour' }),
  });
  await screen.findByTestId('colour_input');
  await act(async () => {
    fireEvent.press(screen.getByText('Submit'));
  });
  expect(screen.getByTestId('colour_feedback')).toBeTruthy();
  await act(async () => {
    fireEvent(screen.getByTestId('colour_input'), 'valueChange', 0);
  });
  expect(screen.queryByTestId('colour_feedback')).toBeNull();
});

test('the picker host takes the theme primary colour and mode', async () => {
  await renderPage({ pageConfig: formPage({ blocks: [colours], mirrorKey: 'colour' }) });
  await screen.findByTestId('colour_input');
  const host = screen.getByTestId('expo-ui-host');
  expect(host.props.seedColor).toBe('#1677ff');
  expect(host.props.colorScheme).toBe('light');
});
