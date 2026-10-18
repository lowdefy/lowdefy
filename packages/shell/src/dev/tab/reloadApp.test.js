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
import { act, screen } from '@testing-library/react-native';

import getShownPage from './getShownPage.js';
import reloadApp from './reloadApp.js';
import renderPageScreen from '../../test/renderPageScreen.js';
import { createRoot } from '../../test/fixtures.js';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

jest.mock('expo-router', () => ({
  DarkTheme: { fonts: {} },
  DefaultTheme: { fonts: {} },
  ThemeProvider: ({ children }) => children,
  router: { back: jest.fn(), canGoBack: () => false },
  useFocusEffect: (effect) => {
    const { useEffect: useReactEffect } = jest.requireActual('react');
    useReactEffect(effect, [effect]);
  },
  useIsFocused: () => true,
  useNavigation: () => ({ setOptions: jest.fn() }),
  useRoute: () => ({ key: 'route-1' }),
}));

function todayPage(greeting) {
  return {
    id: 'page:today',
    pageId: 'today',
    blockId: 'today',
    type: 'Screen',
    properties: { title: 'Today' },
    slots: {
      content: {
        blocks: [
          {
            id: 'block:today:greeting:0',
            blockId: 'greeting',
            type: 'Box',
            properties: { content: greeting },
          },
        ],
      },
    },
  };
}

// A dev root: its pages have no hash, so the shell fetches them on each visit.
async function renderDevPage() {
  const { server, session } = await renderPageScreen({
    path: 'today',
    root: createRoot({
      pageIndex: [{ path: 'today', pageId: 'today', hash: null, typesKey: 'screen' }],
      typeSets: {
        screen: {
          blocks: [
            { type: 'Box', package: '@lowdefy/blocks-native', version: 7 },
            { type: 'Screen', package: '@lowdefy/blocks-native', version: 7 },
          ],
        },
      },
    }),
    pages: { today: { pageConfig: todayPage('Hello'), etag: '"p1"' } },
  });
  await screen.findByText('Hello');
  return { server, session };
}

test('a reload refetches the root and the page on screen, and rebuilds it with empty state', async () => {
  const { server, session } = await renderDevPage();
  const before = session.getState().lowdefy;
  const shown = getShownPage(before);
  // The screen's page context is keyed by its route instance.
  expect(shown).toEqual({ pageId: 'today', pathParams: {}, instanceKey: 'page:today@route-1' });
  before.contexts[shown.instanceKey]._internal.State.set('typed', 'Quarterly');
  expect(before.contexts[shown.instanceKey].state.typed).toBe('Quarterly');

  server.state.pages.today = { pageConfig: todayPage('Hello again'), etag: '"p2"' };
  server.state.rootEtag = '"r2"';
  server.fetch.mockClear();
  await act(async () => {
    await reloadApp({ session });
  });

  const paths = server.fetch.mock.calls.map(([url]) => new URL(url).pathname);
  expect(paths).toEqual(['/api/page/today', '/api/mobile/root', '/api/user']);
  expect(await screen.findByText('Hello again')).toBeTruthy();
  expect(session.getCurrentPath()).toBe('/today');
  const after = session.getState().lowdefy;
  expect(after).not.toBe(before);
  expect(after.contexts[shown.instanceKey].state.typed).toBeUndefined();
});
