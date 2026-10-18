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

test('a Title draws its content as a header at its level, with the block id as testID', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'heading', type: 'Title', properties: { content: 'Orders', level: 3 } },
    ]),
  });
  const heading = await screen.findByRole('header');
  expect(heading.props.children[0]).toBe('Orders');
  expect(styleOf(heading)).toMatchObject({
    color: theme.light.colorTextHeading,
    fontSize: theme.light.fontSizeHeading3,
    fontWeight: '600',
    marginBottom: theme.light.fontSizeHeading3 / 2,
  });
  expect(screen.getByTestId('heading')).toBeTruthy();
});

test('a Title shows html content as plain text and applies type and decoration styles', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'heading',
        type: 'Title',
        properties: {
          content: 'Tom &amp; <b>Jerry</b>',
          type: 'danger',
          underline: true,
          delete: true,
          italic: true,
        },
      },
    ]),
  });
  const heading = await screen.findByText('Tom & Jerry');
  expect(styleOf(heading)).toMatchObject({
    color: theme.light.colorError,
    fontStyle: 'italic',
    textDecorationLine: 'underline line-through',
  });
});

test('a Title color, theme tokens and element style apply in that order', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'heading',
        type: 'Title',
        style: { element: { letterSpacing: 1 } },
        properties: {
          content: 'Big',
          color: '#123456',
          level: 1,
          theme: { fontSizeHeading1: 50, titleMarginBottom: 4 },
        },
      },
    ]),
  });
  expect(styleOf(await screen.findByText('Big'))).toMatchObject({
    color: '#123456',
    fontSize: 50,
    letterSpacing: 1,
    marginBottom: 4,
  });
});

test('an expandable Title ellipsis expands and collapses, firing onExpand', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'heading',
        type: 'Title',
        properties: {
          content: 'A long heading',
          ellipsis: { rows: 2, expandable: 'collapsible', symbol: ['More', 'Less'] },
        },
        events: { onExpand: record('expand') },
      },
    ]),
  });
  expect((await screen.findByText('A long heading')).props.numberOfLines).toBe(2);
  await press(screen.getByText('More'));
  expect(screen.getByText('A long heading').props.numberOfLines).toBeUndefined();
  await press(screen.getByTestId('heading_collapse'));
  expect(screen.getByText('A long heading').props.numberOfLines).toBe(2);
  expect(calls).toEqual([
    { name: 'expand', event: { expanded: true } },
    { name: 'expand', event: { expanded: false } },
  ]);
});

test('a Title takes the dark heading colour in dark mode', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([{ id: 'heading', type: 'Title', properties: { content: 'Night' } }]),
  });
  expect(styleOf(await screen.findByText('Night')).color).toBe(theme.dark.colorTextHeading);
});

test('a Title evaluated visible false is not drawn', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'shown', type: 'Title', properties: { content: 'Shown' } },
      { id: 'hidden', type: 'Title', visible: false, properties: { content: 'Hidden' } },
    ]),
  });
  await screen.findByText('Shown');
  expect(screen.queryByTestId('hidden')).toBeNull();
});
