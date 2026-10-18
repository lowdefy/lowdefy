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

import { page, record, renderPage, screen } from '../../test/renderPage.js';

const tabs = {
  id: 'scope',
  type: 'SegmentedControl',
  properties: {
    title: 'Scope',
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Mine', value: { mine: true } },
      { label: 'All', value: 'all' },
    ],
  },
  events: { onChange: record('change') },
};

function scopePage(block = tabs) {
  return page([
    block,
    {
      id: 'mirror',
      type: 'Paragraph',
      properties: { content: { _string: [{ _state: 'scope' }] } },
    },
  ]);
}

test('picking a segment sets its value and fires onChange', async () => {
  const { calls } = await renderPage({ pageConfig: scopePage() });
  const control = await screen.findByTestId('scope_input');
  expect(control.props.values).toEqual(['Open', 'Mine', 'All']);
  expect(control.props.selectedIndex).toBe(-1);
  expect(control.props.enabled).toBe(true);
  await act(async () => {
    fireEvent(control, 'change', { nativeEvent: { selectedSegmentIndex: 1, value: 'Mine' } });
  });
  expect(screen.getByTestId('scope_input').props.selectedIndex).toBe(1);
  expect(calls).toEqual([{ name: 'change', event: { value: { mine: true } } }]);
  // Picking the segment already picked changes nothing.
  await act(async () => {
    fireEvent(screen.getByTestId('scope_input'), 'change', {
      nativeEvent: { selectedSegmentIndex: 1, value: 'Mine' },
    });
  });
  expect(calls).toHaveLength(1);
});

test('the control takes the primary colour and mode, and can be disabled', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: scopePage({ ...tabs, properties: { ...tabs.properties, disabled: true } }),
  });
  const control = await screen.findByTestId('scope_input');
  expect(control.props.appearance).toBe('dark');
  expect(control.props.enabled).toBe(false);
  expect(control.props.tintColor).toBeTruthy();
});
