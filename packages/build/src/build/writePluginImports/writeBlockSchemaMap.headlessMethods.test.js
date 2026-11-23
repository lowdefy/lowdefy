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
// Timeline's merge changes only what it draws, so its meta declares it null, a headless no-op.
// BrokenTimeline's declaration is neither an event name nor null.
const PLUGIN_METAS = {
  ActionChain: { category: 'display', headlessMethods: { run: 'onRun' } },
  BrokenTimeline: { category: 'display', headlessMethods: { merge: false } },
  Note: { category: 'display' },
  Timeline: { category: 'display', headlessMethods: { refresh: 'onRefresh', merge: null } },
};

vi.mock('./loadPluginTypeSchema.js', () => ({
  default: async ({ type }) => ({ schema: undefined, meta: PLUGIN_METAS[type.originalTypeName] }),
}));

const APP_BLOCKS = [
  { package: 'app-plugin', typeName: 'app_ActionChain', originalTypeName: 'ActionChain' },
  { package: 'app-plugin', typeName: 'app_Note', originalTypeName: 'Note' },
];

async function writeMetas(typesMap, blocks = APP_BLOCKS) {
  const writeBuildArtifact = vi.fn();
  await writeBlockSchemaMap({
    components: { imports: { blocks } },
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

const TIMELINE = { package: 'app-plugin', typeName: 'app_Timeline', originalTypeName: 'Timeline' };
const BROKEN = {
  package: 'app-plugin',
  typeName: 'app_BrokenTimeline',
  originalTypeName: 'BrokenTimeline',
};

test('writeBlockSchemaMap carries a method declared null into blockMetas beside an event name', async () => {
  const typesMap = { schemas: { blocks: {} } };
  expect(await writeMetas(typesMap, [TIMELINE])).toEqual({
    app_Timeline: {
      category: 'display',
      hazards: [],
      headlessMethods: { refresh: 'onRefresh', merge: null },
    },
  });
  expect(
    await writeMetas({ ...typesMap, blockMetas: { app_Timeline: { category: 'display' } } }, [
      TIMELINE,
    ])
  ).toEqual({
    app_Timeline: {
      category: 'display',
      hazards: [],
      headlessMethods: { refresh: 'onRefresh', merge: null },
    },
  });
});

const BROKEN_MESSAGE =
  'Block type app_BrokenTimeline declares headlessMethods.merge as false: it should be the name of the block event the method fires, or null for a method that changes only what the block draws.';

test("writeBlockSchemaMap fails on a plugin meta's method that is neither an event name nor null, naming the block type and the method", async () => {
  await expect(writeMetas({ schemas: { blocks: {} } }, [BROKEN])).rejects.toThrow(BROKEN_MESSAGE);
});

test('writeBlockSchemaMap fails on a types map entry whose method is neither an event name nor null', async () => {
  await expect(
    writeMetas(
      {
        schemas: { blocks: {} },
        blockMetas: {
          app_Timeline: { category: 'display', headlessMethods: { merge: 'onMerge', redraw: 1 } },
        },
      },
      [TIMELINE]
    )
  ).rejects.toThrow(
    'Block type app_Timeline declares headlessMethods.redraw as 1: it should be the name of the block event the method fires, or null for a method that changes only what the block draws.'
  );
  await expect(
    writeMetas(
      { schemas: { blocks: {} }, blockMetas: { app_BrokenTimeline: { category: 'display' } } },
      [BROKEN]
    )
  ).rejects.toThrow(BROKEN_MESSAGE);
});
