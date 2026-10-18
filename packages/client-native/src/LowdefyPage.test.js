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
import { Dimensions, Linking, StyleSheet, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getBreakpoint } from '@lowdefy/layout-native';

import buildPage from './test/buildPage.js';
import createFakeHost from './test/createFakeHost.js';
import createTypes from './test/createTypes.js';
import describeBlock from './trace/describeBlock.js';
import LowdefyPage from './LowdefyPage.js';
import theme from './test/theme.json';

const rootConfig = {
  classMap: {},
  home: { configured: true, pageId: 'home' },
  lowdefyApp: { slug: 'test-app' },
  menus: [],
  pagePaths: { home: 'home', orders: 'orders' },
  theme,
};

async function renderPage({ onScreenOptions, pageConfig, record, response }) {
  const { host, route } = createFakeHost({ path: `/${pageConfig.id}`, response });
  const lowdefy = { buildId: 'build-1' };
  const core = {
    apiBase: 'https://app.lowdefy.test',
    auth: { authConfig: {} },
    basePath: '',
    lowdefy,
  };
  await render(
    <LowdefyPage
      core={core}
      host={host}
      onScreenOptions={onScreenOptions}
      pageConfig={buildPage(pageConfig)}
      rootConfig={rootConfig}
      types={createTypes({ record })}
    />
  );
  return { host, lowdefy, route };
}

const greetingPage = {
  id: 'home',
  type: 'Box',
  events: {
    onInit: [{ id: 'init', type: 'SetState', params: { greeting: 'Hello' } }],
  },
  blocks: [
    { id: 'title', type: 'Title', properties: { content: { _state: 'greeting' } } },
    {
      id: 'say_hi',
      type: 'Button',
      properties: { title: 'Say hi' },
      events: {
        onClick: [{ id: 'set', type: 'SetState', params: { greeting: 'Hi there' } }],
      },
    },
  ],
};

test('the tests run with no window or document', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
});

test('a page with a Box, a Title and a Button renders', async () => {
  await renderPage({ pageConfig: greetingPage });
  expect(await screen.findByText('Hello')).toBeTruthy();
  expect(screen.getByText('Say hi')).toBeTruthy();
});

test('every block has its block id as testID and accessibilityLabel', async () => {
  await renderPage({
    pageConfig: {
      ...greetingPage,
      blocks: [
        ...greetingPage.blocks,
        { id: 'inner', type: 'Box', blocks: [{ id: 'note', type: 'Paragraph' }] },
      ],
    },
  });
  await screen.findByText('Hello');
  ['home', 'title', 'say_hi', 'inner', 'note'].forEach((blockId) => {
    expect(screen.getByTestId(blockId).props.accessibilityLabel).toBe(blockId);
  });
});

test('onClick runs a SetState that changes a Title', async () => {
  await renderPage({ pageConfig: greetingPage });
  await screen.findByText('Hello');
  await act(async () => {
    fireEvent.press(screen.getByText('Say hi'));
  });
  expect(await screen.findByText('Hi there')).toBeTruthy();
  expect(screen.queryByText('Hello')).toBeNull();
});

// A shell can show one page instance on two screens at once (in two tabs' stacks, or pushed
// again over itself). Both share the page's context, and both re-render when it changes.
test('one page mounted twice re-renders both copies, and the other after one unmounts', async () => {
  const { host } = createFakeHost({ path: '/home' });
  const core = {
    apiBase: 'https://app.lowdefy.test',
    auth: { authConfig: {} },
    basePath: '',
    lowdefy: { buildId: 'build-1' },
  };
  const pageConfig = buildPage({
    ...greetingPage,
    blocks: [
      ...greetingPage.blocks,
      {
        id: 'say_bye',
        type: 'Button',
        properties: { title: 'Say bye' },
        events: {
          onClick: [{ id: 'set', type: 'SetState', params: { greeting: 'Bye' } }],
        },
      },
    ],
  });
  const types = createTypes();
  const page = (key) => (
    <LowdefyPage
      key={key}
      core={core}
      host={host}
      pageConfig={pageConfig}
      rootConfig={rootConfig}
      types={types}
    />
  );
  const view = await render(
    <>
      {page('tab')}
      {page('pushed')}
    </>
  );
  expect(await screen.findAllByText('Hello')).toHaveLength(2);
  await act(async () => {
    fireEvent.press(screen.getAllByText('Say hi')[1]);
  });
  expect(await screen.findAllByText('Hi there')).toHaveLength(2);
  expect(screen.queryByText('Hello')).toBeNull();

  // The pushed copy is popped: the tab's copy still re-renders.
  await act(async () => {
    view.rerender(<>{page('tab')}</>);
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Say bye'));
  });
  expect(await screen.findByText('Bye')).toBeTruthy();
});

