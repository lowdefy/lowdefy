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

import { act, fireEvent } from '@testing-library/react-native';

import formPage from '../../test/formPage.js';
import { record, renderPage, screen } from '../../test/renderPage.js';

const status = {
  id: 'status',
  type: 'Selector',
  properties: {
    title: 'Status',
    variant: 'menu',
    placeholder: 'None',
    options: [
      { label: 'Todo', value: 'todo', symbol: 'circle', icon: 'Circle' },
      {
        label: 'In progress',
        value: 'in_progress',
        symbol: 'circle.lefthalf.filled',
        iconColor: '#F59E0B',
      },
      { label: 'Ada', value: 'ada', avatar: { name: 'Ada Lovelace' } },
    ],
  },
  events: { onChange: record('change'), onClear: record('clear') },
};

async function pick(id) {
  await act(async () => {
    fireEvent(screen.getByTestId('status_input'), 'pressAction', { nativeEvent: { event: id } });
  });
}

test('the menu variant is a row that opens a native menu of the options', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({ blocks: [status], mirrorKey: 'status' }),
  });
  const menu = await screen.findByTestId('status_input');
  expect(screen.getByText('Status')).toBeTruthy();
  expect(screen.getByText('None')).toBeTruthy();
  expect(screen.getByTestId('expo-ui-icon-chevron.up.chevron.down')).toBeTruthy();
  expect(menu.props.actions.map((action) => [action.title, action.state])).toEqual([
    ['None', 'on'],
    ['Todo', 'off'],
    ['In progress', 'off'],
    ['Ada', 'off'],
  ]);
  await pick('1');
  expect(calls).toEqual([{ name: 'change', event: { value: 'in_progress' } }]);
  // The mirror shows the value; the row shows the label and the option's glyph.
  expect(screen.getByText('in_progress')).toBeTruthy();
  expect(screen.getByText('In progress')).toBeTruthy();
  expect(screen.getByTestId('expo-ui-icon-circle.lefthalf.filled').props.color).toBe('#F59E0B');
  expect(screen.getByTestId('status_input').props.actions[2].state).toBe('on');
});

test('an option with an avatar shows its initials in the row', async () => {
  await renderPage({ pageConfig: formPage({ blocks: [status], mirrorKey: 'status' }) });
  await screen.findByTestId('status_input');
  await pick('2');
  expect(screen.getByText('AL')).toBeTruthy();
});

test('an option with an avatar picture shows the picture in the row', async () => {
  const withPicture = {
    ...status,
    properties: {
      ...status.properties,
      options: [
        {
          label: 'Bo',
          value: 'bo',
          avatar: { name: 'Bo Smit', src: 'https://img.example/bo.png' },
        },
      ],
    },
  };
  await renderPage({ pageConfig: formPage({ blocks: [withPicture], mirrorKey: 'status' }) });
  await screen.findByTestId('status_input');
  await pick('0');
  expect(screen.getByTestId('expo-image').props.source).toEqual({
    uri: 'https://img.example/bo.png',
  });
});

test('the placeholder item clears the value and fires onClear', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage({ blocks: [status], mirrorKey: 'status' }),
  });
  await screen.findByTestId('status_input');
  await pick('0');
  await pick('no_value');
  expect(screen.queryByText('todo')).toBeNull();
  expect(calls.map((call) => call.name)).toEqual(['change', 'change', 'clear']);
});

test('a required menu row shows its message after Validate', async () => {
  await renderPage({
    pageConfig: formPage({ blocks: [{ ...status, required: true }], mirrorKey: 'status' }),
  });
  await screen.findByTestId('status_input');
  await act(async () => {
    fireEvent.press(screen.getByText('Submit'));
  });
  expect(screen.getByTestId('status_feedback')).toBeTruthy();
  await pick('0');
  expect(screen.queryByTestId('status_feedback')).toBeNull();
});
