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

function switchPage(block) {
  return formPage({
    blocks: [
      block,
      {
        id: 'agree_text',
        type: 'Paragraph',
        properties: { content: { _if: { test: { _state: 'agree' }, then: 'On', else: 'Off' } } },
      },
    ],
    mirrorKey: 'nothing',
  });
}

test('a Switch starts off and toggling it sets true in state', async () => {
  await renderPage({ pageConfig: switchPage({ id: 'agree', type: 'Switch' }) });
  const toggle = await screen.findByTestId('agree_input');
  expect(toggle.props.value).toBe(false);
  expect(screen.getByText('Off')).toBeTruthy();
  await act(async () => {
    fireEvent(toggle, 'valueChange', true);
  });
  expect(screen.getByText('On')).toBeTruthy();
  expect(screen.getByTestId('agree_input').props.value).toBe(true);
});

test('a Switch shows its checked and unchecked text', async () => {
  await renderPage({
    pageConfig: switchPage({
      id: 'agree',
      type: 'Switch',
      properties: { checkedText: 'Yes', uncheckedText: 'No', color: '#00aa00' },
    }),
  });
  expect(await screen.findByText('No')).toBeTruthy();
  expect(screen.getByTestId('expo-ui-host').props.seedColor).toBe('#00aa00');
  await act(async () => {
    fireEvent(screen.getByTestId('agree_input'), 'valueChange', true);
  });
  expect(screen.getByText('Yes')).toBeTruthy();
});

test('a disabled Switch passes disabled to the platform switch', async () => {
  await renderPage({
    pageConfig: switchPage({ id: 'agree', type: 'Switch', properties: { disabled: true } }),
  });
  expect((await screen.findByTestId('agree_input')).props.disabled).toBe(true);
});
