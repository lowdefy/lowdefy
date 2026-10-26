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

import ScrollTo from './ScrollTo.js';

const methods = { getPageId: () => 'home' };

// A ScrollView 600 high, and a block view 100 high at 1000 in its content.
function createPage({ withView = true } = {}) {
  const innerView = { name: 'content' };
  const scrollView = {
    getInnerViewRef: () => innerView,
    getNativeScrollRef: () => ({ measure: (callback) => callback(0, 0, 400, 600) }),
    scrollTo: jest.fn(),
  };
  const view = {
    measureLayout: jest.fn((relativeTo, onSuccess) => onSuccess(0, 1000, 400, 100)),
  };
  const registered = {
    'scroll:home:': scrollView,
    ...(withView ? { 'view:home:jobs': view } : {}),
  };
  const globals = {
    elements: {
      find: ({ blockId, kind, pageId }) => registered[`${kind}:${pageId}:${blockId ?? ''}`] ?? null,
    },
  };
  return { globals, innerView, scrollView, view };
}

test('ScrollTo throws without params', async () => {
  await expect(ScrollTo({ globals: createPage().globals, methods })).rejects.toThrow(
    'Invalid ScrollTo, check action params.'
  );
});

test('ScrollTo without a blockId scrolls the page to top, as window.scrollTo does', async () => {
  const { globals, scrollView } = createPage();
  await ScrollTo({ globals, methods, params: { top: 200, behavior: 'smooth' } });
  expect(scrollView.scrollTo.mock.calls).toEqual([[{ animated: true, x: 0, y: 200 }]]);
});

test('ScrollTo scrolls a block to the top of the page, measured in the scroll content', async () => {
  const { globals, innerView, scrollView, view } = createPage();
  await ScrollTo({ globals, methods, params: { blockId: 'jobs' } });
  expect(view.measureLayout.mock.calls[0][0]).toBe(innerView);
  expect(scrollView.scrollTo.mock.calls).toEqual([[{ animated: false, x: 0, y: 1000 }]]);
});

test('ScrollTo places a block at the center or end of the page by options.block', async () => {
  const { globals, scrollView } = createPage();
  await ScrollTo({
    globals,
    methods,
    params: { blockId: 'jobs', options: { block: 'center', behavior: 'smooth' } },
  });
  await ScrollTo({ globals, methods, params: { blockId: 'jobs', options: { block: 'end' } } });
  expect(scrollView.scrollTo.mock.calls).toEqual([
    [{ animated: true, x: 0, y: 750 }],
    [{ animated: false, x: 0, y: 500 }],
  ]);
});

test('ScrollTo leaves the page where it is for a block not on it', async () => {
  const { globals, scrollView } = createPage({ withView: false });
  await ScrollTo({ globals, methods, params: { blockId: 'jobs' } });
  expect(scrollView.scrollTo).not.toHaveBeenCalled();
});
