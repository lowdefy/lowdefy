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

import writeActionSchemaMap from './writeActionSchemaMap.js';

const mockWriteBuildArtifact = jest.fn();

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeActionSchemaMap writes empty map when no actions', async () => {
  const components = { imports: { actions: [] } };
  const context = {
    typesMap: { schemas: { actions: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeActionSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/actionSchemas.json', '{}');
});

test('writeActionSchemaMap uses typesMap schemas for custom plugins', async () => {
  const customSchema = { params: { type: 'object', properties: { x: { type: 'string' } } } };
  const components = {
    imports: {
      actions: [
        { package: 'custom-plugin', typeName: 'CustomAction', originalTypeName: 'CustomAction' },
      ],
    },
  };
  const context = {
    typesMap: { schemas: { actions: { CustomAction: customSchema } } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeActionSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith(
    'plugins/actionSchemas.json',
    JSON.stringify({ CustomAction: customSchema })
  );
});

test('writeActionSchemaMap typesMap schemas take priority over package schemas', async () => {
  const customSchema = { params: { type: 'object', properties: { custom: { type: 'string' } } } };
  const components = {
    imports: {
      actions: [
        {
          package: '@lowdefy/actions-core',
          typeName: 'Wait',
          originalTypeName: 'Wait',
        },
      ],
    },
  };
  const context = {
    typesMap: { schemas: { actions: { Wait: customSchema } } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeActionSchemaMap({ components, context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(written.Wait).toEqual(customSchema);
});

test('writeActionSchemaMap skips unresolvable packages gracefully', async () => {
  const components = {
    imports: {
      actions: [
        {
          package: 'non-existent-package',
          typeName: 'FakeAction',
          originalTypeName: 'FakeAction',
        },
      ],
    },
  };
  const context = {
    typesMap: { schemas: { actions: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeActionSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/actionSchemas.json', '{}');
});

test('writeActionSchemaMap handles missing typesMap.schemas gracefully', async () => {
  const components = { imports: { actions: [] } };
  const context = {
    typesMap: {},
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeActionSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/actionSchemas.json', '{}');
});

test('writeActionSchemaMap collects schemas from resolvable packages', async () => {
  const components = {
    imports: {
      actions: [
        {
          package: '@lowdefy/actions-core',
          typeName: 'Wait',
          originalTypeName: 'Wait',
        },
      ],
    },
  };
  const context = {
    typesMap: { schemas: { actions: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeActionSchemaMap({ components, context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  // Wait schema should be collected from the actual @lowdefy/actions-core package
  expect(written.Wait).toBeDefined();
  expect(written.Wait.params).toBeDefined();
});

test('writeActionSchemaMap groups multiple actions from same package', async () => {
  const components = {
    imports: {
      actions: [
        { package: '@lowdefy/actions-core', typeName: 'Wait', originalTypeName: 'Wait' },
        { package: '@lowdefy/actions-core', typeName: 'SetState', originalTypeName: 'SetState' },
      ],
    },
  };
  const context = {
    typesMap: { schemas: { actions: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeActionSchemaMap({ components, context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(written.Wait).toBeDefined();
  expect(written.SetState).toBeDefined();
});