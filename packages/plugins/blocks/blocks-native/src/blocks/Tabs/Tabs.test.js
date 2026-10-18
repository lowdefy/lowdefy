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

const text = (id, content) => ({ id, type: 'Box', properties: { content } });

const tabsBlock = {
  id: 'tabs',
  type: 'Tabs',
  properties: {
    tabs: [
      { key: 'details', title: 'Details', icon: 'House' },
      { key: 'history', title: 'History', eventName: 'onHistory' },
      { key: 'archive', title: 'Archive', disabled: true },
    ],
  },
  slots: {
    details: { blocks: [text('details_body', 'Details body')] },
    history: { blocks: [text('history_body', 'History body')] },
  },
};

test('Tabs show a tab per entry and the first tab’s slot', async () => {
  await renderPage({ pageConfig: page([tabsBlock]) });
  expect(await screen.findByText('Details body')).toBeTruthy();
  const tabs = screen.getAllByRole('tab');
  expect(tabs.map((tab) => tab.props.accessibilityState)).toEqual([
    { disabled: false, selected: true },
    { disabled: false, selected: false },
    { disabled: true, selected: false },
  ]);
  // The inactive tab's blocks stay mounted, hidden, so they keep their state.
  expect(screen.queryByText('History body')).toBeNull();
  expect(screen.getByText('History body', { includeHiddenElements: true })).toBeTruthy();
  expect(styleOf(screen.getByText('Details')).color).toBe(theme.light.colorPrimary);
  expect(styleOf(screen.getByTestId('tabs_indicator')).backgroundColor).toBe(
    theme.light.colorPrimary
  );
  expect(screen.getByTestId('tabs_details_icon')).toBeTruthy();
});

test('pressing a tab shows its slot and fires onChange and the tab’s eventName', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        ...tabsBlock,
        events: { onChange: record('change'), onHistory: record('history') },
      },
    ]),
  });
  await press(await screen.findByTestId('tabs_history'));
  expect(screen.getByText('History body')).toBeTruthy();
  expect(screen.queryByText('Details body')).toBeNull();
  expect(calls).toEqual([
    { name: 'change', event: { activeKey: 'history' } },
    { name: 'history', event: { key: 'history' } },
  ]);
  await press(screen.getByTestId('tabs_archive'));
  expect(calls).toHaveLength(2);
});

test('Tabs without a tabs list take their slots in key order, less the extra slot', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'tabs',
        type: 'Tabs',
        properties: { defaultActiveKey: 'b', extraAreaKey: 'extra', destroyOnHidden: true },
        slots: {
          b: { blocks: [text('b_body', 'B body')] },
          a: { blocks: [text('a_body', 'A body')] },
          extra: { blocks: [text('extra_body', 'Extra')] },
        },
      },
    ]),
  });
  expect(await screen.findByText('B body')).toBeTruthy();
  expect(screen.getAllByRole('tab').map((tab) => tab.props.testID)).toEqual(['tabs_a', 'tabs_b']);
  expect(screen.getByText('Extra')).toBeTruthy();
  // destroyOnHidden unmounts the inactive tab.
  expect(screen.queryByText('A body', { includeHiddenElements: true })).toBeNull();
});

test('the setActiveKey method changes tab', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      { ...tabsBlock, events: { onChange: record('change') } },
      {
        id: 'go',
        type: 'Box',
        properties: { content: 'Go' },
        events: {
          onClick: [
            {
              id: 'set',
              type: 'CallMethod',
              params: { blockId: 'tabs', method: 'setActiveKey', args: [{ activeKey: 'history' }] },
            },
          ],
        },
      },
    ]),
  });
  await screen.findByText('Details body');
  await press(screen.getByText('Go'));
  expect(screen.getByText('History body')).toBeTruthy();
  expect(calls).toEqual([{ name: 'change', event: { activeKey: 'history' } }]);
});

test('Tabs take the dark colours in dark mode, and are not drawn when not visible', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([tabsBlock, { ...tabsBlock, id: 'hidden', visible: false }]),
  });
  await screen.findByText('Details body');
  expect(styleOf(screen.getByText('History')).color).toBe(theme.dark.colorText);
  expect(styleOf(screen.getByText('Details')).color).toBe(theme.dark.colorPrimary);
  expect(screen.queryByTestId('hidden')).toBeNull();
});
