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

import writeOperatorSchemaMap from './writeOperatorSchemaMap.js';

const mockWriteBuildArtifact = jest.fn();

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeOperatorSchemaMap writes empty map when no operators', async () => {
  const components = { imports: { operators: { client: [], server: [] } } };
  const context = {
    typesMap: { schemas: { operators: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeOperatorSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/operatorSchemas.json', '{}');
});

test('writeOperatorSchemaMap uses typesMap schemas for custom plugins', async () => {
  const customSchema = { params: { type: 'object', properties: { x: { type: 'string' } } } };
  const components = {
    imports: {
      operators: {
        client: [
          {
            package: 'custom-plugin',
            typeName: '_custom',
            originalTypeName: '_custom',
          },
        ],
        server: [],
      },
    },
  };
  const context = {
    typesMap: { schemas: { operators: { _custom: customSchema } } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeOperatorSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith(
    'plugins/operatorSchemas.json',
    JSON.stringify({ _custom: customSchema })
  );
});

test('writeOperatorSchemaMap typesMap schemas take priority over package schemas', async () => {
  const customSchema = {
    params: { type: 'object', properties: { custom: { type: 'string' } } },
  };
  const components = {
    imports: {
      operators: {
        client: [
          {
            package: '@lowdefy/operators-js',
            typeName: '_if',
            originalTypeName: '_if',
          },
        ],
        server: [],
      },
    },
  };
  const context = {
    typesMap: { schemas: { operators: { _if: customSchema } } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeOperatorSchemaMap({ components, context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(written._if).toEqual(customSchema);
});

test('writeOperatorSchemaMap skips unresolvable packages gracefully', async () => {
  const components = {
    imports: {
      operators: {
        client: [
          {
            package: 'non-existent-package',
            typeName: '_fake',
            originalTypeName: '_fake',
          },
        ],
        server: [],
      },
    },
  };
  const context = {
    typesMap: { schemas: { operators: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeOperatorSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/operatorSchemas.json', '{}');
});

test('writeOperatorSchemaMap handles missing typesMap.schemas gracefully', async () => {
  const components = { imports: { operators: { client: [], server: [] } } };
  const context = {
    typesMap: {},
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeOperatorSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/operatorSchemas.json', '{}');
});

test('writeOperatorSchemaMap writes empty schemas for packages without schema exports', async () => {
  const components = {
    imports: {
      operators: {
        client: [
          {
            package: '@lowdefy/operators-js',
            typeName: '_if',
            originalTypeName: '_if',
          },
        ],
        server: [],
      },
    },
  };
  const context = {
    typesMap: { schemas: { operators: {} } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeOperatorSchemaMap({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/operatorSchemas.json', '{}');
});

test('writeOperatorSchemaMap deduplicates operators across client and server', async () => {
  const ifSchema = { params: { type: 'object' } };
  const getSchema = { params: { type: 'string' } };
  const components = {
    imports: {
      operators: {
        client: [
          { package: 'custom-plugin', typeName: '_if', originalTypeName: '_if' },
          { package: 'custom-plugin', typeName: '_get', originalTypeName: '_get' },
        ],
        server: [
          { package: 'custom-plugin', typeName: '_if', originalTypeName: '_if' },
          { package: 'custom-plugin', typeName: '_get', originalTypeName: '_get' },
        ],
      },
    },
  };
  const context = {
    typesMap: { schemas: { operators: { _if: ifSchema, _get: getSchema } } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeOperatorSchemaMap({ components, context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(written._if).toEqual(ifSchema);
  expect(written._get).toEqual(getSchema);
});

test('writeOperatorSchemaMap groups multiple operators using typesMap schemas', async () => {
  const ifSchema = { params: { type: 'object' } };
  const eqSchema = { params: { type: 'array' } };
  const components = {
    imports: {
      operators: {
        client: [
          { package: 'custom-plugin', typeName: '_if', originalTypeName: '_if' },
          { package: 'custom-plugin', typeName: '_eq', originalTypeName: '_eq' },
        ],
        server: [],
      },
    },
  };
  const context = {
    typesMap: { schemas: { operators: { _if: ifSchema, _eq: eqSchema } } },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeOperatorSchemaMap({ components, context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(written._if).toEqual(ifSchema);
  expect(written._eq).toEqual(eqSchema);
});
