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

import stripPageContent from './stripPageContent.js';

test('stripPageContent strips content keys from ref-sourced pages', () => {
  const page = {
    id: 'page1',
    type: 'Container',
    '~k': 'k1',
    blocks: [{ id: 'b1' }],
    areas: { content: {} },
    slots: { header: {} },
    events: { onClick: {} },
    requests: [{ requestId: 'r1' }],
    layout: { span: 12 },
  };
  const context = {
    keyMap: { k1: { '~r': 'ref1' } },
  };
  stripPageContent({ components: { pages: [page] }, context });
  expect(page.id).toBe('page1');
  expect(page.type).toBe('Container');
  expect(page.blocks).toBeUndefined();
  expect(page.areas).toBeUndefined();
  expect(page.slots).toBeUndefined();
  expect(page.events).toBeUndefined();
  expect(page.requests).toBeUndefined();
  expect(page.layout).toBeUndefined();
});

test('stripPageContent keeps content for inline pages (no ~r in keyMap)', () => {
  const page = {
    id: 'page1',
    type: 'Container',
    '~k': 'k1',
    blocks: [{ id: 'b1' }],
    events: { onClick: {} },
  };
  const context = {
    keyMap: { k1: {} },
  };
  stripPageContent({ components: { pages: [page] }, context });
  expect(page.blocks).toEqual([{ id: 'b1' }]);
  expect(page.events).toEqual({ onClick: {} });
});

test('stripPageContent keeps content when page has no keyMap entry', () => {
  const page = {
    id: 'page1',
    type: 'Container',
    '~k': 'k1',
    blocks: [{ id: 'b1' }],
  };
  const context = {
    keyMap: {},
  };
  stripPageContent({ components: { pages: [page] }, context });
  expect(page.blocks).toEqual([{ id: 'b1' }]);
});

test('stripPageContent handles empty pages array', () => {
  const context = { keyMap: {} };
  stripPageContent({ components: { pages: [] }, context });
});

test('stripPageContent handles missing pages', () => {
  const context = { keyMap: {} };
  stripPageContent({ components: {}, context });
});

test('stripPageContent strips multiple ref-sourced pages', () => {
  const page1 = {
    id: 'p1',
    type: 'Box',
    '~k': 'k1',
    blocks: [{ id: 'b1' }],
    layout: { span: 6 },
  };
  const page2 = {
    id: 'p2',
    type: 'Box',
    '~k': 'k2',
    blocks: [{ id: 'b2' }],
    events: {},
  };
  const context = {
    keyMap: {
      k1: { '~r': 'ref1' },
      k2: { '~r': 'ref2' },
    },
  };
  stripPageContent({ components: { pages: [page1, page2] }, context });
  expect(page1.blocks).toBeUndefined();
  expect(page1.layout).toBeUndefined();
  expect(page2.blocks).toBeUndefined();
  expect(page2.events).toBeUndefined();
});

test('stripPageContent only strips ref-sourced pages in mixed list', () => {
  const refPage = {
    id: 'p1',
    type: 'Box',
    '~k': 'k1',
    blocks: [{ id: 'b1' }],
  };
  const inlinePage = {
    id: 'p2',
    type: 'Box',
    '~k': 'k2',
    blocks: [{ id: 'b2' }],
  };
  const context = {
    keyMap: {
      k1: { '~r': 'ref1' },
      k2: {},
    },
  };
  stripPageContent({ components: { pages: [refPage, inlinePage] }, context });
  expect(refPage.blocks).toBeUndefined();
  expect(inlinePage.blocks).toEqual([{ id: 'b2' }]);
});
