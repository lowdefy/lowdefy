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

import { expect, test } from 'vitest';
import { icons as lucideIcons } from 'lucide';

import buildMobilePageIcons from './buildMobilePageIcons.js';
import createCounter from '../../utils/createCounter.js';
import createIconSemanticMap from '../icons/createIconSemanticMap.js';
import createLucideIconLayer from '../icons/createLucideIconLayer.js';
import createTestIconLayer from '../../test-utils/createTestIconLayer.js';

const truckNode = [['path', { d: 'M5 17h-2v-11h11v11' }]];

function createIcons() {
  const sets = {
    lucide: [createLucideIconLayer()],
    tabler: [createTestIconLayer({ icons: { Truck: { node: truckNode } } })],
  };
  return {
    sets,
    defaultSet: 'lucide',
    semantic: createIconSemanticMap({ sets, defaultSet: 'lucide' }),
  };
}

function createContext({ pageBlocks }) {
  const pageTypeCounters = new Map();
  Object.entries(pageBlocks).forEach(([pageId, blocks]) => {
    const blocksCounter = createCounter();
    blocks.forEach((block) => blocksCounter.increment(block));
    pageTypeCounters.set(pageId, { blocks: blocksCounter });
  });
  return {
    icons: createIcons(),
    jsMap: { client: { 'aGFzaDE=': "return state.done ? 'Check' : 'Bell';" }, server: {} },
    pageTypeCounters,
    typesMapMobile: { icons: { Tabs: ['more'], Icon: ['loading'] } },
  };
}

function iconPage({ pageId, target, name }) {
  return {
    pageId,
    target,
    blocks: [{ blockId: 'icon', type: 'Icon', properties: { name } }],
  };
}

test('a mobile page carries the node data of a set name and a tabler: icon it uses', async () => {
  const page = {
    pageId: 'today',
    target: 'mobile',
    blocks: [
      { blockId: 'home', type: 'Icon', properties: { name: 'House' } },
      { blockId: 'truck', type: 'Icon', properties: { name: 'tabler:Truck' } },
    ],
  };
  const context = createContext({ pageBlocks: { today: ['Icon'] } });
  await buildMobilePageIcons({ components: { pages: [page] }, context });
  expect(page._icons.House).toEqual({ node: lucideIcons.House });
  expect(page._icons['tabler:Truck']).toEqual({ node: truckNode });
  // The icons the native Icon renderer draws itself.
  expect(page._icons.loading).toEqual({ node: lucideIcons.LoaderCircle });
  expect(Object.keys(page._icons)).toContain('icon-missing');
});

test('semantic names, global, _js sources and native block meta icons are found', async () => {
  const page = {
    pageId: 'jobs',
    target: 'both',
    blocks: [
      { blockId: 'edit', type: 'Icon', properties: { name: 'edit' } },
      { blockId: 'status', type: 'Icon', properties: { name: { _js: 'aGFzaDE=' } } },
      { blockId: 'tabs', type: 'Tabs' },
    ],
  };
  const context = createContext({ pageBlocks: { jobs: ['Icon', 'Tabs'] } });
  await buildMobilePageIcons({
    components: { global: { statusIcon: 'Star' }, pages: [page] },
    context,
  });
  expect(page._icons.edit).toEqual({ node: lucideIcons.Pencil });
  expect(page._icons.Check).toEqual({ node: lucideIcons.Check });
  expect(page._icons.Bell).toEqual({ node: lucideIcons.Bell });
  expect(page._icons.Star).toEqual({ node: lucideIcons.Star });
  expect(page._icons.more).toBeDefined();
});

test('names that do not resolve are left out, and web pages get no _icons', async () => {
  const mobile = iconPage({ pageId: 'today', target: 'mobile', name: 'NotAnIcon' });
  const web = iconPage({ pageId: 'home', target: 'web', name: 'House' });
  const context = createContext({ pageBlocks: { today: ['Icon'], home: ['Icon'] } });
  await buildMobilePageIcons({ components: { pages: [web, mobile] }, context });
  expect(Object.keys(mobile._icons)).not.toContain('NotAnIcon');
  expect(web._icons).toBeUndefined();
});
