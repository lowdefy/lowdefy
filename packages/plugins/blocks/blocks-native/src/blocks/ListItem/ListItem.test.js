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
import { Platform } from 'react-native';

import { renderPage, styleOf, theme } from '../../test/renderPage.js';

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
  expect(screen.getByText('AL', { includeHiddenElements: true })).toBeTruthy();
  // Not pressable, so no chevron.
  expect(screen.queryByTestId('ada_chevron', { includeHiddenElements: true })).toBeNull();
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
  expect(await screen.findByTestId('ada_chevron', { includeHiddenElements: true })).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('ada_item'));
  });
  expect(record).toEqual(['opened']);
});

test('a ListItem loads leading and trailing avatar photo paths from the app server', async () => {
  await renderPage({
    pageConfig: itemPage({
      id: 'task',
      type: 'ListItem',
      properties: {
        title: 'Fix sign in',
        leading: { avatar: { name: 'Ada Lovelace', src: '/avatars/ada.png' } },
        trailing: { avatars: [{ name: 'Grace Hopper', src: 'avatars/grace.png' }] },
      },
    }),
  });
  await screen.findByText('Fix sign in');
  const sources = screen
    .getAllByTestId('expo-image', { includeHiddenElements: true })
    .map((image) => image.props.source.uri);
  expect(sources).toEqual([
    'https://app.lowdefy.test/avatars/ada.png',
    'https://app.lowdefy.test/avatars/grace.png',
  ]);
});

