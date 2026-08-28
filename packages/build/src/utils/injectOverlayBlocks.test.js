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

import injectOverlayBlocks from './injectOverlayBlocks.js';

const overlayBlock = { id: 'dev_tools', type: 'Box' };

test('prepends overlay blocks onto a page', () => {
  const context = { overlayBlocks: [overlayBlock], overlayExclude: new Set() };
  const page = { id: 'home', blocks: [{ id: 'a', type: 'Box' }] };
  injectOverlayBlocks({ page, context });
  expect(page.blocks).toEqual([
    { id: 'dev_tools', type: 'Box' },
    { id: 'a', type: 'Box' },
  ]);
});

test('handles a page with no blocks', () => {
  const context = { overlayBlocks: [overlayBlock], overlayExclude: new Set() };
  const page = { id: 'home' };
  injectOverlayBlocks({ page, context });
  expect(page.blocks).toEqual([{ id: 'dev_tools', type: 'Box' }]);
});

test('injects into the content slot for a slots-only page (does not clobber it)', () => {
  const context = { overlayBlocks: [overlayBlock], overlayExclude: new Set() };
  const page = {
    id: 'home',
    slots: { content: { blocks: [{ id: 'a', type: 'Box' }] } },
  };
  injectOverlayBlocks({ page, context });
  // The page's own slot content is preserved, overlay prepended.
  expect(page.slots.content.blocks).toEqual([
    { id: 'dev_tools', type: 'Box' },
    { id: 'a', type: 'Box' },
  ]);
  // No competing top-level `blocks` is created (which would override the slot).
  expect(page.blocks).toBeUndefined();
});

test('creates the content slot when a slots page has no content slot', () => {
  const context = { overlayBlocks: [overlayBlock], overlayExclude: new Set() };
  const page = { id: 'home', slots: { header: { blocks: [] } } };
  injectOverlayBlocks({ page, context });
  expect(page.slots.content.blocks).toEqual([{ id: 'dev_tools', type: 'Box' }]);
  expect(page.blocks).toBeUndefined();
});

test('no-op when there are no overlay blocks', () => {
  const context = { overlayBlocks: [], overlayExclude: new Set() };
  const page = { id: 'home', blocks: [{ id: 'a', type: 'Box' }] };
  injectOverlayBlocks({ page, context });
  expect(page.blocks).toEqual([{ id: 'a', type: 'Box' }]);
});

test('skips a page listed in overlay.exclude (by pageId)', () => {
  const context = {
    overlayBlocks: [overlayBlock],
    overlayExclude: new Set(['login']),
  };
  const page = { id: 'login', blocks: [{ id: 'a', type: 'Box' }] };
  injectOverlayBlocks({ page, context });
  expect(page.blocks).toEqual([{ id: 'a', type: 'Box' }]);
});

test('injected blocks are deep clones — mutating a page does not affect the source', () => {
  const context = { overlayBlocks: [overlayBlock], overlayExclude: new Set() };
  const page = { id: 'home', blocks: [] };
  injectOverlayBlocks({ page, context });
  page.blocks[0].id = 'mutated';
  expect(context.overlayBlocks[0].id).toEqual('dev_tools');
});
