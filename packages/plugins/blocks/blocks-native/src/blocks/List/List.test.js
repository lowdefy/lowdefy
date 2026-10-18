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

import { act, fireEvent, screen, within } from '@testing-library/react-native';

import renderPage from '../../test/renderPage.js';

function callMethod(id, method, args) {
  return { id, type: 'CallMethod', params: { blockId: 'items', method, args } };
}

function listPage({ list = {}, record = [] } = {}) {
  return {
    actions: { Record: ({ params }) => record.push(params) },
    pageConfig: {
      id: 'form',
      type: 'Box',
      events: {
        onInit: [
          {
            id: 'init',
            type: 'SetState',
            params: { items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] },
          },
        ],
      },
      blocks: [
        {
          id: 'items',
          type: 'List',
          ...list,
          blocks: [
            {
              id: 'items.$.name_text',
              type: 'Paragraph',
              properties: { content: { _state: 'items.$.name' } },
            },
          ],
        },
        {
          id: 'push',
          type: 'Button',
          properties: { title: 'Push' },
          events: { onClick: [callMethod('push', 'pushItem', [{ name: 'D' }])] },
        },
        {
          id: 'remove',
          type: 'Button',
          properties: { title: 'Remove first' },
          events: { onClick: [callMethod('remove', 'removeItem', [0])] },
        },
        {
          id: 'move',
          type: 'Button',
          properties: { title: 'Move first down' },
          events: { onClick: [callMethod('move', 'moveItemDown', [0])] },
        },
        {
          id: 'count',
          type: 'Button',
          events: {
            onClick: [{ id: 'record', type: 'Record', params: { _state: 'items' } }],
          },
        },
      ],
    },
  };
}

function itemTexts() {
  return [0, 1, 2, 3]
    .map((index) => screen.queryByTestId(`items_${index}`))
    .filter((item) => item !== null)
    .map((item) => within(item).getByText(/.+/).props.children);
}

test('a List draws its content slot once per item in state', async () => {
  await renderPage(listPage());
  await screen.findByText('A');
  expect(itemTexts()).toEqual(['A', 'B', 'C']);
});

test('pushItem, removeItem and moveItemDown change state and the drawn items', async () => {
  const record = [];
  await renderPage(listPage({ record }));
  await screen.findByText('A');
  await act(async () => {
    fireEvent.press(screen.getByText('Move first down'));
  });
  expect(itemTexts()).toEqual(['B', 'A', 'C']);
  await act(async () => {
    fireEvent.press(screen.getByText('Remove first'));
  });
  expect(itemTexts()).toEqual(['A', 'C']);
  await act(async () => {
    fireEvent.press(screen.getByText('Push'));
  });
  expect(itemTexts()).toEqual(['A', 'C', 'D']);
  await act(async () => {
    fireEvent.press(screen.getByText('count'));
  });
  expect(record).toEqual([[{ name: 'A' }, { name: 'C' }, { name: 'D' }]]);
});

test('a swipe action fires its event with the item index', async () => {
  const record = [];
  await renderPage(
    listPage({
      record,
      list: {
        properties: { swipeActions: [{ title: 'Delete', event: 'onDelete', danger: true }] },
        events: {
          onDelete: [
            { id: 'record', type: 'Record', params: { _event: 'index' } },
            callMethod('remove', 'removeItem', [{ _event: 'index' }]),
          ],
        },
      },
    })
  );
  await screen.findByText('A');
  await act(async () => {
    fireEvent.press(screen.getByTestId('items_1_onDelete', { includeHiddenElements: true }));
  });
  expect(record).toEqual([1]);
  expect(itemTexts()).toEqual(['A', 'C']);
});

test('screen readers get the swipe actions as accessibility actions', async () => {
  const record = [];
  await renderPage(
    listPage({
      record,
      list: {
        properties: { swipeActions: [{ title: 'Archive', event: 'onArchive' }] },
        events: { onArchive: [{ id: 'record', type: 'Record', params: { _event: 'index' } }] },
      },
    })
  );
  await screen.findByText('A');
  const row = screen.getByTestId('items_2_row');
  expect(row.props.accessibilityActions).toEqual([{ name: 'onArchive', label: 'Archive' }]);
  await act(async () => {
    fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'onArchive' } });
  });
  expect(record).toEqual([2]);
});

test('sectionKey groups items under section headers', async () => {
  await renderPage({
    pageConfig: {
      id: 'form',
      type: 'Box',
      events: {
        onInit: [
          {
            id: 'init',
            type: 'SetState',
            params: {
              items: [
                { name: 'Apple', group: 'Fruit' },
                { name: 'Pear', group: 'Fruit' },
                { name: 'Kale', group: 'Veg' },
              ],
            },
          },
        ],
      },
      blocks: [
        {
          id: 'items',
          type: 'List',
          properties: { sectionKey: 'group' },
          blocks: [
            {
              id: 'items.$.name_text',
              type: 'Paragraph',
              properties: { content: { _state: 'items.$.name' } },
            },
          ],
        },
      ],
    },
  });
  expect(await screen.findByText('Fruit')).toBeTruthy();
  expect(screen.getByText('Veg')).toBeTruthy();
  expect(screen.getByText('Kale')).toBeTruthy();
});

test('onRefresh runs when the List is pulled to refresh', async () => {
  const record = [];
  await renderPage(
    listPage({
      record,
      list: {
        properties: { scroll: true },
        events: { onRefresh: [{ id: 'record', type: 'Record', params: 'refreshed' }] },
      },
    })
  );
  await screen.findByText('A');
  const list = screen.getByTestId('items_list');
  expect(list.props.refreshing).toBe(false);
  await act(async () => {
    list.props.onRefresh();
  });
  expect(record).toEqual(['refreshed']);
});