test('visible: false hides a block and its children', async () => {
  await renderPage({
    pageConfig: {
      ...greetingPage,
      blocks: [
        ...greetingPage.blocks,
        {
          id: 'hidden',
          type: 'Box',
          visible: false,
          blocks: [{ id: 'secret', type: 'Paragraph', properties: { content: 'Secret' } }],
        },
      ],
    },
  });
  await screen.findByText('Hello');
  expect(screen.queryByTestId('hidden')).toBeNull();
  expect(screen.queryByText('Secret')).toBeNull();
});

// As on the web, a block's children render (loading) while its onMount runs, so React starts a
// child's onMount first. Every onMount waits for the page's onInit.
test('onInit runs before the page and its blocks fire onMount', async () => {
  const calls = [];
  const record = (params) => calls.push(params);
  await renderPage({
    record,
    pageConfig: {
      id: 'home',
      type: 'Box',
      events: {
        onInit: [{ id: 'a', type: 'Record', params: 'page onInit' }],
        onInitAsync: [{ id: 'b', type: 'Record', params: 'page onInitAsync' }],
        onMount: [{ id: 'c', type: 'Record', params: 'page onMount' }],
      },
      blocks: [
        {
          id: 'title',
          type: 'Title',
          properties: { content: 'Mounted' },
          events: { onMount: [{ id: 'd', type: 'Record', params: 'title onMount' }] },
        },
      ],
    },
  });
  await screen.findByText('Mounted');
  expect(calls[0]).toBe('page onInit');
  expect(calls).toHaveLength(4);
  expect(calls).toEqual(
    expect.arrayContaining(['page onInitAsync', 'page onMount', 'title onMount'])
  );
});

test('a Request action calls the server through the core and the host fetch', async () => {
  const { host } = await renderPage({
    response: { id: 'get_orders', success: true, response: [{ name: 'Order 1' }] },
    pageConfig: {
      id: 'orders',
      type: 'Box',
      requests: [{ id: 'get_orders', type: 'MongoDBFind', payload: { status: 'open' } }],
      blocks: [
        {
          id: 'load',
          type: 'Button',
          properties: { title: 'Load' },
          events: { onClick: [{ id: 'fetch', type: 'Request', params: 'get_orders' }] },
        },
        {
          id: 'first',
          type: 'Paragraph',
          properties: { content: { _request: 'get_orders.0.name' } },
        },
      ],
    },
  });
  await screen.findByText('Load');
  await act(async () => {
    fireEvent.press(screen.getByText('Load'));
  });
  expect(await screen.findByText('Order 1')).toBeTruthy();
  expect(host.fetch).toHaveBeenCalledTimes(1);
  const [url, init] = host.fetch.mock.calls[0];
  expect(url).toBe('https://app.lowdefy.test/api/request/orders/get_orders');
  expect(init.method).toBe('POST');
  expect(init.headers['x-lowdefy-build']).toBe('build-1');
  expect(JSON.parse(init.body)).toEqual({
    actionId: 'fetch',
    blockId: 'load',
    payload: { status: 'open' },
  });
});

test('a Link action to a page pushes its path on the host router', async () => {
  const { host } = await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      blocks: [
        {
          id: 'open',
          type: 'Button',
          properties: { title: 'Open orders' },
          events: {
            onClick: [{ id: 'go', type: 'Link', params: { pageId: 'orders', urlQuery: { a: 1 } } }],
          },
        },
      ],
    },
  });
  await act(async () => {
    fireEvent.press(await screen.findByText('Open orders'));
  });
  expect(host.router.push).toHaveBeenCalledWith(
    expect.objectContaining({ pathname: '/orders', query: 'a=1' })
  );
});

test('the engine reads the route and the window size through the native host globals', async () => {
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      blocks: [
        {
          id: 'where',
          type: 'Paragraph',
          properties: { content: { _location: 'pathname' } },
        },
        {
          id: 'size',
          type: 'Paragraph',
          properties: { content: { '_string.concat': ['size ', { _media: 'size' }] } },
        },
      ],
    },
  });
  expect(await screen.findByText('/home')).toBeTruthy();
  const { width, height } = Dimensions.get('window');
  expect(screen.getByText(`size ${getBreakpoint({ width, height })}`)).toBeTruthy();
});

test('a Screen page reports its header options and renders its headerRight slot', async () => {
  const onScreenOptions = jest.fn();
  await renderPage({
    onScreenOptions,
    pageConfig: {
      id: 'home',
      type: 'Screen',
      properties: { title: 'Jobs', presentation: 'modal' },
      slots: {
        content: { blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }] },
        headerRight: {
          blocks: [{ id: 'add', type: 'Button', properties: { title: 'Add' } }],
        },
      },
    },
  });
  expect(await screen.findByText('Body')).toBeTruthy();
  expect(screen.queryByText('Add')).toBeNull();
  expect(onScreenOptions).toHaveBeenCalledWith({
    headerActions: [],
    headerBottom: false,
    headerLeft: undefined,
    headerRight: expect.any(Function),
    headerSearch: undefined,
    largeTitle: false,
    presentation: 'modal',
    title: 'Jobs',
  });
  const { headerRight } = onScreenOptions.mock.calls.at(-1)[0];
  await render(headerRight());
  expect(await screen.findByText('Add')).toBeTruthy();
  expect(screen.getByTestId('add')).toBeTruthy();
});

