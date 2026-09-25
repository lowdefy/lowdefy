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
import { icons as lucideIcons } from 'lucide';

import createIconSemanticMap from './createIconSemanticMap.js';
import createLucideIconLayer from './createLucideIconLayer.js';
import loadIconData from './loadIconData.js';
import createTestIconLayer from '../../test-utils/createTestIconLayer.js';

const fillNode = [['path', { d: 'M1 1' }]];

function createIcons(sets = {}) {
  const allSets = { ...sets, lucide: [createLucideIconLayer(), ...(sets.lucide ?? [])] };
  return {
    sets: allSets,
    defaultSet: 'lucide',
    semantic: createIconSemanticMap({ sets: allSets, defaultSet: 'lucide' }),
  };
}

test('loadIconData keys data by the names as used, sharing Lucide nodes', async () => {
  const data = await loadIconData({ names: ['edit', 'Pencil', 'Home'], icons: createIcons() });
  expect(data).toEqual({
    edit: { node: lucideIcons.Pencil },
    Pencil: { node: lucideIcons.Pencil },
    Home: { node: lucideIcons.House },
  });
  expect(data.edit.node).toBe(data.Pencil.node);
});

test('loadIconData calls each layer once with the icons it draws, and applies layer attrs', async () => {
  const layer = createTestIconLayer({
    icons: { Fill: { node: fillNode, size: 256 }, Other: { node: fillNode } },
    attrs: { fill: 'currentColor', stroke: 'none' },
  });
  const loadIcons = jest.fn(layer.loadIcons);
  layer.loadIcons = loadIcons;
  const data = await loadIconData({
    names: ['acme:Fill', 'acme:Other', 'Pencil'],
    icons: createIcons({ acme: [layer] }),
  });
  expect(loadIcons).toHaveBeenCalledTimes(1);
  expect(loadIcons).toHaveBeenCalledWith({ names: ['Fill', 'Other'] });
  expect(data['acme:Fill']).toEqual({
    node: fillNode,
    size: 256,
    attrs: { fill: 'currentColor', stroke: 'none' },
  });
});

test('loadIconData lets icon attrs override layer attrs', async () => {
  const layer = createTestIconLayer({
    icons: { Fill: { node: fillNode, attrs: { fill: 'red' } } },
    attrs: { fill: 'currentColor', stroke: 'none' },
  });
  const data = await loadIconData({ names: ['acme:Fill'], icons: createIcons({ acme: [layer] }) });
  expect(data['acme:Fill'].attrs).toEqual({ fill: 'red', stroke: 'none' });
});

test('loadIconData throws when a layer lists an icon it cannot load', async () => {
  const layer = createTestIconLayer({ icons: { Listed: { node: fillNode } } });
  layer.loadIcons = async () => ({});
  await expect(
    loadIconData({ names: ['acme:Listed'], icons: createIcons({ acme: [layer] }) })
  ).rejects.toThrow(
    'Icon set "acme" from "test-icons" lists "Listed", but its loadIcons returned no icon data for it.'
  );
});

test('loadIconData throws for a name that does not resolve', async () => {
  await expect(loadIconData({ names: ['NotAnIcon'], icons: createIcons() })).rejects.toThrow(
    'Icon "NotAnIcon" does not resolve'
  );
});
