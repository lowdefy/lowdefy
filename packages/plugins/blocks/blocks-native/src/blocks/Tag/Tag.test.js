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

import { jest } from '@jest/globals';
import { Linking } from 'react-native';

import {
  iconPaths,
  icons,
  page,
  press,
  record,
  renderPage,
  screen,
  styleOf,
  theme,
} from '../../test/renderPage.js';

test('a Tag shows its title in its preset colour, with the block id as testID', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'status', type: 'Tag', properties: { title: 'Shipped', color: 'blue' } },
      {
        id: 'live',
        type: 'Tag',
        properties: { title: 'Live', color: 'success', variant: 'solid' },
      },
    ]),
  });
  const title = await screen.findByText('Shipped');
  expect(styleOf(title).color).toBe(theme.light.blue7);
  expect(styleOf(screen.getByTestId('status').children[0])).toMatchObject({
    backgroundColor: theme.light.blue1,
    borderColor: theme.light.blue3,
  });
  expect(styleOf(screen.getByText('Live')).color).toBe(theme.light.colorTextLightSolid);
  expect(styleOf(screen.getByTestId('live').children[0]).backgroundColor).toBe(
    theme.light.colorSuccess
  );
});

test('a Tag without a title shows its block id, and draws its icon', async () => {
  await renderPage({
    pageConfig: page([{ id: 'plain', type: 'Tag', properties: { icon: 'House' } }]),
  });
  expect(await screen.findByText('plain')).toBeTruthy();
  expect(iconPaths(screen.getByTestId('plain_icon'))).toEqual(
    icons.House.node.map(([, attrs]) => attrs.d)
  );
});

test('a closable Tag fires onClose and is removed', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'chip',
        type: 'Tag',
        properties: { title: 'Filter', closable: true },
        events: { onClose: record('close') },
      },
    ]),
  });
  await press(await screen.findByTestId('chip_close'));
  expect(screen.queryByText('Filter')).toBeNull();
  expect(calls.map((call) => call.name)).toEqual(['close']);
});

test('a Tag with onClick or an absolute href is pressable; a disabled one is not', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockImplementation(async () => true);
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'click',
        type: 'Tag',
        properties: { title: 'Click' },
        events: { onClick: record('click') },
      },
      { id: 'link', type: 'Tag', properties: { title: 'Docs', href: 'https://lowdefy.com' } },
      { id: 'relative', type: 'Tag', properties: { title: 'Here', href: '/here' } },
      {
        id: 'off',
        type: 'Tag',
        properties: { title: 'Off', disabled: true },
        events: { onClick: record('off') },
      },
    ]),
  });
  await press(await screen.findByText('Click'));
  await press(screen.getByRole('link'));
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(styleOf(screen.getByText('Off')).color).toBe(theme.light.colorTextDisabled);
  expect(calls.map((call) => call.name)).toEqual(['click']);
  expect(openURL.mock.calls).toEqual([['https://lowdefy.com']]);
  openURL.mockRestore();
});

test('a Tag takes the dark palette in dark mode, and is not drawn when not visible', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([
      { id: 'status', type: 'Tag', properties: { title: 'Shipped', color: 'blue' } },
      { id: 'hidden', type: 'Tag', visible: false, properties: { title: 'Hidden' } },
    ]),
  });
  expect(styleOf(await screen.findByText('Shipped')).color).toBe(theme.dark.blue7);
  expect(screen.queryByTestId('hidden')).toBeNull();
});
