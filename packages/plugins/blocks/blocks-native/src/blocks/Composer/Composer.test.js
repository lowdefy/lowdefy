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
import { renderPage } from '../../test/renderPage.js';

const mentions = [
  { value: 'u1', label: 'Sam Tolmay', sees: true },
  { value: 'u2', label: 'Samantha Hidden', sees: false },
];

async function type(input, text, cursor = text.length) {
  await act(async () => {
    fireEvent(input, 'selectionChange', {
      nativeEvent: { selection: { start: cursor - 1, end: cursor - 1 } },
    });
    fireEvent.changeText(input, text);
    fireEvent(input, 'selectionChange', {
      nativeEvent: { selection: { start: cursor, end: cursor } },
    });
  });
}

test('a Composer offers people who see the record for an @ and stores the picked mention token', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [{ id: 'comment', type: 'Composer', properties: { mentions } }],
      mirrorKey: 'comment',
    }),
  });
  const input = await screen.findByTestId('comment_input');
  await type(input, 'Thanks @sa');
  expect(screen.getByLabelText('Mention Sam Tolmay')).toBeTruthy();
  expect(screen.queryByLabelText('Mention Samantha Hidden')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Mention Sam Tolmay'));
  });
  expect(screen.getByText('Thanks [[user:u1]]')).toBeTruthy();
  expect(screen.getByText('@Sam Tolmay')).toBeTruthy();
  expect(screen.queryByTestId('composer_suggestions')).toBeNull();
});

test('a Composer sends the body and reply_to with onSubmit and clears when the actions succeed', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [
        {
          id: 'comment',
          type: 'Composer',
          properties: { replyTo: { id: 'c1', name: 'Ada' } },
          events: {
            onSubmit: [
              {
                id: 'sent',
                type: 'SetState',
                params: { sent: { _event: 'body' }, to: { _event: 'reply_to' } },
              },
            ],
          },
        },
        { id: 'sent_text', type: 'Paragraph', properties: { content: { _state: 'sent' } } },
        { id: 'to_text', type: 'Paragraph', properties: { content: { _state: 'to' } } },
      ],
      mirrorKey: 'comment',
    }),
  });
  expect(screen.getByText('Ada')).toBeTruthy();
  const send = screen.getByTestId('composer_send');
  expect(send.props.accessibilityState.disabled).toBe(true);
  await type(await screen.findByTestId('comment_input'), 'Looks good');
  expect(screen.getByTestId('composer_send').props.accessibilityState.disabled).toBe(false);
  await act(async () => {
    fireEvent.press(screen.getByTestId('composer_send'));
  });
  expect(screen.getByText('Looks good')).toBeTruthy();
  expect(screen.getByText('c1')).toBeTruthy();
  expect(screen.getByTestId('composer_send').props.accessibilityState.disabled).toBe(true);
});

test('a Composer keeps its text when the onSubmit actions fail', async () => {
  await renderPage({
    actions: {
      Fail: () => {
        throw new Error('Offline');
      },
    },
    pageConfig: formPage({
      blocks: [
        {
          id: 'comment',
          type: 'Composer',
          events: { onSubmit: [{ id: 'fail', type: 'Fail' }] },
        },
      ],
      mirrorKey: 'comment',
    }),
  });
  await type(await screen.findByTestId('comment_input'), 'Draft');
  await act(async () => {
    fireEvent.press(screen.getByTestId('composer_send'));
  });
  // The input and the mirror of the value both still hold it.
  expect(screen.getAllByText('Draft')).toHaveLength(2);
  expect(screen.getByTestId('composer_send').props.accessibilityState.disabled).toBe(false);
});

test('a Composer asks for record links after [[ and writes the picked key', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [
        {
          id: 'comment',
          type: 'Composer',
          properties: { links: [{ key: 'PEL-12', kind: 'task', title: 'Fix the rail' }] },
          events: {
            onLinkSearch: [{ id: 'q', type: 'SetState', params: { q: { _event: 'query' } } }],
          },
        },
        { id: 'q_text', type: 'Paragraph', properties: { content: { _state: 'q' } } },
      ],
      mirrorKey: 'comment',
    }),
  });
  jest.useFakeTimers();
  await type(await screen.findByTestId('comment_input'), 'See [[pel');
  await act(async () => {
    jest.advanceTimersByTime(250);
  });
  jest.useRealTimers();
  expect(screen.getByText('pel')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Link PEL-12 Fix the rail'));
  });
  expect(screen.getByText('See [[PEL-12]]')).toBeTruthy();
});
