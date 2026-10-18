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

import { jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import dayjs from 'dayjs';

import { createRoot } from '../test/fixtures.js';
import helloJsEntries from '../../fixtures/hello.jsEntries.json';
import renderPageScreen from '../test/renderPageScreen.js';

const mockNavigation = { setOptions: jest.fn() };

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: () => false },
  useFocusEffect: (effect) => {
    const { useEffect: useReactEffect } = jest.requireActual('react');
    useReactEffect(effect, [effect]);
  },
  useNavigation: () => mockNavigation,
}));

const boxTypes = {
  blocks: [
    { type: 'Box', package: '@lowdefy/blocks-native', version: 7 },
    { type: 'Screen', package: '@lowdefy/blocks-native', version: 7 },
  ],
};

// A Screen page of Box blocks from the native block set.
function screenPage(pageId, title, blocks) {
  return {
    id: `page:${pageId}`,
    pageId,
    blockId: pageId,
    type: 'Screen',
    properties: { title },
    slots: {
      content: {
        blocks: (
          blocks ?? [
            { blockId: 'greeting', type: 'Box', properties: { content: `Hello from ${pageId}` } },
          ]
        ).map((block, index) => ({ id: `block:${pageId}:${block.blockId}:${index}`, ...block })),
      },
    },
  };
}

function renderPath(path, rootOverrides = {}) {
  return renderPageScreen({
    path,
    pages: {
      today: { pageConfig: screenPage('today', 'Today'), etag: '"p1"' },
      map: { pageConfig: screenPage('map', 'Map'), etag: '"p2"' },
    },
    root: createRoot({
      pageIndex: [
        { path: 'today', pageId: 'today', hash: 'h1', typesKey: 'screen' },
        { path: 'map', pageId: 'map', hash: 'h2', typesKey: 'newBlock' },
      ],
      typeSets: {
        screen: boxTypes,
        newBlock: { blocks: [{ type: 'Map', package: '@lowdefy/blocks-native', version: 7 }] },
      },
      ...rootOverrides,
    }),
  });
}

// One Screen page at "today", with the root's other fields as given.
function renderTodayPage({ blocks, deviceLocales, page = {}, root = {} }) {
  return renderPageScreen({
    deviceLocales,
    path: 'today',
    pages: {
      today: { pageConfig: { ...screenPage('today', 'Today', blocks), ...page }, etag: '"p1"' },
    },
    root: createRoot({
      pageIndex: [{ path: 'today', pageId: 'today', hash: 'h1', typesKey: 'screen' }],
      typeSets: { screen: boxTypes },
      ...root,
    }),
  });
}

test('a cached Screen page renders and reports its title to the stack header', async () => {
  const { session } = await renderPath('today');
  expect(await screen.findByText('Hello from today')).toBeTruthy();
  await waitFor(() =>
    expect(mockNavigation.setOptions).toHaveBeenCalledWith({
      headerRight: undefined,
      presentation: 'card',
      title: 'Today',
    })
  );
  expect(session.getCurrentPath()).toBe('/today');
});

test('a page needing a type the shell lacks shows the update screen', async () => {
  await renderPath('map');
  expect(await screen.findByText('Update the app to open this page')).toBeTruthy();
});

test('every page shows the update screen below minShellVersion', async () => {
  await renderPath('today', { minShellVersion: '99.0.0' });
  expect(await screen.findByTestId('shell-update')).toBeTruthy();
});

test('a path with no mobile page that the server does not have is not found', async () => {
  await renderPath('nowhere');
  expect(await screen.findByText('Page not found')).toBeTruthy();
});

function onClick(actions) {
  return { onClick: { try: actions, catch: [] } };
}

