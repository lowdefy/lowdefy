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

import { renderPage } from '../../test/renderPage.js';

function itemPage(item) {
  return { id: 'form', type: 'Box', blocks: [item] };
}

test('a ListItem shows its title, description, detail and avatar text', async () => {
  await renderPage({
    pageConfig: itemPage({
      id: 'ada',
      type: 'ListItem',
      properties: {
        title: 'Ada Lovelace',
        description: 'Engineer',
        extra: '3',
        avatar: { content: 'AL' },
      },
    }),
  });
  expect(await screen.findByText('Ada Lovelace')).toBeTruthy();
  expect(screen.getByText('Engineer')).toBeTruthy();
  expect(screen.getByText('3')).toBeTruthy();
  expect(screen.getByText('AL')).toBeTruthy();
  // Not pressable, so no chevron.
  expect(screen.queryByTestId('ada_chevron')).toBeNull();
});

test('a ListItem with onClick shows a chevron and runs onClick when pressed', async () => {
  const record = [];
  await renderPage({
    actions: { Record: ({ params }) => record.push(params) },
    pageConfig: itemPage({
      id: 'ada',
      type: 'ListItem',
      properties: { title: 'Ada' },
      events: { onClick: [{ id: 'record', type: 'Record', params: 'opened' }] },
    }),
  });
  expect(await screen.findByTestId('ada_chevron')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('ada_item'));
  });
  expect(record).toEqual(['opened']);
});
