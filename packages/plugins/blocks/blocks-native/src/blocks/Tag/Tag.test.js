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

import { StyleSheet } from 'react-native';
import { withAlpha } from '@lowdefy/client-native';

import {
  iconPaths,
  icons,
  ios,
  page,
  press,
  record,
  renderPage,
  screen,
  styleOf,
  theme,
} from '../../test/renderPage.js';

test('a Tag is a pill with its title in its tone over a tint of it', async () => {
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
  expect(styleOf(title)).toMatchObject({ color: theme.light.blue7, fontSize: 13 });
  expect(styleOf(screen.getByTestId('status').children[0])).toMatchObject({
    backgroundColor: withAlpha({ alpha: 0.14, color: theme.light.blue6 }),
    borderRadius: 12,
    borderWidth: 0,
    minHeight: 24,
  });
  expect(styleOf(screen.getByText('Live')).color).toBe('#FFFFFF');
  expect(styleOf(screen.getByTestId('live').children[0]).backgroundColor).toBe(theme.light.green6);
});

test('a small Tag is a smaller pill, and dot draws a leading dot', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'stage', type: 'Tag', properties: { title: 'Settled', dot: 'cyan', size: 'small' } },
      { id: 'own', type: 'Tag', properties: { title: 'Built', color: 'green', dot: true } },
      { id: 'plain', type: 'Tag', properties: { title: 'Draft', variant: 'outlined' } },
    ]),
  });
  expect(styleOf(await screen.findByText('Settled'))).toMatchObject({
    color: ios.light.colorSecondaryLabel,
    fontSize: 12,
  });
  expect(styleOf(screen.getByTestId('stage').children[0])).toMatchObject({
    backgroundColor: ios.light.colorTertiarySystemFill,
    minHeight: 20,
  });
  expect(styleOf(screen.getByTestId('stage_dot')).backgroundColor).toBe(theme.light.cyan6);
  expect(styleOf(screen.getByTestId('own_dot')).backgroundColor).toBe(theme.light.green6);
  expect(styleOf(screen.getByTestId('plain').children[0])).toMatchObject({
    backgroundColor: 'transparent',
    borderColor: ios.light.colorOpaqueSeparator,
    borderWidth: StyleSheet.hairlineWidth * 2,
  });
});

test('a Tag without a title shows only its icon, not its block id', async () => {
  await renderPage({
    pageConfig: page([{ id: 'plain', type: 'Tag', properties: { icon: 'House' } }]),
  });
  await screen.findByTestId('plain_icon');
  expect(screen.queryByText('plain')).toBeNull();
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
  expect(styleOf(screen.getByText('Off')).color).toBe(ios.light.colorTertiaryLabel);
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
