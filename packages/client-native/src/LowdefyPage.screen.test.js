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

import React from 'react';
import { jest } from '@jest/globals';
import { Dimensions, processColor, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import buildPage from './test/buildPage.js';
import createFakeHost from './test/createFakeHost.js';
import createTypes from './test/createTypes.js';
import LowdefyPage from './LowdefyPage.js';
import theme from './test/theme.json';

const rootConfig = {
  classMap: {},
  home: { configured: true, pageId: 'home' },
  lowdefyApp: { slug: 'test-app' },
  menus: [],
  pagePaths: { home: 'home', task: 'task' },
  theme,
};

// lucide's Plus and Pencil, as the build loads them into a page's _icons.
const plus = {
  node: [
    ['path', { d: 'M5 12h14' }],
    ['path', { d: 'M12 5v14' }],
  ],
};
const pencil = { node: [['path', { d: 'M12 20h9' }]] };

function createCore() {
  return {
    apiBase: 'https://app.lowdefy.test',
    auth: { authConfig: {} },
    basePath: '',
    lowdefy: { buildId: 'build-1' },
  };
}

function findAll(node, predicate, found = []) {
  if (node === null || typeof node === 'string') return found;
  if (predicate(node)) found.push(node);
  (node.children ?? []).forEach((child) => findAll(child, predicate, found));
  return found;
}

test('an Icon block draws icon data a shell adds to types.icons after the first page', async () => {
  const { host } = createFakeHost({ path: '/home' });
  const core = createCore();
  const types = createTypes();
  await render(
    <LowdefyPage
      core={core}
      host={host}
      pageConfig={buildPage({ id: 'home', type: 'Box', blocks: [] })}
      rootConfig={rootConfig}
      types={types}
    />
  );
  // A later page's icons arrive with that page, as PageScreen adds a page's _icons.
  Object.assign(types.icons, { Plus: plus, edit: pencil });
  await render(
    <LowdefyPage
      core={core}
      host={host}
      pageConfig={buildPage({
        id: 'task',
        type: 'Box',
        blocks: [
          { id: 'lucide', type: 'Icon', properties: { name: 'Plus' } },
          { id: 'semantic', type: 'Icon', properties: { name: 'edit' } },
        ],
      })}
      rootConfig={rootConfig}
      types={types}
    />
  );
  const lucide = await screen.findByTestId('lucide');
  expect(findAll(lucide, (node) => node.props?.d === 'M12 5v14')).not.toHaveLength(0);
  const semantic = screen.getByTestId('semantic');
  expect(findAll(semantic, (node) => node.props?.d === 'M12 20h9')).not.toHaveLength(0);
});

// A task page: its key from the route's query, and a button that marks it in state.
const taskPage = buildPage({
  id: 'task',
  type: 'Box',
  events: {
    onInit: [
      {
        id: 'init',
        type: 'SetState',
        params: { key: { _url_query: 'key' }, from: { _input: 'from' } },
      },
    ],
  },
  blocks: [
    {
      id: 'key',
      type: 'Paragraph',
      properties: { content: { '_string.concat': ['key ', { _state: 'key' }] } },
    },
    {
      id: 'from',
      type: 'Paragraph',
      properties: { content: { '_string.concat': ['from ', { _state: 'from' }] } },
    },
    {
      id: 'note',
      type: 'Paragraph',
      properties: { content: { '_string.concat': ['note ', { _state: 'note' }] } },
    },
    {
      id: 'mark',
      type: 'Button',
      properties: { title: { '_string.concat': ['Mark ', { _state: 'key' }] } },
      events: {
        onClick: [{ id: 'set', type: 'SetState', params: { note: { _state: 'key' } } }],
      },
    },
  ],
});

test('two stacked screens of one page keep their own state and route query', async () => {
  // The host's shown route is the screen on top; each screen reads its own route.
  const { host } = createFakeHost({ path: '/other' });
  const core = createCore();
  const types = createTypes();
  const screenOf = ({ instanceId, key }) => (
    <LowdefyPage
      key={instanceId}
      core={core}
      host={host}
      instanceId={instanceId}
      pageConfig={taskPage}
      rootConfig={rootConfig}
      routePath={`/task?key=${key}`}
      types={types}
    />
  );
  const view = await render(<>{screenOf({ instanceId: 'route-a', key: 'A' })}</>);
  expect(await screen.findByText('key A')).toBeTruthy();
  // A Link from A to the page leaves its input under the page's key; B's screen takes it.
  core.lowdefy.inputs['page:task'] = { from: 'task A' };
  await act(async () => {
    view.rerender(
      <>
        {screenOf({ instanceId: 'route-a', key: 'A' })}
        {screenOf({ instanceId: 'route-b', key: 'B' })}
      </>
    );
  });
  expect(await screen.findByText('key B')).toBeTruthy();
  expect(screen.getByText('key A')).toBeTruthy();
  expect(screen.getByText('from task A')).toBeTruthy();
  // A write on screen A stays on A.
  await act(async () => {
    fireEvent.press(screen.getByText('Mark A'));
  });
  expect(await screen.findByText('note A')).toBeTruthy();
  expect(screen.queryByText('note B')).toBeNull();
  // Back from B: A still shows A.
  await act(async () => {
    view.rerender(<>{screenOf({ instanceId: 'route-a', key: 'A' })}</>);
  });
  expect(screen.getByText('key A')).toBeTruthy();
  expect(screen.getByText('note A')).toBeTruthy();
});

// The page scroll view's pull-to-refresh control (a RefreshControl element), or undefined.
function getRefreshControl() {
  const [scrollView] = findAll(screen.root, (node) => node.props?.refreshControl !== undefined);
  return scrollView?.props.refreshControl;
}

function renderScreen({ focused = true, headerInset, onScreenOptions = jest.fn(), page, record }) {
  const { host } = createFakeHost({ path: '/home' });
  const core = createCore();
  const types = createTypes({ icons: { Plus: plus }, record });
  // A host holds one config object per version of a page; a new object is a new version.
  const pageConfig = buildPage(page);
  const element = (isFocused) => (
    <LowdefyPage
      core={core}
      focused={isFocused}
      headerInset={headerInset}
      host={host}
      onScreenOptions={onScreenOptions}
      pageConfig={pageConfig}
      rootConfig={rootConfig}
      types={types}
    />
  );
  return { element, onScreenOptions, view: render(element(focused)) };
}

test('a Screen reports a large title, header search and header actions', async () => {
  const record = jest.fn();
  const { onScreenOptions, view } = renderScreen({
    record,
    page: {
      id: 'home',
      type: 'Screen',
      properties: {
        title: 'My work',
        largeTitle: true,
        headerSearch: { placeholder: 'Search', debounce: 5 },
        headerActions: [
          { id: 'add', icon: 'Plus', title: 'New task' },
          { id: 'squirrel', icon: 'Squirrel', placement: 'left', event: 'onSquirrel' },
        ],
      },
      events: {
        onHeaderAction: [{ id: 'action', type: 'Record', params: { action: { _event: 'id' } } }],
        onSquirrel: [{ id: 'squirrel', type: 'Record', params: { squirrel: { _event: 'id' } } }],
        onSearch: [{ id: 'search', type: 'Record', params: { search: { _event: 'value' } } }],
        onSearchChange: [{ id: 'change', type: 'Record', params: { change: { _event: 'value' } } }],
      },
      blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }],
    },
  });
  await view;
  expect(await screen.findByText('Body')).toBeTruthy();
  const options = onScreenOptions.mock.calls.at(-1)[0];
  expect(options).toMatchObject({ largeTitle: true, title: 'My work' });
  expect(options.headerSearch).toMatchObject({ autoFocus: false, placeholder: 'Search' });
  expect(
    options.headerActions.map(({ id, placement, sfSymbol, title }) => ({
      id,
      placement,
      sfSymbol,
      title,
    }))
  ).toEqual([
    { id: 'add', placement: 'right', sfSymbol: 'plus', title: 'New task' },
    { id: 'squirrel', placement: 'left', sfSymbol: null, title: 'Squirrel' },
  ]);

  await act(async () => {
    await options.headerActions[0].onPress();
    await options.headerActions[1].onPress();
    await options.headerSearch.onSearch('dark mode');
  });
  await act(async () => {
    options.headerSearch.onChangeText('da');
    options.headerSearch.onChangeText('dar');
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  expect(record.mock.calls.map(([params]) => params)).toEqual([
    { action: 'add' },
    { squirrel: 'squirrel' },
    { search: 'dark mode' },
    { change: 'dar' },
  ]);

  // An action draws as an icon button at its natural size where it has no native bar button.
  await render(options.headerActions[0].render());
  const button = screen.getByTestId('home_add');
  expect(button.props.accessibilityLabel).toEqual('New task');
  expect(findAll(button, (node) => node.props?.d === 'M12 5v14')).not.toHaveLength(0);
});

test('a header action with items opens a menu whose picked item fires its id', async () => {
  const record = jest.fn();
  const { onScreenOptions, view } = renderScreen({
    record,
    page: {
      id: 'home',
      type: 'Screen',
      properties: {
        title: 'Task',
        headerActions: [
          {
            id: 'more',
            icon: 'Plus',
            title: 'More',
            items: [
              { id: 'copy_link', title: 'Copy link', symbol: 'link' },
              { id: 'delete', title: 'Delete', destructive: true },
            ],
          },
        ],
      },
      events: {
        onHeaderAction: [{ id: 'action', type: 'Record', params: { action: { _event: 'id' } } }],
      },
      blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }],
    },
  });
  await view;
  expect(await screen.findByText('Body')).toBeTruthy();
  const [more] = onScreenOptions.mock.calls.at(-1)[0].headerActions;
  expect(
    more.menu.map(({ destructive, disabled, id, symbol, title }) => ({
      destructive,
      disabled,
      id,
      symbol,
      title,
    }))
  ).toEqual([
    { destructive: false, disabled: false, id: 'copy_link', symbol: 'link', title: 'Copy link' },
    { destructive: true, disabled: false, id: 'delete', symbol: null, title: 'Delete' },
  ]);
  // A native menu (iOS) runs the picked item's onPress.
  await act(async () => {
    await more.menu[0].onPress();
  });
  // Where there is no native menu, the icon button opens the menu itself, in a React Native Modal,
  // which reads window (removed for these tests, test/removeWindow.js).
  global.window = global;
  await render(more.render());
  expect(screen.queryByTestId('header-menu-delete')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByTestId('home_more'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('header-menu-delete'));
  });
  expect(record.mock.calls.map(([params]) => params)).toEqual([
    { action: 'copy_link' },
    { action: 'delete' },
  ]);
  expect(screen.queryByTestId('header-menu-delete')).toBeNull();
  delete global.window;
});

