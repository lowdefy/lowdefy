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
import { operatorsServer } from '@lowdefy/operators-js';
import { ConfigError } from '@lowdefy/errors';

import callRequestResolver from './callRequestResolver.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import testContext from '../../test/testContext.js';

const connectionArtifacts = {
  mongo: {
    connectionId: 'mongo',
    type: 'MongoDBCollection',
    '~k': 'c.0',
    properties: { databaseUri: { _secret: 'MONGO' }, collection: 'rows', read: true, write: true },
  },
  shared_mongo: {
    connectionId: 'shared_mongo',
    type: 'MongoDBCollection',
    tenant: 'shared',
    walled: { field: 'organization_id' },
    '~k': 'c.1',
    properties: { databaseUri: 'mongodb://x', collection: 'rows', write: true },
  },
  smtp: { connectionId: 'smtp', type: 'Smtp', '~k': 'c.2', properties: {} },
};

function createContext({ user = { id: 'u', organization_id: 'org-1' } } = {}) {
  const context = testContext({
    operators: { ...operatorsServer },
    organization: { policy: 'tenant' },
    secrets: { MONGO: 'mongodb://walled/db' },
    connections: {
      MongoDBCollection: { meta: { tenant: true }, requests: {} },
      Smtp: { meta: { tenant: false }, requests: {} },
    },
    readConfigFile: (path) => connectionArtifacts[path.match(/^connections\/(.+)\.json$/)?.[1]],
    user,
  });
  context.endpointId = 'my_endpoint';
  context.payload = {};
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

const requestConfig = { '~k': 'r.0', requestId: 'plugin_req', connectionId: 'plugin', type: 'X' };

async function walledFor(context, connectionId, config = requestConfig) {
  let received;
  await callRequestResolver(context, {
    connectionProperties: { mongoConnectionId: connectionId },
    endpointDepth: 0,
    requestConfig: config,
    requestProperties: {},
    requestResolver: async ({ walled }) => {
      received = await walled(connectionId);
    },
  });
  return received;
}

test('the resolver receives a walled seam bound to the request tenant', async () => {
  const bound = await walledFor(createContext(), 'mongo');
  expect(bound).toEqual({
    connection: {
      databaseUri: 'mongodb://walled/db',
      collection: 'rows',
      read: true,
      write: true,
    },
    connectionId: 'mongo',
    endpointId: 'my_endpoint',
    requestId: 'plugin_req',
    tenant: { field: 'organization_id', value: 'org-1' },
    tenantGuard: null,
  });
});

test('tenant: none on the request yields the read-only guard, not a verdict', async () => {
  const bound = await walledFor(createContext({ user: null }), 'mongo', {
    ...requestConfig,
    tenant: 'none',
  });
  expect(bound.tenant).toBe(null);
  expect(bound.tenantGuard).toEqual({ field: 'organization_id', readOnly: true });
});

test('a caller with no organization fails closed', async () => {
  await expect(walledFor(createContext({ user: null }), 'mongo')).rejects.toThrow(
    'no caller organization'
  );
});

test('a shared connection over a walled collection gets the write guard', async () => {
  const bound = await walledFor(createContext(), 'shared_mongo');
  expect(bound.tenant).toBe(null);
  expect(bound.tenantGuard).toEqual({ field: 'organization_id', readOnly: false });
});

test('a non-scoping connection type can not be named', async () => {
  await expect(walledFor(createContext(), 'smtp')).rejects.toThrow(ConfigError);
  await expect(walledFor(createContext(), 'missing')).rejects.toThrow('does not exist');
});

test('under pinned there is no verdict and no guard', async () => {
  const context = createContext();
  context.organization = { policy: 'pinned' };
  const bound = await walledFor(context, 'mongo');
  expect(bound.tenant).toBe(null);
  expect(bound.tenantGuard).toBe(null);
});
