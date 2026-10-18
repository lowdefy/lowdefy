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

import renderPage from '../../test/renderPage.js';

function buttonPage(button) {
  return { id: 'form', type: 'Box', blocks: [button] };
}

test('a Button runs its onClick actions when pressed', async () => {
  const record = [];
  await renderPage({
    actions: { Record: ({ params }) => record.push(params) },
    pageConfig: buttonPage({
      id: 'save',
      type: 'Button',
      properties: { title: 'Save' },
      events: { onClick: [{ id: 'record', type: 'Record', params: 'saved' }] },
    }),
  });
  await act(async () => {
    fireEvent.press(await screen.findByText('Save'));
  });
  expect(record).toEqual(['saved']);
  expect(screen.getByTestId('save_button').props.accessibilityLabel).toBe('Save');
});

test('a Button shows a spinner and is disabled while onClick runs', async () => {
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await renderPage({
    actions: { Hold: () => held },
    pageConfig: buttonPage({
      id: 'save',
      type: 'Button',
      properties: { title: 'Save' },
      events: { onClick: [{ id: 'hold', type: 'Hold' }] },
    }),
  });
  await screen.findByText('Save');
  expect(screen.queryByTestId('save_loading')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByTestId('save_button'));
  });
  expect(screen.getByTestId('save_loading')).toBeTruthy();
  expect(screen.getByTestId('save_button').props.accessibilityState).toEqual({
    busy: true,
    disabled: true,
  });
  await act(async () => {
    release();
    await held;
  });
  expect(screen.queryByTestId('save_loading')).toBeNull();
  expect(screen.getByTestId('save_button').props.accessibilityState.disabled).toBe(false);
});

test('a disabled Button does not run onClick', async () => {
  const record = [];
  await renderPage({
    actions: { Record: ({ params }) => record.push(params) },
    pageConfig: buttonPage({
      id: 'save',
      type: 'Button',
      properties: { title: 'Save', disabled: true },
      events: { onClick: [{ id: 'record', type: 'Record', params: 'saved' }] },
    }),
  });
  await act(async () => {
    fireEvent.press(await screen.findByText('Save'));
  });
  expect(record).toEqual([]);
});

test('a Button without a title shows its block id', async () => {
  await renderPage({ pageConfig: buttonPage({ id: 'go', type: 'Button' }) });
  expect(await screen.findByText('go')).toBeTruthy();
});