test('header slot blocks take their natural size, not the column width', async () => {
  const { onScreenOptions, view } = renderScreen({
    page: {
      id: 'home',
      type: 'Screen',
      properties: { title: 'Design' },
      slots: {
        content: { blocks: [] },
        headerRight: { blocks: [{ id: 'more', type: 'Button', properties: { title: 'More' } }] },
      },
    },
  });
  await view;
  await act(async () => undefined);
  const { headerRight } = onScreenOptions.mock.calls.at(-1)[0];
  await render(headerRight());
  const more = screen.getByTestId('more');
  expect(more.props.style).not.toEqual(expect.objectContaining({ width: '100%' }));
  expect(JSON.stringify(more.props.style ?? null)).not.toContain('100%');
});

test('a header slot whose blocks are all hidden is not reported, until one shows', async () => {
  const { onScreenOptions, view } = renderScreen({
    page: {
      id: 'home',
      type: 'Screen',
      properties: { title: 'Designs' },
      events: { onInit: [{ id: 'init', type: 'SetState', params: { spaces: false } }] },
      slots: {
        content: {
          blocks: [
            {
              id: 'show',
              type: 'Button',
              properties: { title: 'Show' },
              events: {
                onClick: [{ id: 'show', type: 'SetState', params: { spaces: true } }],
              },
            },
          ],
        },
        headerLeft: {
          blocks: [
            {
              id: 'spaces',
              type: 'Button',
              visible: { _state: 'spaces' },
              properties: { title: 'Spaces' },
            },
          ],
        },
        headerRight: {
          blocks: [{ id: 'more', type: 'Button', visible: false, properties: { title: 'More' } }],
        },
      },
    },
  });
  await view;
  await act(async () => undefined);
  // An empty slot would be drawn as an empty glass button in the native header.
  expect(onScreenOptions.mock.calls.at(-1)[0]).toMatchObject({
    headerLeft: undefined,
    headerRight: undefined,
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Show'));
  });
  const { headerLeft, headerRight } = onScreenOptions.mock.calls.at(-1)[0];
  expect(headerRight).toBeUndefined();
  await render(headerLeft());
  expect(screen.getByText('Spaces')).toBeTruthy();
});

