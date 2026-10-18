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
import { render } from '@testing-library/react-native';

import createAppSession from '../session/createAppSession.js';
import createCoreAuth from '../auth/createCoreAuth.js';
import createFakeServer from './createFakeServer.js';
import createMemoryCacheStore from './createMemoryCacheStore.js';
import createMemoryStore from '../host/createMemoryStore.js';
import createShellGlobals from '../host/createShellGlobals.js';
import createShellLocale from '../locale/createShellLocale.js';
import PageScreen from '../components/PageScreen.js';
import ShellContext from '../ShellContext.js';
import ShellThemeProvider from '../components/ShellThemeProvider.js';
import { shell } from './fixtures.js';

const apiBase = 'https://field.example.com';

/**
 * Renders a PageScreen at `path` as the shell does: one app's session synced with a fake server
 * holding `root` and `pages` ({ [path]: { pageConfig, etag } }), its host with the shell's
 * globals over in-memory stores, its locale, and the shell's theme provider. The test file mocks
 * expo-router.
 */
async function renderPageScreen({
  beforeRender = () => undefined,
  deviceLocales = ['en-US'],
  pages,
  path,
  query,
  root,
}) {
  const server = createFakeServer({ root, rootEtag: '"r1"', pages });
  const session = createAppSession({
    apiBase,
    app: { id: 'field' },
    cacheStore: createMemoryCacheStore(),
    fetch: server.fetch,
    kv: createMemoryStore(),
    tokenStore: { get: () => null },
  });
  await session.start();
  const storage = createMemoryStore();
  const clipboard = { setString: jest.fn(async () => undefined) };
  const globals = createShellGlobals({
    assign: jest.fn(),
    clipboard,
    fetch: server.fetch,
    getInstanceId: session.getCurrentInstanceId,
    getPath: session.getCurrentPath,
    origin: apiBase,
    storage,
  });
  const host = {
    authTransport: 'bearer',
    fetch: server.fetch,
    globals,
    onBuildChanged: jest.fn(),
    onCallerChanged: jest.fn(),
    router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
    sessionStorage: createMemoryStore(),
    storage,
    tokenStore: { get: () => null, set: jest.fn(), clear: jest.fn() },
    WebSocket: jest.fn(),
    websocketUrl: (apiPath) => apiPath.replace(/^http/, 'ws'),
  };
  const locale = createShellLocale({
    getDeviceLocales: () => deviceLocales,
    globals,
    session,
    storage,
  });
  const auth = {
    coreAuth: createCoreAuth({
      apiBase,
      fetch: server.fetch,
      getSession: () => session,
      tokenStore: host.tokenStore,
    }),
  };
  beforeRender({ session });
  await render(
    <ShellContext.Provider value={{ auth, host, locale, session, shell }}>
      <ShellThemeProvider>
        <PageScreen path={path} query={query} />
      </ShellThemeProvider>
    </ShellContext.Provider>
  );
  return { clipboard, host, locale, server, session, storage };
}

export default renderPageScreen;
