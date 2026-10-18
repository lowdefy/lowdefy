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
import { act, render, screen } from '@testing-library/react-native';

import buildPage from './test/buildPage.js';
import createFakeHost from './test/createFakeHost.js';
import createTypes from './test/createTypes.js';
import LowdefyPage from './LowdefyPage.js';
import theme from './test/theme.json';

// A screen's page as the shell gives it, on one route instance.

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

function findScroll(node) {
  if (node === null || typeof node === 'string') return null;
  if (node.props?.keyboardDismissMode !== undefined) return node;
  return (node.children ?? []).map(findScroll).find((found) => found !== null) ?? null;
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

test('a new route instance gets a scroll view of its own, from the top', async () => {
  const { element, scrollView } = renderScreen();
  const page = designPage({ heading: 'Design' });
  const view = await render(element({ instanceId: 'route-1', pageConfig: page }));
  expect(await screen.findByText('Design')).toBeTruthy();
  const firstScrollView = scrollView();
  await act(async () => {
    view.rerender(element({ instanceId: 'route-1', pageConfig: page }));
  });
  expect(scrollView()).toBe(firstScrollView);
  await act(async () => {
    view.rerender(element({ instanceId: 'route-2', pageConfig: page }));
  });
  expect(await screen.findByText('Design')).toBeTruthy();
  expect(scrollView()).not.toBe(firstScrollView);
});

test('dragging the page dismisses the keyboard, and a tap reaches a row while it is up', async () => {
  const { element } = renderScreen();
  await render(element({ pageConfig: designPage({ heading: 'Design' }) }));
  expect(await screen.findByText('Design')).toBeTruthy();
  const scroll = findScroll(screen.root);
  expect(scroll.props.keyboardDismissMode).toBe('on-drag');
  expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
});