// The style of a host view, with Animated values read as numbers.
function flatStyle(node) {
  return StyleSheet.flatten(node.props.style) ?? {};
}

test('a headerBottom slot draws its blocks first, over the content, and reports them', async () => {
  const { onScreenOptions, view } = renderScreen({
    page: {
      id: 'home',
      type: 'Screen',
      properties: { title: 'Designs', largeTitle: true },
      slots: {
        content: { blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }] },
        headerBottom: {
          blocks: [{ id: 'spaces', type: 'Paragraph', properties: { content: 'Spaces' } }],
        },
      },
    },
  });
  await view;
  expect(await screen.findByText('Spaces')).toBeTruthy();
  expect(onScreenOptions.mock.calls.at(-1)[0]).toMatchObject({ headerBottom: true });
  const strip = screen.getByTestId('home_header_bottom');
  // The strip is the page's first content, over the content below it.
  expect(flatStyle(strip).zIndex).toBe(1);
  expect(within(strip).queryByText('Body')).toBeNull();
  // On a page at rest, its surface and hairline are hidden: they show once it is pinned
  // (getHeaderBottomMotion).
  expect(flatStyle(screen.getByTestId('home_header_bottom_separator')).opacity).toBe(0);
});

test('a Screen without a headerBottom slot reports none', async () => {
  const { onScreenOptions, view } = renderScreen({
    page: {
      id: 'home',
      type: 'Screen',
      properties: { title: 'Designs' },
      blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }],
    },
  });
  await view;
  expect(await screen.findByText('Body')).toBeTruthy();
  expect(onScreenOptions.mock.calls.at(-1)[0]).toMatchObject({ headerBottom: false });
  expect(screen.queryByTestId('home_header_bottom')).toBeNull();
});

