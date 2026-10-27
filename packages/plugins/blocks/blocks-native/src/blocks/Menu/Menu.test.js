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

import { act, fireEvent } from '@testing-library/react-native';

import { page, record, renderPage, screen } from '../../test/renderPage.js';

const items = [
  { id: 'copy', title: 'Copy link', symbol: 'link' },
  {
    title: 'Danger',
    items: [{ id: 'delete', title: 'Delete', symbol: 'trash', destructive: true }],
  },
];

async function pick(id) {
  await act(async () => {
    fireEvent(screen.getByTestId('more_menu'), 'pressAction', { nativeEvent: { event: id } });
  });
}

test('picking an item fires onSelect with its id', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'more',
        type: 'Menu',
        properties: { icon: 'more', title: 'More', menuTitle: 'Design', items },
        events: { onSelect: record('select') },
      },
    ]),
  });
  const menu = await screen.findByTestId('more_menu');
  expect(menu.props.menuTitle).toBe('Design');
  expect(menu.props.shouldOpenOnLongPress).toBe(false);
  expect(menu.props.actions[0]).toMatchObject({ id: 'copy', title: 'Copy link', image: 'link' });
  expect(menu.props.actions[1]).toMatchObject({ title: 'Danger', displayInline: true });
  expect(screen.getByText('More')).toBeTruthy();
  await pick('delete');
  expect(calls).toEqual([{ name: 'select', event: { id: 'delete' } }]);
});

test('the content slot blocks are the trigger, and longPress opens a context menu', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'more',
        type: 'Menu',
        properties: { openOn: 'longPress', items },
        blocks: [{ id: 'row', type: 'Paragraph', properties: { content: 'A design row' } }],
      },
    ]),
  });
  expect(await screen.findByText('A design row')).toBeTruthy();
  expect(screen.getByTestId('more_menu').props.shouldOpenOnLongPress).toBe(true);
});

test('a disabled Menu draws its trigger with no menu', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'more', type: 'Menu', properties: { title: 'More', disabled: true, items } },
    ]),
  });
  const trigger = await screen.findByTestId('more_menu');
  expect(trigger.props.actions).toBeUndefined();
  expect(trigger.props.accessibilityState).toEqual({ disabled: true });
});
