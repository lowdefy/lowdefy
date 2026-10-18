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

import { ios, page, press, record, renderPage, screen, styleOf } from '../../test/renderPage.js';

const text = (id, content) => ({ id, type: 'Box', properties: { content } });

test('a Card is a grouped cell drawing its title, extra, cover, content and actions', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'order',
        type: 'Card',
        properties: { title: 'Order <b>42</b>' },
        slots: {
          content: { blocks: [text('body', 'Two items')] },
          extra: { blocks: [text('more', 'More')] },
          cover: { blocks: [text('photo', 'Photo')] },
          actions: { blocks: [text('pay', 'Pay')] },
        },
      },
    ]),
  });
  expect(await screen.findByText('Order 42')).toBeTruthy();
  ['Two items', 'More', 'Photo', 'Pay'].forEach((content) => {
    expect(screen.getByText(content)).toBeTruthy();
  });
  expect(screen.getByRole('header').props.children).toBe('Order 42');
  const card = screen.getByTestId('order').children[0];
  expect(styleOf(card)).toMatchObject({
    backgroundColor: ios.light.colorCell,
    borderRadius: 10,
  });
  expect(styleOf(card).borderWidth).toBeUndefined();
  expect(styleOf(screen.getByRole('header'))).toMatchObject({
    color: ios.light.colorLabel,
    fontSize: 17,
    fontWeight: '600',
  });
  expect(styleOf(screen.getByTestId('body').parent.parent)).toMatchObject({ padding: 16 });
});

test('a title slot replaces the title, and compact cards and theme overrides follow antd', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'slotted',
        type: 'Card',
        properties: { title: 'Hidden', size: 'small' },
        slots: { title: { blocks: [text('custom', 'Custom title')] } },
      },
      {
        id: 'compact',
        type: 'Card',
        properties: { padding: 'compact', bordered: false, theme: { colorCell: '#fafafa' } },
        blocks: [text('inside', 'Inside')],
      },
    ]),
  });
  expect(await screen.findByText('Custom title')).toBeTruthy();
  expect(screen.queryByText('Hidden')).toBeNull();
  expect(styleOf(screen.getByTestId('compact').children[0])).toMatchObject({
    backgroundColor: '#fafafa',
  });
  const body = screen.getByTestId('inside').parent.parent;
  expect(styleOf(body)).toMatchObject({ padding: 12 });
});

test('a loading Card shows skeleton rows in place of its content', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'busy', type: 'Card', properties: { loading: true }, blocks: [text('late', 'Late')] },
    ]),
  });
  await screen.findByTestId('busy');
  expect(screen.getAllByRole('progressbar')).toHaveLength(4);
  expect(screen.queryByText('Late')).toBeNull();
});

test('a Card with onClick is a button that fires onClick', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'tap',
        type: 'Card',
        properties: { title: 'Open' },
        events: { onClick: record('click') },
      },
    ]),
  });
  await press(await screen.findByRole('button'));
  expect(calls.map((call) => call.name)).toEqual(['click']);
});

test('a Card takes the dark container colour in dark mode, and is not drawn when not visible', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([
      { id: 'night', type: 'Card', properties: { title: 'Night' } },
      { id: 'hidden', type: 'Card', visible: false, properties: { title: 'Hidden' } },
    ]),
  });
  await screen.findByText('Night');
  expect(styleOf(screen.getByTestId('night').children[0]).backgroundColor).toBe(ios.dark.colorCell);
  expect(styleOf(screen.getByText('Night')).color).toBe(ios.dark.colorLabel);
  expect(screen.queryByTestId('hidden')).toBeNull();
});