// The colours of a tint layer's gradient stops, from the top, as react-native-svg sends them.
function tintColors(layer) {
  const [gradient] = findAll(layer, (node) => node.type === 'RNSVGLinearGradient');
  return gradient.props.gradient.filter((_, index) => index % 2 === 1);
}

async function waitFor(ms) {
  await act(() => new Promise((resolve) => setTimeout(resolve, ms)));
}

const tintPage = {
  id: 'home',
  type: 'Screen',
  properties: {
    title: 'Design',
    largeTitle: true,
    backgroundTint: { color: { _state: 'tint' }, colorDark: '#7c2d12' },
  },
  events: { onInit: [{ id: 'init', type: 'SetState', params: { tint: '#ff7a45' } }] },
  slots: {
    content: {
      blocks: [
        {
          id: 'next',
          type: 'Button',
          properties: { title: 'Next' },
          events: { onClick: [{ id: 'set', type: 'SetState', params: { tint: '#1677ff' } }] },
        },
      ],
    },
    headerBottom: {
      blocks: [{ id: 'spaces', type: 'Paragraph', properties: { content: 'Spaces' } }],
    },
  },
};

test('a backgroundTint draws a gradient behind the blocks, fixed to the screen top', async () => {
  const { onScreenOptions, view } = renderScreen({ page: tintPage });
  await view;
  expect(await screen.findByText('Next')).toBeTruthy();
  // The router makes the bar clear over it.
  expect(onScreenOptions.mock.calls.at(-1)[0]).toMatchObject({ backgroundTint: true });
  const layer = screen.getByTestId('screen_tint_0');
  // The scroll view stays the page's own first view, as the native stack finds it for the large
  // title and the bar's scroll edge.
  expect(screen.root.type).toBe('RCTScrollView');
  expect(flatStyle(screen.root).backgroundColor).toBe('#F2F2F7');
  // The tint is the scroll view's first content, behind the blocks, moved by the scroll offset
  // so it stays at the screen's top.
  const tint = screen.getByTestId('screen_tint');
  const [content] = screen.root.children;
  expect(content.children[0]).toBe(tint);
  expect(flatStyle(tint)).toMatchObject({ position: 'absolute', top: 0 });
  expect(flatStyle(tint).transform[0].translateY).toBe(0);
  expect(tint.props.pointerEvents).toBe('none');
  expect(flatStyle(layer)).toMatchObject({
    height: Dimensions.get('window').height * 0.15,
    position: 'absolute',
    top: 0,
  });
  // The colour at 35% at the top, easing out to clear at the bottom.
  const colors = tintColors(layer);
  expect(colors[0]).toBe(processColor('rgba(255, 122, 69, 0.35)'));
  expect(colors.at(-1)).toBe(processColor('rgba(255, 122, 69, 0)'));
});