test('a loading block shows its skeleton in its place', async () => {
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      blocks: [
        {
          id: 'slow',
          type: 'Paragraph',
          loading: true,
          properties: { content: 'Loaded' },
          skeleton: {
            id: 'sk',
            type: 'Box',
            slots: {
              content: {
                blocks: [{ id: 'sk_text', type: 'Paragraph', properties: { content: 'Loading' } }],
              },
            },
          },
        },
      ],
    },
  });
  expect(await screen.findByText('Loading')).toBeTruthy();
  expect(screen.queryByText('Loaded')).toBeNull();
});

test('a block fades its content in when it stops loading, after showing its skeleton', async () => {
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      events: { onInit: [{ id: 'init', type: 'SetState', params: { busy: true } }] },
      blocks: [
        {
          id: 'slow',
          type: 'Paragraph',
          loading: { _state: 'busy' },
          properties: { content: 'Loaded' },
          skeleton: { id: 'sk', type: 'Paragraph', properties: { content: 'Loading' } },
        },
        { id: 'steady', type: 'Paragraph', properties: { content: 'Steady' } },
        {
          id: 'done',
          type: 'Button',
          properties: { title: 'Done' },
          events: { onClick: [{ id: 'stop', type: 'SetState', params: { busy: false } }] },
        },
      ],
    },
  });
  expect(await screen.findByText('Loading')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByText('Done'));
  });
  expect(await screen.findByText('Loaded')).toBeTruthy();
  expect(StyleSheet.flatten(screen.getByTestId('slow').props.style).opacity).toBeDefined();
  expect(StyleSheet.flatten(screen.getByTestId('steady').props.style)?.opacity).toBeUndefined();
});

test('an input block gets its value from state', async () => {
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      events: { onInit: [{ id: 'init', type: 'SetState', params: { name: 'Ada' } }] },
      blocks: [{ id: 'name', type: 'TextInput' }],
    },
  });
  expect((await screen.findByTestId('text-input-value')).props.children).toBe('Ada');
});

test('describeBlock describes a block of the shown page by its id', async () => {
  const { lowdefy } = await renderPage({ pageConfig: greetingPage });
  await screen.findByText('Hello');
  expect(describeBlock({ blockId: 'say_hi', lowdefy })).toEqual({
    page_id: 'home',
    block_id: 'say_hi',
    block_type: 'Button',
    row: null,
    column: null,
    text: null,
    nth: null,
    option: false,
    block_ids: ['say_hi'],
  });
});

test('a link component follows its link through the host router', async () => {
  const { lowdefy } = await renderPage({ pageConfig: greetingPage });
  await screen.findByText('Hello');
  const { Link } = lowdefy._internal.components;
  await render(
    <Link pageId="orders" testID="orders-link">
      <Text>Orders</Text>
    </Link>
  );
  await act(async () => {
    fireEvent.press(screen.getByText('Orders'));
  });
  expect(lowdefy._internal.router.push).toHaveBeenCalledWith(
    expect.objectContaining({ pathname: '/orders' })
  );
});

test('a link to another site opens through the system', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const { lowdefy } = await renderPage({ pageConfig: greetingPage });
  await screen.findByText('Hello');
  lowdefy._internal.link({ url: 'https://example.com/help', urlQuery: { q: 1 } });
  expect(openURL).toHaveBeenCalledWith('https://example.com/help?q=1');
  lowdefy._internal.link({ back: true });
  expect(lowdefy._internal.router.back).toHaveBeenCalledTimes(1);
  openURL.mockRestore();
});

test('a list block draws its slot once per item in state', async () => {
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      events: {
        onInit: [
          { id: 'init', type: 'SetState', params: { items: [{ name: 'One' }, { name: 'Two' }] } },
        ],
      },
      blocks: [
        {
          id: 'items',
          type: 'List',
          blocks: [
            {
              id: 'items.$.label',
              type: 'Paragraph',
              properties: { content: { _state: 'items.$.name' } },
            },
          ],
        },
      ],
    },
  });
  expect(await screen.findByText('One')).toBeTruthy();
  expect(screen.getByText('Two')).toBeTruthy();
  expect(screen.getByTestId('items.0.label')).toBeTruthy();
});

test('a page registers its scroll view and block views for native actions by block id', async () => {
  const { host } = await renderPage({ pageConfig: greetingPage });
  const { elements } = host.globals;
  expect(elements.find({ kind: 'scroll', pageId: 'home' })).not.toBeNull();
  expect(elements.find({ blockId: 'say_hi', kind: 'view', pageId: 'home' })).not.toBeNull();
  expect(elements.find({ blockId: 'say_hi', kind: 'view', pageId: 'other' })).toBeNull();
  await screen.unmount();
  expect(elements.find({ kind: 'scroll', pageId: 'home' })).toBeNull();
  expect(elements.find({ blockId: 'say_hi', kind: 'view', pageId: 'home' })).toBeNull();
});
