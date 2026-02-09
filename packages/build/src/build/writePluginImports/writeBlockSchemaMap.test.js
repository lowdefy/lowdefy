/*
  Copyright 2020-2024 Lowdefy, Inc

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
      blocks: [
        { package: '@lowdefy/blocks-basic', typeName: 'Box', originalTypeName: 'Box' },
      ],
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
  // Box schema should be collected from the actual @lowdefy/blocks-basic package
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