test('a backgroundTint cross-fades to a new colour', async () => {
  const { view } = renderScreen({ page: tintPage });
  await view;
  await waitFor(400);
  await act(async () => {
    fireEvent.press(screen.getByText('Next'));
  });
  // The new tint fades in over the old one as it fades out.
  const incoming = await screen.findByTestId('screen_tint_1');
  expect(tintColors(incoming)[0]).toBe(processColor('rgba(22, 119, 255, 0.35)'));
  expect(screen.getByTestId('screen_tint_0')).toBeTruthy();
  // Faded out after 250ms, the old tint is gone.
  await waitFor(400);
  expect(screen.queryByTestId('screen_tint_0')).toBeNull();
  expect(screen.getByTestId('screen_tint_1')).toBeTruthy();
});

test('a backgroundTint draws colorDark at 45% in dark mode', async () => {
  const { host } = createFakeHost({ path: '/home' });
  await render(
    <LowdefyPage
      core={createCore()}
      host={host}
      pageConfig={buildPage(tintPage)}
      rootConfig={{ ...rootConfig, theme: { ...theme, darkMode: 'dark' } }}
      types={createTypes()}
    />
  );
  await screen.findByText('Next');
  expect(tintColors(screen.getByTestId('screen_tint_0'))[0]).toBe(
    processColor('rgba(124, 45, 18, 0.45)')
  );
});

test('a pinned headerBottom draws the backgroundTint in its surface, where the page draws it', async () => {
  const { view } = renderScreen({ headerInset: 150, page: tintPage });
  await view;
  await screen.findByText('Spaces');
  const strip = screen.getByTestId('home_header_bottom');
  const layer = within(strip).getByTestId('home_header_bottom_tint_0');
  expect(tintColors(layer)[0]).toBe(processColor('rgba(255, 122, 69, 0.35)'));
  // The surface reaches 1000pt above the strip, which pins at the bar's 150pt bottom edge.
  const [offset] = findAll(strip, (node) => flatStyle(node).transform?.[0]?.translateY === 850);
  expect(offset).toBeTruthy();
});

test('a Screen without a backgroundTint draws none', async () => {
  const { onScreenOptions, view } = renderScreen({
    page: { id: 'home', type: 'Screen', blocks: [{ id: 'body', type: 'Paragraph' }] },
  });
  await view;
  await act(async () => undefined);
  expect(screen.queryByTestId('screen_tint_0')).toBeNull();
  expect(onScreenOptions.mock.calls.at(-1)[0]).toMatchObject({ backgroundTint: false });
});

test('onRefresh turns on pull-to-refresh, refreshing until its actions finish', async () => {
  const record = jest.fn();
  let finish;
  const { view } = renderScreen({
    record,
    page: {
      id: 'home',
      type: 'Screen',
      events: {
        onRefresh: [{ id: 'reload', type: 'Record', params: { refreshed: true } }],
      },
      blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }],
    },
  });
  await view;
  expect(await screen.findByText('Body')).toBeTruthy();
  record.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const refresh = getRefreshControl();
  expect(refresh.props.refreshing).toBe(false);
  await act(async () => {
    refresh.props.onRefresh();
  });
  expect(record).toHaveBeenCalledWith({ refreshed: true });
  expect(getRefreshControl().props.refreshing).toBe(true);
  await act(async () => {
    finish();
  });
  expect(getRefreshControl().props.refreshing).toBe(false);
});

