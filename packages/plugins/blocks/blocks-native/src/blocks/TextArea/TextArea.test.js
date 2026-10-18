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

test('typing in a TextArea sets its value in state', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [{ id: 'notes', type: 'TextArea', properties: { rows: 4 } }],
      mirrorKey: 'notes',
    }),
  });
  const input = await screen.findByTestId('notes_input');
  expect(input.props.multiline).toBe(true);
  await act(async () => {
    fireEvent.changeText(input, 'Line one\nLine two');
  });
  expect(screen.getByText('Line one\nLine two')).toBeTruthy();
});

test('a required TextArea shows its message after Validate', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [{ id: 'notes', type: 'TextArea', required: true }],
      mirrorKey: 'notes',
    }),
  });
  await screen.findByTestId('notes_input');
  expect(screen.queryByTestId('notes_feedback')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByText('Submit'));
  });
  expect(screen.getByTestId('notes_feedback')).toBeTruthy();
});

test('showCount counts the characters out of maxLength', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [{ id: 'notes', type: 'TextArea', properties: { maxLength: 20, showCount: true } }],
      mirrorKey: 'notes',
    }),
  });
  await act(async () => {
    fireEvent.changeText(await screen.findByTestId('notes_input'), 'Hello');
  });
  expect(screen.getByText('5 / 20')).toBeTruthy();
});
