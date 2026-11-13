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

import { expect, test, vi } from 'vitest';
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';

import buildPage from './test/buildPage.js';
import createFakeHost from './test/createFakeHost.js';
import createTypes from './test/createTypes.js';
import LowdefyPage from './LowdefyPage.js';
import theme from './test/theme.json';

function findAll(node, predicate, found = []) {
  if (node === null || typeof node === 'string') return found;
  if (predicate(node)) found.push(node);
  (node.children ?? []).forEach((child) => findAll(child, predicate, found));
  return found;
}

const rootConfig = {
  classMap: {},
  home: { configured: true, pageId: 'home' },
  lowdefyApp: { slug: 'test-app' },
  menus: [],
  pagePaths: { home: 'home' },
  theme,
};

test('a Screen with onRefresh whose onMount sets state runs onMount once', async () => {
  const record = vi.fn();
  const { host } = createFakeHost({ path: '/home' });
  await render(
    <LowdefyPage
      core={{
        apiBase: 'https://app.lowdefy.test',
        auth: { authConfig: {} },
        basePath: '',
        lowdefy: { buildId: 'build-1' },
      }}
      host={host}
      pageConfig={buildPage({
        id: 'home',
        type: 'Screen',
        events: {
          onMount: [
            { id: 'mount', type: 'Record', params: { event: 'mount' } },
            { id: 'loaded', type: 'SetState', params: { loaded: true } },
          ],
          onRefresh: [{ id: 'refresh', type: 'Record', params: { event: 'refresh' } }],
        },
        blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }],
      })}
      rootConfig={rootConfig}
      types={createTypes({ record })}
    />
  );
  expect(await screen.findByText('Body')).toBeTruthy();
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
  expect(record.mock.calls.map(([params]) => params.event)).toEqual(['mount']);
  const [scrollView] = findAll(screen.root, (node) => node.props?.refreshControl !== undefined);
  expect(scrollView.props.refreshControl.props.testID).toBe('screen-refresh');
});
