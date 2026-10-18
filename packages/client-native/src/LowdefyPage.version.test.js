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

// A screen's page as the shell gives it: one config object per version of the page, on one route
// instance. A new version arrives while the screen shows the old one (a background fetch after
// the cached version showed, a deploy, or the dev server's rebuild).

const rootConfig = {
  classMap: {},
  home: { configured: true, pageId: 'home' },
  lowdefyApp: { slug: 'test-app' },
  menus: [],
  pagePaths: { home: 'home' },
  theme,
};

function designPage({ heading }) {
  return buildPage({
    id: 'home',
    type: 'Box',
    events: {
      onInit: [
        { id: 'init', type: 'Record', params: { event: 'init' } },
        { id: 'set', type: 'SetState', params: { note: 'fresh' } },
      ],
    },
    blocks: [
      { id: 'heading', type: 'Title', properties: { content: heading } },
      { id: 'note', type: 'Paragraph', properties: { content: { _state: 'note' } } },
      {
        id: 'edit',
        type: 'Button',
        properties: { title: 'Edit' },
        events: { onClick: [{ id: 'edit', type: 'SetState', params: { note: 'edited' } }] },
      },
    ],
  });
}

function renderScreen() {
  const record = jest.fn();
  const { host } = createFakeHost({ path: '/home' });
  const core = {
    apiBase: 'https://app.lowdefy.test',
    auth: { authConfig: {} },
    basePath: '',
    lowdefy: { buildId: 'build-1' },
  };
  const types = createTypes({ record });
  const element = ({ instanceId = 'route-1', pageConfig }) => (
    <LowdefyPage
      core={core}
      host={host}
      instanceId={instanceId}
      pageConfig={pageConfig}
      rootConfig={rootConfig}
      types={types}
    />
  );
  const inits = () => record.mock.calls.filter(([params]) => params.event === 'init').length;
  const scrollView = () => host.globals.elements.find({ kind: 'scroll', pageId: 'home' });
  return { element, inits, scrollView };
}

test('a new version of the page replaces the shown one on its screen, without a new visit', async () => {
  const { element, inits, scrollView } = renderScreen();
  const v1 = designPage({ heading: 'Version 1' });
  const view = await render(element({ pageConfig: v1 }));
  expect(await screen.findByText('Version 1')).toBeTruthy();
  const firstScrollView = scrollView();
  await act(async () => {
    fireEvent.press(screen.getByText('Edit'));
  });
  expect(screen.getByText('edited')).toBeTruthy();

  // The same version rendered again keeps the page as it is.
  await act(async () => {
    view.rerender(element({ pageConfig: v1 }));
  });
  expect(screen.getByText('edited')).toBeTruthy();
  expect(inits()).toBe(1);

  // A new version rebuilds the page context once, on the same screen and scroll view.
  await act(async () => {
    view.rerender(element({ pageConfig: designPage({ heading: 'Version 2' }) }));
  });
  expect(await screen.findByText('Version 2')).toBeTruthy();
  expect(screen.queryByText('Version 1')).toBeNull();
  expect(screen.getByText('fresh')).toBeTruthy();
  expect(inits()).toBe(2);
  expect(scrollView()).toBe(firstScrollView);
});
