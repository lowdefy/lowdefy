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

import writeBlockSchemaMap from './writeBlockSchemaMap.js';

// A plugin's own metas module, as loadPluginTypeSchema imports it: a plugin built against an older
// @lowdefy/block-utils, whose extractBlockTypes drops headlessMethods, still declares it there.
vi.mock('./loadPluginTypeSchema.js', () => ({
  default: async ({ type }) => ({
    schema: undefined,
    meta:
      type.originalTypeName === 'ActionChain'
        ? { category: 'display', headlessMethods: { run: 'onRun' } }
        : { category: 'display' },
  }),
}));

async function writeMetas(typesMap) {
  const writeBuildArtifact = vi.fn();
  await writeBlockSchemaMap({
    components: {
      imports: {
        blocks: [
          { package: 'app-plugin', typeName: 'app_ActionChain', originalTypeName: 'ActionChain' },
          { package: 'app-plugin', typeName: 'app_Note', originalTypeName: 'Note' },
        ],
      },
    },
    context: { typesMap, writeBuildArtifact },
  });
  const call = writeBuildArtifact.mock.calls.find(([name]) => name === 'plugins/blockMetas.json');
  return JSON.parse(call[1]);
}

test("writeBlockSchemaMap reads headlessMethods from the plugin's meta when the types map entry omits it", async () => {
  const blockMetas = await writeMetas({
    schemas: { blocks: {} },
    blockMetas: { app_ActionChain: { category: 'display' }, app_Note: { category: 'display' } },
  });
  expect(blockMetas).toEqual({
    app_ActionChain: { category: 'display', hazards: [], headlessMethods: { run: 'onRun' } },
    app_Note: { category: 'display', hazards: [] },
  });
});

test("writeBlockSchemaMap reads headlessMethods from the plugin's meta when the types map has no entry", async () => {
  const blockMetas = await writeMetas({ schemas: { blocks: {} } });
  expect(blockMetas).toEqual({
    app_ActionChain: { category: 'display', hazards: [], headlessMethods: { run: 'onRun' } },
    app_Note: { category: 'display', hazards: [] },
  });
});