test('the app events and a page run their _js from the module text the build writes', async () => {
  await renderTodayPage({
    blocks: [
      {
        blockId: 'greeting',
        type: 'Box',
        properties: { content: { _js: 'HorPchxU3cTNYhB6dbx9DFcepx4=' } },
      },
      {
        blockId: 'year',
        type: 'Box',
        properties: { content: { _js: 'b+IYcPY3kW9J7YdZ4RyICtelfz8=' } },
      },
    ],
    page: { _jsEntries: helloJsEntries.today },
    root: {
      _jsEntries: helloJsEntries.app,
      events: {
        onInit: {
          try: [
            {
              id: 'set_greeting',
              type: 'SetGlobal',
              params: { greeting: { _js: 'yHZGzdxAuSQ8P5USi0AFFY81iNg=' } },
            },
          ],
          catch: [],
        },
      },
    },
  });
  expect(await screen.findByText('Hello from Lowdefy')).toBeTruthy();
  expect(screen.getByText(String(new Date().getFullYear()))).toBeTruthy();
});

test('pages take their style from the root theme and class map, and a dev page its own classes', async () => {
  const { host } = await renderTodayPage({
    blocks: [
      {
        blockId: 'panel',
        type: 'Box',
        class: { block: 'p-4 dark:bg-gray-900' },
        properties: { content: 'Panel' },
      },
      { blockId: 'big', type: 'Box', class: { block: 'text-xl' }, properties: { content: 'Big' } },
    ],
    page: { _classMap: { 'text-xl': { fontSize: 20 } } },
    root: {
      theme: { darkMode: 'dark', light: {}, dark: { colorPrimary: '#1668dc' } },
      classMap: {
        'p-4': { paddingTop: 16 },
        'bg-gray-100': { backgroundColor: '#f3f4f6' },
        'dark:bg-gray-900': { backgroundColor: '#101828' },
      },
    },
  });
  await screen.findByText('Panel');
  expect(StyleSheet.flatten(screen.getByTestId('panel').props.style)).toMatchObject({
    backgroundColor: '#101828',
    paddingTop: 16,
  });
  expect(StyleSheet.flatten(screen.getByTestId('big').props.style)).toMatchObject({ fontSize: 20 });
  expect(host.globals.window.__lowdefy_isDark).toBe(true);
});

const i18n = {
  defaultLocale: 'en-US',
  locales: [
    { code: 'en-US', dayjs: 'en' },
    { code: 'af-ZA', dayjs: 'af' },
  ],
  messages: { 'en-US': { hello: 'Hello' }, 'af-ZA': { hello: 'Hallo' } },
};

test('a page translates with the root i18n in the device locale the app supports', async () => {
  await renderTodayPage({
    blocks: [{ blockId: 'greeting', type: 'Box', properties: { content: { _t: 'hello' } } }],
    deviceLocales: ['af-NA'],
    root: { i18n },
  });
  expect(await screen.findByText('Hallo')).toBeTruthy();
  expect(dayjs.locale()).toBe('af');
});

test('SetLocale changes the locale the page translates with, and the device keeps it', async () => {
  const { storage } = await renderTodayPage({
    blocks: [
      { blockId: 'greeting', type: 'Box', properties: { content: { _t: 'hello' } } },
      {
        blockId: 'switch',
        type: 'Box',
        properties: { content: 'Afrikaans' },
        events: onClick([{ id: 'af', type: 'SetLocale', params: { locale: 'af-ZA' } }]),
      },
    ],
    root: { i18n },
  });
  expect(await screen.findByText('Hello')).toBeTruthy();
  fireEvent.press(screen.getByText('Afrikaans'));
  expect(await screen.findByText('Hallo')).toBeTruthy();
  expect(storage.get('lowdefy:field::lowdefy_locale')).toBe('af-ZA');
});

