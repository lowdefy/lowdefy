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

import writeBlockSchemaMap from './writeBlockSchemaMap.js';

const mockWriteBuildArtifact = jest.fn();

const boxSchema = { properties: { type: 'object', properties: { content: { type: 'string' } } } };
const spanSchema = { properties: { type: 'object' } };
const boxMeta = { category: 'container', valueType: null };
const spanMeta = { category: 'display', valueType: 'string', initValue: '' };

function createContext({ typesMap = {}, blockSchemas = {}, blockPluginMetas = {} } = {}) {
  return { typesMap, blockSchemas, blockPluginMetas, writeBuildArtifact: mockWriteBuildArtifact };
}

function written(artifact) {
  const call = mockWriteBuildArtifact.mock.calls.find(([name]) => name === artifact);
  return JSON.parse(call[1]);
}

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeBlockSchemaMap writes empty maps when no blocks are used', async () => {
  const components = { imports: { blocks: [] } };
  const context = createContext({ blockSchemas: { Box: boxSchema } });
  await writeBlockSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/blockSchemas.json', '{}');
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/blockMetas.json', '{}');
});

test('writeBlockSchemaMap writes only the schemas of the used block types', async () => {
  const components = {
    imports: {
      blocks: [{ package: '@lowdefy/blocks-basic', typeName: 'Box', originalTypeName: 'Box' }],
    },
  };
  const context = createContext({
    blockSchemas: { Box: boxSchema, Span: spanSchema },
    blockPluginMetas: { Box: boxMeta, Span: spanMeta },
  });
  await writeBlockSchemaMap({ components, context });
  expect(written('plugins/blockSchemas.json')).toEqual({ Box: boxSchema });
  expect(written('plugins/blockMetas.json')).toEqual({ Box: { category: 'container' } });
});

test('writeBlockSchemaMap writes valueType and initValue from the plugin meta', async () => {
  const components = {
    imports: {
      blocks: [{ package: '@lowdefy/blocks-basic', typeName: 'Span', originalTypeName: 'Span' }],
    },
  };
  const context = createContext({
    blockSchemas: { Span: spanSchema },
    blockPluginMetas: { Span: spanMeta },
  });
  await writeBlockSchemaMap({ components, context });
  expect(written('plugins/blockMetas.json')).toEqual({
    Span: { category: 'display', valueType: 'string', initValue: '' },
  });
});

test('writeBlockSchemaMap typesMap blockMetas take priority over plugin metas', async () => {
  const components = {
    imports: {
      blocks: [{ package: '@lowdefy/blocks-basic', typeName: 'Box', originalTypeName: 'Box' }],
    },
  };
  const context = createContext({
    typesMap: { blockMetas: { Box: { category: 'input', valueType: 'object' } } },
    blockSchemas: { Box: boxSchema },
    blockPluginMetas: { Box: boxMeta },
  });
  await writeBlockSchemaMap({ components, context });
  expect(written('plugins/blockMetas.json')).toEqual({
    Box: { category: 'input', valueType: 'object' },
  });
});

test('writeBlockSchemaMap skips used types with no loaded schema or meta', async () => {
  const components = {
    imports: {
      blocks: [
        { package: 'non-existent-package', typeName: 'FakeBlock', originalTypeName: 'FakeBlock' },
      ],
    },
  };
  const context = createContext();
  await writeBlockSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/blockSchemas.json', '{}');
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/blockMetas.json', '{}');
});

test('writeBlockSchemaMap handles a context without loaded maps', async () => {
  const components = {
    imports: {
      blocks: [{ package: '@lowdefy/blocks-basic', typeName: 'Box', originalTypeName: 'Box' }],
    },
  };
  const context = { typesMap: {}, writeBuildArtifact: mockWriteBuildArtifact };
  await writeBlockSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/blockSchemas.json', '{}');
});