test('a ListItem draws a leading status, a Headline title, a subtitle and trailing parts', async () => {
  await renderPage({
    pageConfig: itemPage({
      id: 'task',
      type: 'ListItem',
      properties: {
        title: 'Fix sign in',
        subtitle: 'ACME-644 · Auth',
        leading: { status: 'inProgress' },
        trailing: {
          text: 'waiting',
          textColor: 'orange',
          status: 'priorityHigh',
          avatar: { name: 'Ada Lovelace' },
          badges: [{ icon: 'House', text: 2 }],
        },
      },
    }),
  });
  const title = await screen.findByText('Fix sign in');
  expect(styleOf(title)).toMatchObject({ fontSize: 17, fontWeight: '600' });
  expect(title.props.numberOfLines).toEqual(2);
  expect(styleOf(screen.getByText('ACME-644 · Auth'))).toMatchObject({ fontSize: 13 });
  expect(screen.getByLabelText('In progress')).toBeTruthy();
  expect(screen.getByLabelText('High priority')).toBeTruthy();
  expect(screen.getByLabelText('Ada Lovelace')).toBeTruthy();
  expect(screen.getByText('AL', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.getByText('2', { includeHiddenElements: true })).toBeTruthy();
  expect(styleOf(screen.getByText('waiting')).color).toEqual(theme.light['orange-6']);
});

test('a ListItem with a long title keeps its trailing badges at their natural width', async () => {
  await renderPage({
    pageConfig: itemPage({
      id: 'design',
      type: 'ListItem',
      properties: {
        title:
          'Acme for iPhone: a native shell with large titles, inset grouped lists, sheets and swipe actions on every row',
        subtitle: 'ACME-1842 · Pieter · 2d',
        trailing: { badges: [{ icon: 'House', text: 12 }], status: 'priorityHigh' },
        contextMenu: [{ id: 'open', title: 'Open' }],
      },
      events: { onClick: [] },
    }),
  });
  const title = await screen.findByText(/^Acme for iPhone/);
  expect(title.props.numberOfLines).toEqual(2);
  expect(title.props.ellipsizeMode).toEqual('tail');
  expect(styleOf(screen.getByTestId('design_text'))).toMatchObject({
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  });
  expect(styleOf(screen.getByTestId('design_trailing')).flexShrink).toEqual(0);
  expect(styleOf(screen.getByTestId('design_badge_0')).flexShrink).toEqual(0);
  expect(screen.getByText('12', { includeHiddenElements: true })).toBeTruthy();
});

test('a ListItem without a subtitle sets its title as Body', async () => {
  await renderPage({
    pageConfig: itemPage({ id: 'row', type: 'ListItem', properties: { title: 'Priority' } }),
  });
  expect(styleOf(await screen.findByText('Priority'))).toMatchObject({
    fontSize: 17,
    fontWeight: '400',
  });
});

test('a ListItem swipe action fires onSwipeAction with its id', async () => {
  const record = [];
  await renderPage({
    actions: { Record: ({ params }) => record.push(params) },
    pageConfig: itemPage({
      id: 'task',
      type: 'ListItem',
      properties: {
        title: 'Fix sign in',
        swipeActions: {
          leading: [{ id: 'done', title: 'Done', tone: 'success', icon: 'House' }],
          trailing: [{ id: 'move', title: 'Move' }],
        },
      },
      events: { onSwipeAction: [{ id: 'record', type: 'Record', params: { _event: 'id' } }] },
    }),
  });
  await screen.findByText('Fix sign in');
  await act(async () => {
    fireEvent.press(screen.getByTestId('task_done', { includeHiddenElements: true }));
  });
  await act(async () => {
    fireEvent(screen.getByTestId('task_item'), 'accessibilityAction', {
      nativeEvent: { actionName: 'swipe:move' },
    });
  });
  expect(record).toEqual(['done', 'move']);
});

test('a ListItem context menu item fires onContextMenu with its id', async () => {
  const record = [];
  await renderPage({
    actions: { Record: ({ params }) => record.push(params) },
    pageConfig: itemPage({
      id: 'task',
      type: 'ListItem',
      properties: {
        title: 'Fix sign in',
        contextMenu: [
          { id: 'copy', title: 'Copy key', icon: 'doc.on.doc' },
          { id: 'delete', title: 'Delete', icon: 'Trash', destructive: true },
        ],
      },
      events: { onContextMenu: [{ id: 'record', type: 'Record', params: { _event: 'id' } }] },
    }),
  });
  await screen.findByText('Fix sign in');
  const copy = screen.getByTestId('expo-ui-button-Copy key');
  expect(copy.props.systemImage).toEqual('doc.on.doc');
  const remove = screen.getByTestId('expo-ui-button-Delete');
  expect(remove.props.role).toEqual('destructive');
  expect(remove.props.systemImage).toBeUndefined();
  await act(async () => {
    fireEvent.press(copy);
  });
  expect(record).toEqual(['copy']);
});

test('a ListItem in a List moves the separator in to its title', async () => {
  await renderPage({
    pageConfig: {
      id: 'form',
      type: 'Box',
      events: {
        onInit: [{ id: 'init', type: 'SetState', params: { rows: [{ t: 'A' }, { t: 'B' }] } }],
      },
      blocks: [
        {
          id: 'rows',
          type: 'List',
          blocks: [
            {
              id: 'rows.$.item',
              type: 'ListItem',
              properties: { title: { _state: 'rows.$.t' }, leading: { status: 'todo' } },
            },
          ],
        },
      ],
    },
  });
  await screen.findByText('A');
  const separators = screen.getAllByTestId('list_separator', { includeHiddenElements: true });
  // Only the first row has a separator: the section's last row has none.
  expect(separators).toHaveLength(1);
  expect(styleOf(separators[0]).left).toEqual(16 + 18 + 12);
});

test('trailing.check draws the tinted checkmark where the chevron goes, with no chevron', async () => {
  await renderPage({
    pageConfig: {
      id: 'form',
      type: 'Box',
      blocks: [
        {
          id: 'bug',
          type: 'ListItem',
          properties: { title: 'Bug', trailing: { check: true } },
          events: { onClick: [] },
        },
        {
          id: 'docs',
          type: 'ListItem',
          properties: { title: 'Docs', trailing: { check: false } },
          events: { onClick: [] },
        },
      ],
    },
  });
  const check = await screen.findByTestId('expo-ui-icon-checkmark');
  expect(check.props.color).toBe(theme.light.colorPrimary);
  expect(check.props.size).toBe(17);
  expect(check.props.modifiers).toEqual([{ $type: 'font', size: 17, weight: 'semibold' }]);
  expect(screen.queryByTestId('bug_chevron', { includeHiddenElements: true })).toBeNull();
  expect(screen.getByTestId('bug_item').props.accessibilityState).toMatchObject({ selected: true });
  expect(screen.getAllByTestId('expo-ui-icon-checkmark')).toHaveLength(1);
  expect(screen.getByTestId('docs_chevron', { includeHiddenElements: true })).toBeTruthy();
});

test('a ListItem context menu on Android offers every item and runs nothing until one is picked', async () => {
  const os = Platform.OS;
  Platform.OS = 'android';
  const record = [];
  try {
    await renderPage({
      actions: { Record: ({ params }) => record.push(params) },
      pageConfig: itemPage({
        id: 'task',
        type: 'ListItem',
        properties: {
          title: 'Fix sign in',
          contextMenu: [
            { id: 'edit', title: 'Edit' },
            { id: 'share', title: 'Share' },
            { id: 'archive', title: 'Archive' },
            { id: 'delete', title: 'Delete', destructive: true },
          ],
        },
        events: { onContextMenu: [{ id: 'record', type: 'Record', params: { _event: 'id' } }] },
      }),
    });
    await screen.findByText('Fix sign in');
    const menu = screen.getByTestId('task_menu');
    expect(menu.props.shouldOpenOnLongPress).toBe(true);
    expect(menu.props.actions.map((action) => action.title)).toEqual([
      'Edit',
      'Share',
      'Archive',
      'Delete',
    ]);
    expect(menu.props.actions[3].attributes.destructive).toBe(true);
    // Dismissing the menu reports no action, so nothing runs.
    expect(record).toEqual([]);
    await act(async () => {
      fireEvent(menu, 'pressAction', { nativeEvent: { event: 'archive' } });
    });
    expect(record).toEqual(['archive']);
  } finally {
    Platform.OS = os;
  }
});