test('a page without onRefresh has no pull-to-refresh', async () => {
  const { view } = renderScreen({
    page: { id: 'home', type: 'Screen', blocks: [] },
  });
  await view;
  await act(async () => undefined);
  expect(getRefreshControl()).toBeUndefined();
});

test('onFocus fires after onMount on first show and each time the screen is shown again', async () => {
  const record = jest.fn();
  const { element, view } = renderScreen({
    record,
    page: {
      id: 'home',
      type: 'Screen',
      events: {
        onMount: [{ id: 'mount', type: 'Record', params: { event: 'mount' } }],
        onFocus: [{ id: 'focus', type: 'Record', params: { event: 'focus' } }],
      },
      blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }],
    },
  });
  const rendered = await view;
  expect(await screen.findByText('Body')).toBeTruthy();
  await act(async () => undefined);
  const events = () => record.mock.calls.map(([params]) => params.event);
  expect(events()).toEqual(['mount', 'focus']);
  // Another tab is picked, then this one again.
  await act(async () => {
    rendered.rerender(element(false));
  });
  await act(async () => {
    rendered.rerender(element(true));
  });
  expect(events()).toEqual(['mount', 'focus', 'focus']);
  // A render while shown is not a new focus.
  await act(async () => {
    rendered.rerender(element(true));
  });
  expect(events()).toEqual(['mount', 'focus', 'focus']);
});

test('a screen first rendered unfocused fires onFocus when it is first shown', async () => {
  const record = jest.fn();
  const { element, view } = renderScreen({
    focused: false,
    record,
    page: {
      id: 'home',
      type: 'Screen',
      events: { onFocus: [{ id: 'focus', type: 'Record', params: { event: 'focus' } }] },
      blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }],
    },
  });
  const rendered = await view;
  expect(await screen.findByText('Body')).toBeTruthy();
  expect(record).not.toHaveBeenCalled();
  await act(async () => {
    rendered.rerender(element(true));
  });
  expect(record).toHaveBeenCalledTimes(1);
});

test('a page tree mounted again onto its kept context while shown does not fire onFocus again', async () => {
  const record = jest.fn();
  const { host } = createFakeHost({
    path: '/home',
    response: { id: 'load', success: true, response: [{ name: 'Row 1' }] },
  });
  const core = createCore();
  const types = createTypes({ icons: { Plus: plus }, record });
  // onFocus loads the page, as a Screen's load chain does: a request, then state from it.
  const pageConfig = buildPage({
    id: 'home',
    type: 'Screen',
    requests: [{ id: 'load', type: 'MongoDBFind', payload: {} }],
    events: {
      onFocus: [
        { id: 'focus', type: 'Record', params: { event: 'focus' } },
        { id: 'fetch', type: 'Request', params: 'load' },
        { id: 'set', type: 'SetState', params: { rows: { _request: 'load' } } },
      ],
    },
    blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }],
  });
  // A shell mounts the page again (a new key) when the page's version changes; the route
  // instance, and so the page context, stays.
  const element = (version) => (
    <LowdefyPage
      core={core}
      focused={true}
      host={host}
      instanceId="route-1"
      key={version}
      onScreenOptions={jest.fn()}
      pageConfig={pageConfig}
      rootConfig={rootConfig}
      types={types}
    />
  );
  const rendered = await render(element('v1'));
  expect(await screen.findByText('Body')).toBeTruthy();
  await act(async () => undefined);
  await act(async () => {
    rendered.rerender(element('v2'));
  });
  expect(await screen.findByText('Body')).toBeTruthy();
  await act(async () => undefined);
  expect(record).toHaveBeenCalledTimes(1);
  expect(host.fetch).toHaveBeenCalledTimes(1);
});

