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
import { render, screen, waitFor } from '@testing-library/react-native';
import { createNativeGlobals } from '@lowdefy/client-native';

import createAppSession from '../session/createAppSession.js';
import createFakeServer from '../test/createFakeServer.js';
import createMemoryCacheStore from '../test/createMemoryCacheStore.js';
import createMemoryStore from '../host/createMemoryStore.js';
import PageScreen from './PageScreen.js';
import ShellContext from '../ShellContext.js';
import { createRoot, shell } from '../test/fixtures.js';

const mockNavigation = { setOptions: jest.fn() };

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: () => false },
  useFocusEffect: (effect) => {
    const { useEffect: useReactEffect } = jest.requireActual('react');
    useReactEffect(effect, [effect]);
  },
  useNavigation: () => mockNavigation,
}));

const apiBase = 'https://field.example.com';

// Pages of the types the shell carries so far: Screen and Box.
function screenPage(pageId, title) {
  return {
    id: `page:${pageId}`,
    pageId,
    blockId: pageId,
    type: 'Screen',
    properties: { title },
    slots: {
      content: {
        blocks: [
          {
            id: `block:${pageId}:greeting:0`,
            blockId: 'greeting',
            type: 'Box',
            properties: { content: `Hello from ${pageId}` },
          },
        ],
      },
    },
  };
}

async function renderPath(path, rootOverrides = {}) {
  const server = createFakeServer({
    root: createRoot({
      pageIndex: [
        { path: 'today', pageId: 'today', hash: 'h1', typesKey: 'screen' },
        { path: 'map', pageId: 'map', hash: 'h2', typesKey: 'newBlock' },
      ],
      typeSets: {
        screen: {
          blocks: [
            { type: 'Box', package: '@lowdefy/blocks-native', version: 7 },
            { type: 'Screen', package: '@lowdefy/blocks-native', version: 7 },
          ],
        },
        newBlock: { blocks: [{ type: 'Map', package: '@lowdefy/blocks-native', version: 7 }] },
      },
      ...rootOverrides,
    }),
    rootEtag: '"r1"',
    pages: {
      today: { pageConfig: screenPage('today', 'Today'), etag: '"p1"' },
      map: { pageConfig: screenPage('map', 'Map'), etag: '"p2"' },
    },
  });
  const session = createAppSession({
    apiBase,
    app: { id: 'field' },
    cacheStore: createMemoryCacheStore(),
    fetch: server.fetch,
    kv: createMemoryStore(),
    tokenStore: { get: () => null },
  });
  await session.start();
  const host = {
    authTransport: 'bearer',
    fetch: server.fetch,
    globals: createNativeGlobals({
      assign: jest.fn(),
      fetch: server.fetch,
      getPath: session.getCurrentPath,
      origin: apiBase,
    }),
    onBuildChanged: jest.fn(),
    onCallerChanged: jest.fn(),
    router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
    sessionStorage: createMemoryStore(),
    storage: createMemoryStore(),
    tokenStore: { get: () => null, set: jest.fn(), clear: jest.fn() },
    WebSocket: jest.fn(),
    websocketUrl: (apiPath) => apiPath.replace(/^http/, 'ws'),
  };
  await render(
    <ShellContext.Provider value={{ host, session, shell }}>
      <PageScreen path={path} />
    </ShellContext.Provider>
  );
  return { session };
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
