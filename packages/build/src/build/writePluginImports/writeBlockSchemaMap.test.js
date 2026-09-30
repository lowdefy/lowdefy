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

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeBlockSchemaMap writes empty map when no blocks', async () => {
  const components = { imports: { blocks: [] } };
  const context = {
    typesMap: { schemas: { blocks: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeBlockSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/blockSchemas.json', '{}');
});

test('writeBlockSchemaMap uses typesMap schemas for custom plugins', async () => {
  const customSchema = {
    properties: { type: 'object', properties: { title: { type: 'string' } } },
  };
  const components = {
    imports: {
      blocks: [
        { package: 'custom-plugin', typeName: 'CustomBlock', originalTypeName: 'CustomBlock' },
      ],
    },
  };
  const context = {
    typesMap: { schemas: { blocks: { CustomBlock: customSchema } } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeBlockSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith(
    'plugins/blockSchemas.json',
    JSON.stringify({ CustomBlock: customSchema })
  );
});

test('writeBlockSchemaMap typesMap schemas take priority over package schemas', async () => {
  const customSchema = {
    properties: { type: 'object', properties: { custom: { type: 'boolean' } } },
  };
  const components = {
    imports: {
      blocks: [{ package: '@lowdefy/blocks-basic', typeName: 'Box', originalTypeName: 'Box' }],
    },
  };
  const context = {
    typesMap: { schemas: { blocks: { Box: customSchema } } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeBlockSchemaMap({ components, context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(written.Box).toEqual(customSchema);
});

test('writeBlockSchemaMap skips unresolvable packages gracefully', async () => {
  const components = {
    imports: {
      blocks: [
        {
          package: 'non-existent-package',
          typeName: 'FakeBlock',
          originalTypeName: 'FakeBlock',
        },
      ],
    },
  };
  const context = {
    typesMap: { schemas: { blocks: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeBlockSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/blockSchemas.json', '{}');
});

test('writeBlockSchemaMap handles missing typesMap.schemas gracefully', async () => {
  const components = { imports: { blocks: [] } };
  const context = {
    typesMap: {},
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeBlockSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/blockSchemas.json', '{}');
});

test('writeBlockSchemaMap collects schemas from resolvable packages', async () => {
  const components = {
    imports: {
      blocks: [
        {
          package: '@lowdefy/blocks-basic',
          typeName: 'Box',
          originalTypeName: 'Box',
        },
      ],
    },
  };
  const context = {
    typesMap: { schemas: { blocks: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeBlockSchemaMap({ components, context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(written.Box).toBeDefined();
  expect(written.Box.properties).toBeDefined();
});

test('writeBlockSchemaMap groups multiple blocks from same package', async () => {
  const components = {
    imports: {
      blocks: [
        { package: '@lowdefy/blocks-basic', typeName: 'Box', originalTypeName: 'Box' },
        { package: '@lowdefy/blocks-basic', typeName: 'Span', originalTypeName: 'Span' },
      ],
    },
  };
  const context = {
    typesMap: { schemas: { blocks: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeBlockSchemaMap({ components, context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(written.Box).toBeDefined();
  expect(written.Span).toBeDefined();
});

test('writeBlockSchemaMap carries meta.hazards into blockMetas and defaults to an empty list', async () => {
  const components = {
    imports: {
      blocks: [
        { package: '@lowdefy/blocks-basic', typeName: 'Html', originalTypeName: 'Html' },
        { package: '@lowdefy/blocks-basic', typeName: 'Box', originalTypeName: 'Box' },
      ],
    },
  };
  const context = {
    typesMap: { schemas: { blocks: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeBlockSchemaMap({ components, context });
  const metasCall = mockWriteBuildArtifact.mock.calls.find(
    (call) => call[0] === 'plugins/blockMetas.json'
  );
  const blockMetas = JSON.parse(metasCall[1]);
  expect(blockMetas.Html.hazards.map((hazard) => hazard.id)).toEqual(['html-style-stripped']);
  expect(blockMetas.Html.hazards[0]).toEqual({
    id: expect.any(String),
    message: expect.any(String),
    see: expect.any(String),
  });
  expect(blockMetas.Box.hazards).toEqual([]);
});

test('writeBlockSchemaMap carries hazards from typesMap blockMetas for custom plugins', async () => {
  const components = {
    imports: {
      blocks: [
        { package: 'custom-plugin', typeName: 'CustomBlock', originalTypeName: 'CustomBlock' },
      ],
    },
  };
  const hazards = [{ id: 'custom-hazard', message: 'Something surprising.', see: null }];
  const context = {
    typesMap: {
      schemas: { blocks: { CustomBlock: { type: 'object' } } },
      blockMetas: { CustomBlock: { category: 'display', hazards } },
    },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeBlockSchemaMap({ components, context });
  const metasCall = mockWriteBuildArtifact.mock.calls.find(
    (call) => call[0] === 'plugins/blockMetas.json'
  );
  expect(JSON.parse(metasCall[1]).CustomBlock).toEqual({ category: 'display', hazards });
});

test('writeBlockSchemaMap reads hazards from the package meta when typesMap blockMetas omit them', async () => {
  // Core plugin typesMap metas are built by extractBlockTypes, which does not
  // carry hazards — the plugin's meta module is the source.
  const components = {
    imports: {
      blocks: [{ package: '@lowdefy/blocks-basic', typeName: 'Html', originalTypeName: 'Html' }],
    },
  };
  const context = {
    typesMap: {
      schemas: { blocks: {} },
      blockMetas: { Html: { category: 'display', cssKeys: ['element'] } },
    },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeBlockSchemaMap({ components, context });
  const metasCall = mockWriteBuildArtifact.mock.calls.find(
    (call) => call[0] === 'plugins/blockMetas.json'
  );
  const blockMetas = JSON.parse(metasCall[1]);
  expect(blockMetas.Html.category).toEqual('display');
  expect(blockMetas.Html.hazards.map((hazard) => hazard.id)).toEqual(['html-style-stripped']);
});
