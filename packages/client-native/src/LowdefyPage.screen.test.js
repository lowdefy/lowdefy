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
import { act, fireEvent, render, screen } from '@testing-library/react-native';

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

function renderScreen({ focused = true, onScreenOptions = jest.fn(), page, record }) {
  const { host } = createFakeHost({ path: '/home' });
  const core = createCore();
  const types = createTypes({ icons: { Plus: plus }, record });
  const element = (isFocused) => (
    <LowdefyPage
      core={core}
      focused={isFocused}
      host={host}
      onScreenOptions={onScreenOptions}
      pageConfig={buildPage(page)}
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
