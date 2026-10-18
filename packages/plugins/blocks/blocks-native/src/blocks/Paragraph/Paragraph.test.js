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

import {
  ios,
  page,
  press,
  record,
  renderPage,
  screen,
  styleOf,
  theme,
} from '../../test/renderPage.js';

test('a Paragraph draws its content in the body text style, with the block id as testID', async () => {
  await renderPage({
    pageConfig: page([{ id: 'body', type: 'Paragraph', properties: { content: 'Hello' } }]),
  });
  expect(styleOf(await screen.findByText('Hello'))).toMatchObject({
    color: ios.light.colorLabel,
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 11,
  });
  expect(screen.getByTestId('body')).toBeTruthy();
});

test('a Paragraph textStyle picks an iOS text style', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'meta', type: 'Paragraph', properties: { content: 'Meta', textStyle: 'footnote' } },
    ]),
  });
  expect(styleOf(await screen.findByText('Meta'))).toMatchObject({ fontSize: 13, lineHeight: 18 });
});

test('a Paragraph applies strong, code, mark and secondary styles', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'a',
        type: 'Paragraph',
        properties: { content: 'Strong', strong: true, type: 'secondary' },
      },
      { id: 'b', type: 'Paragraph', properties: { content: 'Code', code: true } },
      { id: 'c', type: 'Paragraph', properties: { content: 'Marked', mark: true } },
      { id: 'd', type: 'Paragraph', properties: { content: 'Off', disabled: true } },
    ]),
  });
  expect(styleOf(await screen.findByText('Strong'))).toMatchObject({
    color: ios.light.colorSecondaryLabel,
    fontWeight: '600',
  });
  expect(styleOf(screen.getByText('Code'))).toMatchObject({
    backgroundColor: ios.light.colorTertiarySystemFill,
    fontSize: 17 * 0.85,
  });
  expect(styleOf(screen.getByText('Code')).fontFamily).toEqual(expect.any(String));
  expect(styleOf(screen.getByText('Marked')).backgroundColor).toBe(theme.light.gold3);
  expect(styleOf(screen.getByText('Off')).color).toBe(ios.light.colorTertiaryLabel);
});

test('a Paragraph ellipsis cuts to one row, and an expandable one fires onExpand once', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      { id: 'short', type: 'Paragraph', properties: { content: 'Cut', ellipsis: true } },
      {
        id: 'long',
        type: 'Paragraph',
        properties: { content: 'Long text', ellipsis: { rows: 3, expandable: true, suffix: '!' } },
        events: { onExpand: record('expand') },
      },
    ]),
  });
  expect((await screen.findByText('Cut')).props.numberOfLines).toBe(1);
  expect(screen.getByText('Long text!').props.numberOfLines).toBe(3);
  await press(screen.getByText('Expand'));
  expect(screen.getByText('Long text!').props.numberOfLines).toBeUndefined();
  // expandable: true expands once; only 'collapsible' collapses again.
  expect(screen.queryByText('Collapse')).toBeNull();
  expect(calls).toEqual([{ name: 'expand', event: { expanded: true } }]);
});

test('a Paragraph takes the dark text colour in dark mode', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([{ id: 'body', type: 'Paragraph', properties: { content: 'Night' } }]),
  });
  expect(styleOf(await screen.findByText('Night')).color).toBe(ios.dark.colorLabel);
});

test('a Paragraph evaluated visible false is not drawn', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'shown', type: 'Paragraph', properties: { content: 'Shown' } },
      { id: 'hidden', type: 'Paragraph', visible: false, properties: { content: 'Hidden' } },
    ]),
  });
  await screen.findByText('Shown');
  expect(screen.queryByText('Hidden')).toBeNull();
});
