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

// A plugin's own metas module, as loadPluginTypeSchema imports it. Banner declares the properties it
// draws as text for a headless journey's text check; BrokenBanner's declaration is no list.
const PLUGIN_METAS = {
  Banner: { category: 'display', headlessText: ['title', 'content'] },
  BrokenBanner: { category: 'display', headlessText: 'title' },
};

vi.mock('./loadPluginTypeSchema.js', () => ({
  default: async ({ type }) => ({ schema: undefined, meta: PLUGIN_METAS[type.originalTypeName] }),
}));

const BANNER = { package: 'app-plugin', typeName: 'app_Banner', originalTypeName: 'Banner' };
const BROKEN = {
  package: 'app-plugin',
  typeName: 'app_BrokenBanner',
  originalTypeName: 'BrokenBanner',
};

async function writeMetas(typesMap, blocks) {
  const writeBuildArtifact = vi.fn();
  await writeBlockSchemaMap({
    components: { imports: { blocks } },
    context: { typesMap, writeBuildArtifact },
  });
  const call = writeBuildArtifact.mock.calls.find(([name]) => name === 'plugins/blockMetas.json');
  return JSON.parse(call[1]);
}

test("writeBlockSchemaMap carries headlessText from the plugin's meta and from a types map entry", async () => {
  const expected = {
    app_Banner: { category: 'display', hazards: [], headlessText: ['title', 'content'] },
  };
  expect(await writeMetas({ schemas: { blocks: {} } }, [BANNER])).toEqual(expected);
  expect(
    await writeMetas(
      { schemas: { blocks: {} }, blockMetas: { app_Banner: { category: 'display' } } },
      [BANNER]
    )
  ).toEqual(expected);
  expect(
    await writeMetas(
      {
        schemas: { blocks: {} },
        blockMetas: { app_Banner: { category: 'display', headlessText: ['title', 'content'] } },
      },
      [BANNER]
    )
  ).toEqual(expected);
});

test('writeBlockSchemaMap fails on a headlessText that is no list of paths, naming the block type', async () => {
  const error = await writeMetas({ schemas: { blocks: {} } }, [BROKEN]).catch((caught) => caught);
  expect(error.name).toBe('ConfigError');
  expect(error.message).toBe(
    "Block type app_BrokenBanner declares headlessText as \"title\": it should be a list of the property paths the block draws as text, such as ['title', 'content']."
  );
  expect(error.received).toBe('title');
});
