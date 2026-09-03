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

import writeConnections from './writeConnections.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeConnections write connection', async () => {
  const components = {
    connections: [
      {
        id: 'connection:connection1',
        connectionId: 'connection1',
        properties: {
          prop: 'val',
        },
      },
    ],
  };
  await writeConnections({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'connections/connection1.json',
      '{"id":"connection:connection1","connectionId":"connection1","properties":{"prop":"val"}}',
    ],
    ['tenantConnections.json', '[]'],
    ['tenantCollections.json', '{"tenantConnections":{},"tenantCollectionMap":{}}'],
  ]);
});

test('writeConnections multiple connection', async () => {
  const components = {
    connections: [
      {
        id: 'connection:connection1',
        connectionId: 'connection1',
      },
      {
        id: 'connection:connection2',
        connectionId: 'connection2',
      },
    ],
  };
  await writeConnections({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'connections/connection1.json',
      '{"id":"connection:connection1","connectionId":"connection1"}',
    ],
    [
      'connections/connection2.json',
      '{"id":"connection:connection2","connectionId":"connection2"}',
    ],
    ['tenantConnections.json', '[]'],
    ['tenantCollections.json', '{"tenantConnections":{},"tenantCollectionMap":{}}'],
  ]);
});

test('writeConnections writes the inverted tenant connections index', async () => {
  // The walled set is every scoping-capable connection that does not declare
  // tenant: shared - non-scopable types never enter it.
  const indexContext = testContext({ writeBuildArtifact: mockWriteBuildArtifact });
  indexContext.typesMap = {
    connectionMetas: { MongoDBCollection: { tenant: true }, SendGridMail: { tenant: false } },
  };
  const components = {
    connections: [
      {
        id: 'connection:walled',
        connectionId: 'walled',
        type: 'MongoDBCollection',
      },
      {
        id: 'connection:custom-field',
        connectionId: 'custom-field',
        type: 'MongoDBCollection',
        tenant: { field: 'organization_id' },
      },
      {
        id: 'connection:shared',
        connectionId: 'shared',
        type: 'MongoDBCollection',
        tenant: 'shared',
      },
      {
        id: 'connection:mail',
        connectionId: 'mail',
        type: 'SendGridMail',
      },
    ],
  };
  await writeConnections({ components, context: indexContext });
  expect(mockWriteBuildArtifact.mock.calls[4]).toEqual([
    'tenantConnections.json',
    '[{"connectionId":"walled","type":"MongoDBCollection"},{"connectionId":"custom-field","type":"MongoDBCollection","tenant":{"field":"organization_id"}}]',
  ]);
});

test('writeConnections writes the tenant indexes for the dev JIT page build', async () => {
  const indexContext = testContext({ writeBuildArtifact: mockWriteBuildArtifact });
  indexContext.tenantConnections = new Map([
    ['walled', { type: 'MongoDBCollection', field: 'organization_id' }],
  ]);
  indexContext.tenantCollectionMap = {
    records: { shared: [], scoped: ['walled'] },
    countries: { shared: ['shared'], scoped: [] },
  };
  const components = {
    connections: [{ id: 'connection:walled', connectionId: 'walled', type: 'MongoDBCollection' }],
  };
  await writeConnections({ components, context: indexContext });
  expect(mockWriteBuildArtifact.mock.calls[2]).toEqual([
    'tenantCollections.json',
    '{"tenantConnections":{"walled":{"type":"MongoDBCollection","field":"organization_id"}},"tenantCollectionMap":{"records":{"shared":[],"scoped":["walled"]},"countries":{"shared":["shared"],"scoped":[]}}}',
  ]);
});

test('writeConnections no connections', async () => {
  const components = {
    connections: [],
  };
  await writeConnections({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['tenantConnections.json', '[]'],
    ['tenantCollections.json', '{"tenantConnections":{},"tenantCollectionMap":{}}'],
  ]);
});

test('writeConnections connections undefined', async () => {
  const components = {};
  await writeConnections({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([]);
});

test('writeConnections connections not an array', async () => {
  const components = {
    connections: 'connections',
  };
  await expect(writeConnections({ components, context })).rejects.toThrow(
    'Connections is not an array.'
  );
});
