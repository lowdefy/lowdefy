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

import { icons as lucideIcons } from 'lucide';

import buildPageIconsJit from './buildPageIconsJit.js';
import createCounter from '../../utils/createCounter.js';
import createIconSemanticMap from '../icons/createIconSemanticMap.js';
import createLucideIconLayer from '../icons/createLucideIconLayer.js';
import createTestIconLayer from '../../test-utils/createTestIconLayer.js';

const truckNode = [['path', { d: 'M5 17h-2v-11h11v11' }]];

function createContext() {
  const sets = {
    lucide: [createLucideIconLayer()],
    tabler: [createTestIconLayer({ icons: { Truck: { node: truckNode } } })],
  };
  const blocks = createCounter();
  blocks.increment('Icon');
  return {
    global: { brandIcon: 'Star' },
    icons: {
      sets,
      defaultSet: 'lucide',
      semantic: createIconSemanticMap({ sets, defaultSet: 'lucide' }),
    },
    jsMap: { client: {}, server: {} },
    pageTypeCounters: new Map([['today', { blocks }]]),
    typesMapMobile: { icons: {} },
  };
}

function iconPage(target) {
  return {
    pageId: 'today',
    target,
    blocks: [
      { blockId: 'home', type: 'Icon', properties: { name: 'House' } },
      { blockId: 'truck', type: 'Icon', properties: { name: 'tabler:Truck' } },
    ],
  };
}

test('a mobile page built on request gets the node data of its icons and global icons', async () => {
  const icons = await buildPageIconsJit({ page: iconPage('mobile'), context: createContext() });
  expect(icons.House).toEqual({ node: lucideIcons.House });
  expect(icons['tabler:Truck']).toEqual({ node: truckNode });
  expect(icons.Star).toEqual({ node: lucideIcons.Star });
});

test('a web page built on request gets no icon data', async () => {
  expect(await buildPageIconsJit({ page: iconPage(undefined), context: createContext() })).toBe(
    undefined
  );
});
