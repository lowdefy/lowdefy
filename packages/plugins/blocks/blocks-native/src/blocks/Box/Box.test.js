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

import { page, press, record, renderPage, screen, styleOf, theme } from '../../test/renderPage.js';

test('a Box draws its content slot, with the block id as its testID', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'panel',
        type: 'Box',
        blocks: [{ id: 'inner', type: 'Box', properties: { content: 'Inside' } }],
      },
    ]),
  });
  expect(await screen.findByText('Inside')).toBeTruthy();
  expect(screen.getByTestId('panel')).toBeTruthy();
  expect(screen.getByTestId('panel').props.accessibilityLabel).toBe('panel');
  expect(screen.getByTestId('inner')).toBeTruthy();
});

test('a Box content string is drawn in the theme text colour, and in dark mode', async () => {
  await renderPage({ pageConfig: page([{ id: 'a', type: 'Box', properties: { content: 'Hi' } }]) });
  expect(styleOf(await screen.findByText('Hi')).color).toBe(theme.light.colorText);
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([{ id: 'a', type: 'Box', properties: { content: 'Hi' } }]),
  });
  expect(styleOf(await screen.findByText('Hi')).color).toBe(theme.dark.colorText);
});

test('a Box with onClick is a button that fires onClick', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'tap',
        type: 'Box',
        properties: { content: 'Tap me' },
        style: { element: { padding: 8 } },
        events: { onClick: record('click') },
      },
    ]),
  });
  const button = await screen.findByRole('button');
  expect(styleOf(button).padding).toBe(8);
  await press(screen.getByText('Tap me'));
  expect(calls.map((call) => call.name)).toEqual(['click']);
});

test('a Box evaluated visible false is not drawn', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'shown', type: 'Box', properties: { content: 'Shown' } },
      { id: 'hidden', type: 'Box', visible: false, properties: { content: 'Hidden' } },
    ]),
  });
  await screen.findByText('Shown');
  expect(screen.queryByText('Hidden')).toBeNull();
  expect(screen.queryByTestId('hidden')).toBeNull();
});
