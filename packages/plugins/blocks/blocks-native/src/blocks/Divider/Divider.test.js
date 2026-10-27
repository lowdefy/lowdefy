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

import { StyleSheet } from 'react-native';

import { ios, page, renderPage, screen, styleOf, theme } from '../../test/renderPage.js';

test('a Divider is a hairline in the separator colour with a large margin by default', async () => {
  await renderPage({ pageConfig: page([{ id: 'rule', type: 'Divider' }]) });
  const rule = (await screen.findByTestId('rule')).children[0];
  expect(styleOf(rule)).toMatchObject({
    backgroundColor: ios.light.colorSeparator,
    height: StyleSheet.hairlineWidth,
    marginVertical: theme.light.marginLG,
  });
});

test('a Divider with a title puts it between two lines, at its placement', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'section',
        type: 'Divider',
        properties: { title: 'Details', titlePlacement: 'start', plain: true, size: 'small' },
      },
    ]),
  });
  const title = await screen.findByText('Details');
  expect(styleOf(title)).toMatchObject({
    color: ios.light.colorSecondaryLabel,
    fontSize: 13,
    fontWeight: '400',
  });
  const row = screen.getByTestId('section').children[0];
  expect(styleOf(row).marginVertical).toBe(theme.light.marginXS);
  const [before, , after] = row.children;
  expect(styleOf(before).flex).toBe(0.05);
  expect(styleOf(after).flex).toBe(0.95);
});

test('a dashed or vertical Divider draws a dashed or upright line', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'dashed', type: 'Divider', properties: { dashed: true } },
      { id: 'upright', type: 'Divider', properties: { orientation: 'vertical' } },
    ]),
  });
  expect(styleOf((await screen.findByTestId('dashed')).children[0])).toMatchObject({
    borderStyle: 'dashed',
    height: 0,
  });
  expect(styleOf(screen.getByTestId('upright').children[0])).toMatchObject({
    height: 13,
    width: StyleSheet.hairlineWidth,
  });
});

test('a Divider takes the dark separator colour in dark mode, and is not drawn when not visible', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([
      { id: 'rule', type: 'Divider' },
      { id: 'hidden', type: 'Divider', visible: false },
    ]),
  });
  expect(styleOf((await screen.findByTestId('rule')).children[0]).backgroundColor).toBe(
    ios.dark.colorSeparator
  );
  expect(screen.queryByTestId('hidden')).toBeNull();
});