test('a Screen footer is drawn below the scroll view, above the bottom inset', async () => {
  const { host } = createFakeHost({ path: '/home' });
  const page = buildPage({
    id: 'home',
    type: 'Screen',
    events: { onInit: [{ id: 'init', type: 'SetState', params: { label: 'Send' } }] },
    slots: {
      footer: {
        blocks: [
          {
            id: 'send',
            type: 'Button',
            properties: { title: { _state: 'label' } },
            events: {
              onClick: [{ id: 'sent', type: 'SetState', params: { label: 'Sent' } }],
            },
          },
        ],
      },
    },
    blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }],
  });
  await render(
    <LowdefyPage
      bottomInset={83}
      core={createCore()}
      host={host}
      pageConfig={page}
      rootConfig={rootConfig}
      types={createTypes()}
    />
  );
  expect(await screen.findByText('Send')).toBeTruthy();
  const footer = screen.getByTestId('screen-footer');
  const [scrollView] = findAll(screen.root, (node) => node.type === 'RCTScrollView');
  expect(findAll(footer, (node) => node.props?.children === 'Send')).not.toHaveLength(0);
  expect(findAll(scrollView, (node) => node.props?.children === 'Send')).toHaveLength(0);
  expect(findAll(scrollView, (node) => node.props?.children === 'Body')).not.toHaveLength(0);
  expect(StyleSheet.flatten(footer.props.style).borderTopWidth).toBe(StyleSheet.hairlineWidth);
  expect(findAll(footer, (node) => node.props?.style?.paddingBottom === 83)).not.toHaveLength(0);
  // The footer's blocks update with the page's state.
  await act(async () => {
    fireEvent.press(screen.getByText('Send'));
  });
  expect(await screen.findByText('Sent')).toBeTruthy();
});

test('a Screen without a footer draws none', async () => {
  const { view } = renderScreen({
    page: { id: 'home', type: 'Screen', blocks: [{ id: 'body', type: 'Paragraph' }] },
  });
  await view;
  await act(async () => undefined);
  expect(screen.queryByTestId('screen-footer')).toBeNull();
});

test('a block draws its own chrome in the footer of a Screen with no footer slot', async () => {
  const { host } = createFakeHost({ path: '/home' });
  const page = buildPage({
    id: 'home',
    type: 'Screen',
    blocks: [{ id: 'chat', type: 'FooterBar', properties: { label: 'Composer' } }],
  });
  const rendered = await render(
    <LowdefyPage
      bottomInset={83}
      core={createCore()}
      host={host}
      pageConfig={page}
      rootConfig={rootConfig}
      types={createTypes()}
    />
  );
  await act(async () => undefined);
  const footer = screen.getByTestId('screen-footer');
  expect(within(footer).getByTestId('chat-footer').props.children).toEqual('Composer');
  const [scrollView] = findAll(screen.root, (node) => node.type === 'RCTScrollView');
  expect(findAll(scrollView, (node) => node.props?.children === 'Composer')).toHaveLength(0);
  // The block is gone with its page, and its chrome with it.
  await act(async () => {
    rendered.unmount();
  });
  expect(screen.queryByTestId('screen-footer')).toBeNull();
});

test('a block streams a server call through the host with the bearer session', async () => {
  const { host } = createFakeHost({ path: '/home' });
  host.authTransport = 'bearer';
  host.tokenStore = { get: () => 'session-token', set: jest.fn(), clear: jest.fn() };
  await render(
    <LowdefyPage
      core={createCore()}
      host={host}
      pageConfig={buildPage({
        id: 'home',
        type: 'Screen',
        blocks: [{ id: 'chat', type: 'FooterBar', properties: { label: 'Composer' } }],
      })}
      rootConfig={rootConfig}
      types={createTypes()}
    />
  );
  await act(async () => {
    fireEvent.press(await screen.findByTestId('chat-press'));
  });
  expect(host.streamFetch).toHaveBeenCalledWith(
    'https://app.lowdefy.test/api/agent/home/assistant',
    { method: 'POST', headers: { Authorization: 'Bearer session-token' } }
  );
  expect(host.fetch).not.toHaveBeenCalledWith(
    'https://app.lowdefy.test/api/agent/home/assistant',
    expect.anything()
  );
});
