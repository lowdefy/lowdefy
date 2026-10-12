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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { callRequest } from '@lowdefy/api';
import createReadConfigFile from '@lowdefy/api/context/createReadConfigFile.js';

import applyDataSetRedirect from './applyDataSetRedirect.js';

// A walled-client plugin under auth.organizations.policy: tenant, served inside a data session and
// outside one, in both orders. The unwalled-reach verdict is memoised per process and read from the
// build, so whichever request evaluates it first, the walled-client plugin is served everywhere and
// a plugin that really holds the walled database's URI is refused everywhere.

const walledUri = 'mongodb://app-host:27017/app';

const session = {
  id: 'abc',
  name: 'staging-sample',
  state: 'open',
  databaseUri: 'mongodb://127.0.0.1:5555/?replicaSet=testset',
  databaseName: 'ld_000000000001',
};

const resolver = async ({ connection, walled }) => {
  const bound = await walled(connection.mongoConnectionId);
  return {
    databaseUri: bound.connection.databaseUri,
    databaseName: bound.connection.databaseName ?? null,
    tenant: bound.tenant,
  };
};
resolver.schema = {};
resolver.meta = { checkRead: true, checkWrite: false };

const connections = {
  MongoDBCollection: { meta: { tenant: true, dataSet: 'redirect' }, schema: {}, requests: {} },
  WalledRuntime: {
    meta: { tenant: false, dataSet: 'walled' },
    schema: {},
    requests: { WalledRead: resolver },
  },
};

const artifacts = {
  'tenantConnections.json': [{ connectionId: 'fixture_db', type: 'MongoDBCollection' }],
  'unwalledConnections.json': [
    { connectionId: 'walled_runtime', type: 'WalledRuntime' },
    { connectionId: 'raw_runtime', type: 'WalledRuntime' },
  ],
  'connections/fixture_db.json': {
    id: 'connection:fixture_db',
    connectionId: 'fixture_db',
    type: 'MongoDBCollection',
    tenantCapability: true,
    properties: { databaseUri: walledUri, collection: 'items', read: true },
  },
  'connections/walled_runtime.json': {
    id: 'connection:walled_runtime',
    connectionId: 'walled_runtime',
    type: 'WalledRuntime',
    tenantCapability: false,
    properties: { mongoConnectionId: 'fixture_db', read: true },
  },
  // A plugin that holds the walled database's URI itself while naming a walled connection: the
  // reach check refuses it, in and out of sessions.
  'connections/raw_runtime.json': {
    id: 'connection:raw_runtime',
    connectionId: 'raw_runtime',
    type: 'WalledRuntime',
    '~k': 'k_raw_runtime',
    tenantCapability: false,
    properties: { mongoConnectionId: 'fixture_db', uri: walledUri, read: true },
  },
  'pages/home/requests/accept_match.json': {
    id: 'request:home:accept_match',
    type: 'WalledRead',
    requestId: 'accept_match',
    pageId: 'home',
    connectionId: 'walled_runtime',
    auth: { public: true },
    properties: {},
  },
  'pages/home/requests/raw_read.json': {
    id: 'request:home:raw_read',
    type: 'WalledRead',
    requestId: 'raw_read',
    pageId: 'home',
    connectionId: 'raw_runtime',
    auth: { public: true },
    properties: {},
  },
};

const rawRefusal =
  'Connection "raw_runtime" (WalledRuntime) holds a URI to the database of walled connection "fixture_db".';

let buildDirectory;

beforeAll(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-walled-reach-'));
  Object.entries(artifacts).forEach(([name, value]) => {
    const filePath = path.join(buildDirectory, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value));
  });
});

afterAll(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

// The context createLowdefyContext composes: createApiContext's base reader over the build, and
// for a data-session request the gate over it.
function createContext({ config, dataSession }) {
  const logger = { debug: () => {}, error: () => {}, info: () => {}, warn: () => {} };
  const context = {
    appMeta: {},
    authorizeOutcome: () => 'allow',
    buildDirectory,
    config,
    connections,
    fileCache: new Map(),
    handleError: async (error) => {
      error.handled = true;
    },
    headers: {},
    logger,
    mode: 'dev',
    operators: {},
    organization: { policy: 'tenant' },
    scrubSecrets: (value) => value,
    secrets: {},
    steps: {},
    user: { id: 'u_member', organization_id: 'org_a' },
  };
  context.readConfigFile = createReadConfigFile(context);
  if (dataSession) {
    applyDataSetRedirect({ context, session, connections });
  }
  return context;
}

async function acceptMatch(context) {
  const result = await callRequest(context, {
    pageId: 'home',
    requestId: 'accept_match',
    payload: {},
  });
  return result.response;
}

const servedInSession = {
  databaseUri: session.databaseUri,
  databaseName: session.databaseName,
  tenant: { field: 'organization_id', value: 'org_a' },
};
const servedOutside = {
  databaseUri: walledUri,
  databaseName: null,
  tenant: { field: 'organization_id', value: 'org_a' },
};

test('a walled-client plugin is served in a data session first and outside one afterwards', async () => {
  const config = {};
  expect(await acceptMatch(createContext({ config, dataSession: true }))).toEqual(servedInSession);
  expect(await acceptMatch(createContext({ config, dataSession: false }))).toEqual(servedOutside);
  await expect(
    callRequest(createContext({ config, dataSession: false }), {
      pageId: 'home',
      requestId: 'raw_read',
      payload: {},
    })
  ).rejects.toThrow(rawRefusal);
});

test('a walled-client plugin is served outside a data session first and in one afterwards', async () => {
  const config = {};
  expect(await acceptMatch(createContext({ config, dataSession: false }))).toEqual(servedOutside);
  expect(await acceptMatch(createContext({ config, dataSession: true }))).toEqual(servedInSession);
  await expect(
    callRequest(createContext({ config, dataSession: true }), {
      pageId: 'home',
      requestId: 'raw_read',
      payload: {},
    })
  ).rejects.toThrow(rawRefusal);
});