test('the local storage actions keep a value under the app key in the device store', async () => {
  const { storage } = await renderTodayPage({
    blocks: [
      {
        blockId: 'saved',
        type: 'Box',
        properties: { content: { _if_none: [{ _state: 'draft.title' }, 'none'] } },
      },
      {
        blockId: 'save',
        type: 'Box',
        properties: { content: 'Save' },
        events: onClick([
          {
            id: 'set',
            type: 'SetLocalStorage',
            params: { key: 'draft', value: { title: 'Pump' } },
          },
          { id: 'get', type: 'GetLocalStorage', params: { key: 'draft' } },
          { id: 'state', type: 'SetState', params: { draft: { _actions: 'get.response' } } },
        ]),
      },
    ],
  });
  expect(await screen.findByText('none')).toBeTruthy();
  fireEvent.press(screen.getByText('Save'));
  expect(await screen.findByText('Pump')).toBeTruthy();
  expect(storage.get('lowdefy:field::draft')).toBe('{"title":"Pump"}');
});

test('CopyToClipboard copies through the shell clipboard', async () => {
  const { clipboard } = await renderTodayPage({
    blocks: [
      {
        blockId: 'copy',
        type: 'Box',
        properties: { content: 'Copy' },
        events: onClick([{ id: 'copy', type: 'CopyToClipboard', params: { copy: 'JOB-42' } }]),
      },
    ],
  });
  fireEvent.press(await screen.findByText('Copy'));
  await waitFor(() => expect(clipboard.setString.mock.calls).toEqual([['JOB-42']]));
});

test('ListOrganizations and SetActiveOrganization call the app server over the bearer client', async () => {
  const { server, session } = await renderTodayPage({
    blocks: [
      {
        blockId: 'orgs',
        type: 'Box',
        properties: { content: { _if_none: [{ _state: 'org' }, 'none'] } },
      },
      {
        blockId: 'list',
        type: 'Box',
        properties: { content: 'List' },
        events: onClick([
          { id: 'memberships', type: 'ListOrganizations' },
          {
            id: 'state',
            type: 'SetState',
            params: { org: { _actions: 'memberships.response.1.name' } },
          },
        ]),
      },
      {
        blockId: 'switch',
        type: 'Box',
        properties: { content: 'Switch' },
        events: onClick([
          { id: 'activate', type: 'SetActiveOrganization', params: { organizationId: 'org-2' } },
          { id: 'resync', type: 'UpdateSession' },
        ]),
      },
    ],
  });
  server.state.auth = ({ path }) => {
    if (path === '/organization/list') {
      return {
        body: [
          { id: 'org-1', name: 'Acme' },
          { id: 'org-2', name: 'Globex' },
        ],
      };
    }
    if (path === '/organization/set-active') {
      server.state.user = { id: 'ana', organization_id: 'org-2', roles: [] };
      return { body: { id: 'org-2', name: 'Globex' } };
    }
    return { body: { session: { id: 's1' }, user: { id: 'ana' } } };
  };
  fireEvent.press(await screen.findByText('List'));
  expect(await screen.findByText('Globex')).toBeTruthy();
  fireEvent.press(screen.getByText('Switch'));
  await waitFor(() => expect(session.getState().user?.organization_id).toBe('org-2'));
  const authPaths = server.fetch.mock.calls
    .map(([url]) => new URL(url).pathname)
    .filter((pathname) => pathname.startsWith('/api/auth/'));
  expect(authPaths).toEqual([
    '/api/auth/organization/list',
    '/api/auth/organization/set-active',
    '/api/auth/get-session',
  ]);
});

function findAll(node, predicate, found = []) {
  if (node === null || typeof node === 'string') return found;
  if (predicate(node)) found.push(node);
  (node.children ?? []).forEach((child) => findAll(child, predicate, found));
  return found;
}

test('an Icon block draws the icon data the page carries', async () => {
  const housePath = 'M3 10a2 2 0 0 1 .709-1.528l7-6';
  await renderTodayPage({
    blocks: [{ blockId: 'home', type: 'Icon', properties: { name: 'House' } }],
    page: { _icons: { House: { node: [['path', { d: housePath }]] } } },
  });
  const icon = await screen.findByLabelText('House');
  expect(findAll(icon, (node) => node.props?.d === housePath)).not.toHaveLength(0);
});
