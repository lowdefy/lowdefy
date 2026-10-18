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

import createPluginTypesMap from './createPluginTypesMap.js';
import createPluginTypesMapMobile from './createPluginTypesMapMobile.js';

function createEmptyTypesMap() {
  return {
    actions: {},
    agents: {},
    auth: { adapters: {}, providers: {}, strategies: {} },
    blockMetas: {},
    blocks: {},
    connections: {},
    icons: {},
    iconSets: {},
    operators: { client: {}, server: {} },
    requests: {},
    websockets: {},
  };
}

function createEmptyTypesMapMobile() {
  return { actions: {}, blockMetas: {}, blocks: {}, icons: {}, operators: { client: {} } };
}

const printerTypes = {
  blocks: ['WebLabel'],
  native: {
    actions: ['Print'],
    blockMetas: { Label: { category: 'display' } },
    blocks: ['Label'],
    icons: { Label: ['printer'] },
  },
};

test('createPluginTypesMapMobile registers native types with the typePrefix, package and version', () => {
  const typesMap = createEmptyTypesMapMobile();
  createPluginTypesMapMobile({
    packageName: '@example/lowdefy-printer',
    packageTypes: printerTypes,
    typePrefix: 'Printer',
    typesMap,
    version: '2.1.0',
  });
  expect(typesMap).toEqual({
    actions: {
      PrinterPrint: {
        package: '@example/lowdefy-printer',
        originalTypeName: 'Print',
        version: '2.1.0',
      },
    },
    blockMetas: { PrinterLabel: { category: 'display' } },
    blocks: {
      PrinterLabel: {
        package: '@example/lowdefy-printer',
        originalTypeName: 'Label',
        version: '2.1.0',
      },
    },
    icons: { PrinterLabel: ['printer'] },
    operators: { client: {} },
  });
});

test('createPluginTypesMapMobile leaves the map unchanged for a plugin without native types', () => {
  const typesMap = createEmptyTypesMapMobile();
  createPluginTypesMapMobile({
    packageName: '@example/lowdefy-web',
    packageTypes: { blocks: ['WebLabel'] },
    typesMap,
    version: '1.0.0',
  });
  expect(typesMap).toEqual(createEmptyTypesMapMobile());
});

test('createPluginTypesMapMobile registers native types without a prefix when none is given', () => {
  const typesMap = createEmptyTypesMapMobile();
  createPluginTypesMapMobile({
    packageName: '@example/lowdefy-printer',
    packageTypes: printerTypes,
    typesMap,
    version: '2.1.0',
  });
  expect(Object.keys(typesMap.blocks)).toEqual(['Label']);
  expect(Object.keys(typesMap.actions)).toEqual(['Print']);
});

test('createPluginTypesMap leaves native types out of the web map', () => {
  const typesMap = createEmptyTypesMap();
  createPluginTypesMap({
    packageName: '@example/lowdefy-printer',
    packageTypes: printerTypes,
    typePrefix: 'Printer',
    typesMap,
    version: '2.1.0',
  });
  expect(Object.keys(typesMap.blocks)).toEqual(['PrinterWebLabel']);
  expect(typesMap.actions).toEqual({});
  expect(typesMap.icons).toEqual({});
});
