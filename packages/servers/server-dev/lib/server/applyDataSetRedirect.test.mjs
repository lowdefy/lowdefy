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
import { callRequest } from '@lowdefy/api';
import { ConfigError } from '@lowdefy/errors';

import applyDataSetRedirect from './applyDataSetRedirect.js';

const connections = {
  MongoDBCollection: { meta: { tenant: true, dataSet: 'redirect' } },
  FolderRuntime: { meta: { dataSet: 'redirect' } },
  AxiosHttp: { meta: { dataSet: 'external' } },
  Knex: {},
  Redis: { meta: {} },
  PluginStore: { meta: { dataSet: 'mongo' } },
};

const artifacts = {
  'connections/tickets.json': {
    id: 'connection:tickets',
    connectionId: 'tickets',
    '~k': 'k_tickets',
    type: 'MongoDBCollection',
    properties: { databaseUri: { _secret: 'MONGODB_URI' }, collection: 'tickets', write: true },
  },
  'connections/no_uri.json': {
    id: 'connection:no_uri',
    connectionId: 'no_uri',
    type: 'MongoDBCollection',
    properties: { collection: 'tickets' },
  },
  'connections/nested.json': {
    id: 'connection:nested',
    connectionId: 'nested',
    type: 'MongoDBCollection',
    properties: {
      databaseUri: { _secret: 'MONGODB_URI' },
      collection: { _if: { test: true, then: 'a', else: 'b' } },
      options: { appName: { '_string.concat': ['x', 'y'] } },
    },
  },
  'connections/whole.json': {
    id: 'connection:whole',
    connectionId: 'whole',
    '~k': 'k_whole',
    type: 'MongoDBCollection',
    properties: {
      _if: { test: true, then: { databaseUri: 'mongodb://real/' }, else: {} },
    },
  },
  'connections/whole_ref.json': {
    id: 'connection:whole_ref',
    connectionId: 'whole_ref',
    type: 'MongoDBCollection',
    properties: { _ref: 'connection.yaml' },
  },
  'connections/array.json': {
    id: 'connection:array',
    connectionId: 'array',
    type: 'MongoDBCollection',
    properties: [],
  },
  'connections/folders.json': {
    id: 'connection:folders',
    connectionId: 'folders',
    type: 'FolderRuntime',
    properties: { databaseUri: { _secret: 'MONGODB_URI' }, databaseName: 'app' },
  },
  'connections/contacts/contacts.json': {
    id: 'connection:contacts/contacts',
    connectionId: 'contacts/contacts',
    type: 'MongoDBCollection',
    properties: { databaseUri: { _secret: 'MONGODB_URI' }, collection: 'contacts' },
  },
  'connections/api.json': {
    id: 'connection:api',
    connectionId: 'api',
    type: 'AxiosHttp',
    properties: { baseURL: 'https://example.com' },
  },
  'connections/sql.json': {
    id: 'connection:sql',
    connectionId: 'sql',
    '~k': 'k_sql',
    type: 'Knex',
    properties: { client: 'pg', connection: { _secret: 'PG_URI' } },
  },
  'connections/cache.json': {
    id: 'connection:cache',
    connectionId: 'cache',
    type: 'Redis',
    properties: { connection: { _secret: 'REDIS_URI' } },
  },
  'connections/store.json': {
    id: 'connection:store',
    connectionId: 'store',
    type: 'PluginStore',
    properties: { databaseUri: 'mongodb://real/' },
  },
  'connections/unknown.json': {
    id: 'connection:unknown',
    connectionId: 'unknown',
    type: 'NotInstalled',
    properties: { databaseUri: 'mongodb://real/' },
  },
  'pages/home.json': { id: 'page:home', properties: { databaseUri: 'not a connection' } },
};

function createContext() {
  return { readConfigFile: async (filePath) => artifacts[filePath] ?? null };
}

const session = {
  id: 'abc',
  name: 'staging-sample',
  state: 'open',
  databaseUri: 'mongodb://127.0.0.1:5555/?replicaSet=testset',
  databaseName: 'ld_000000000001',
};

function redirectedContext(options = {}) {
  const context = createContext();
  applyDataSetRedirect({ context, session: options.session ?? session, connections });
  return context;
}

test('applyDataSetRedirect points a MongoDBCollection connection at the session database', async () => {
  const context = redirectedContext();
  expect(await context.readConfigFile('connections/tickets.json')).toEqual({
    id: 'connection:tickets',
    connectionId: 'tickets',
    '~k': 'k_tickets',
    type: 'MongoDBCollection',
    properties: {
      databaseUri: session.databaseUri,
      databaseName: session.databaseName,
      collection: 'tickets',
      write: true,
    },
  });
});

test('applyDataSetRedirect points a module connection, written under its module folder, at the session database', async () => {
  const context = redirectedContext();
  const artifact = await context.readConfigFile('connections/contacts/contacts.json');
  expect(artifact.properties).toEqual({
    databaseUri: session.databaseUri,
    databaseName: session.databaseName,
    collection: 'contacts',
  });
});

test('applyDataSetRedirect points a plugin type that declares redirect at the session database', async () => {
  const context = redirectedContext();
  const artifact = await context.readConfigFile('connections/folders.json');
  expect(artifact.properties).toEqual({
    databaseUri: session.databaseUri,
    databaseName: session.databaseName,
  });
});

test('applyDataSetRedirect merges the session database into a redirect connection that names no databaseUri', async () => {
  const context = redirectedContext();
  const artifact = await context.readConfigFile('connections/no_uri.json');
  expect(artifact.properties).toEqual({
    databaseUri: session.databaseUri,
    databaseName: session.databaseName,
    collection: 'tickets',
  });
});

test('applyDataSetRedirect gives a connection with a _secret databaseUri and nested operators the session literal URI', async () => {
  const context = redirectedContext();
  const artifact = await context.readConfigFile('connections/nested.json');
  expect(artifact.properties.databaseUri).toEqual(session.databaseUri);
  expect(artifact.properties.databaseName).toEqual(session.databaseName);
  expect(artifact.properties.collection).toEqual({ _if: { test: true, then: 'a', else: 'b' } });
});

test('applyDataSetRedirect refuses a redirect connection whose properties are an operator, naming the connection', async () => {
  const context = redirectedContext();
  const error = await context.readConfigFile('connections/whole.json').catch((caught) => caught);
  expect(error).toBeInstanceOf(ConfigError);
  expect(error.message).toEqual(
    'Connection "whole" (type MongoDBCollection) cannot run under data set "staging-sample": its properties are an operator, so the redirect cannot be checked.'
  );
  expect(error.configKey).toEqual('k_whole');
  for (const filePath of ['connections/whole_ref.json', 'connections/array.json']) {
    await expect(context.readConfigFile(filePath)).rejects.toThrow(
      'its properties are an operator, so the redirect cannot be checked.'
    );
  }
});

test('applyDataSetRedirect refuses a connection whose type declares no dataSet, even with a literal databaseUri', async () => {
  const context = redirectedContext();
  const error = await context.readConfigFile('connections/sql.json').catch((caught) => caught);
  expect(error).toBeInstanceOf(ConfigError);
  expect(error.message).toEqual(
    'Connection "sql" (type Knex) cannot run under data set "staging-sample": its type does not say how to redirect it.'
  );
  expect(error.configKey).toEqual('k_sql');
  await expect(context.readConfigFile('connections/cache.json')).rejects.toThrow(
    'Connection "cache" (type Redis) cannot run under data set "staging-sample": its type does not say how to redirect it.'
  );
  await expect(context.readConfigFile('connections/store.json')).rejects.toThrow(
    'Connection "store" (type PluginStore) cannot run under data set "staging-sample": its type does not say how to redirect it.'
  );
  await expect(context.readConfigFile('connections/unknown.json')).rejects.toThrow(
    'Connection "unknown" (type NotInstalled) cannot run under data set "staging-sample": its type does not say how to redirect it.'
  );
});

test('applyDataSetRedirect leaves an external connection and every other path untouched', async () => {
  const context = redirectedContext();
  expect(await context.readConfigFile('connections/api.json')).toBe(
    artifacts['connections/api.json']
  );
  expect(await context.readConfigFile('pages/home.json')).toBe(artifacts['pages/home.json']);
  expect(await context.readConfigFile('connections/missing.json')).toBeNull();
});

test('applyDataSetRedirect never mutates the artifact it read', async () => {
  const context = redirectedContext();
  await context.readConfigFile('connections/tickets.json');
  await context.readConfigFile('connections/nested.json');
  const plain = createContext();
  expect((await plain.readConfigFile('connections/tickets.json')).properties.databaseUri).toEqual({
    _secret: 'MONGODB_URI',
  });
  expect(artifacts['connections/tickets.json'].properties.databaseName).toBeUndefined();
  expect(artifacts['connections/nested.json'].properties.databaseUri).toEqual({
    _secret: 'MONGODB_URI',
  });
});

test('applyDataSetRedirect throws on a connection read after the session has closed', async () => {
  const context = redirectedContext({ session: { ...session, state: 'closed' } });
  await expect(context.readConfigFile('connections/tickets.json')).rejects.toThrow(
    'Data session abc has ended.'
  );
  await expect(context.readConfigFile('connections/api.json')).rejects.toThrow(
    'Data session abc has ended.'
  );
  expect(await context.readConfigFile('pages/home.json')).toBe(artifacts['pages/home.json']);
});

describe('a request through callRequest under a data session', () => {
  const resolver = jest.fn(async () => ({ ok: true }));
  resolver.schema = {};
  resolver.meta = { checkRead: false, checkWrite: false };

  function createRequestContext({ connectionType }) {
    const requestConnections = {
      [connectionType]: {
        ...connections[connectionType],
        schema: {},
        requests: { RunQuery: resolver },
      },
    };
    const configFiles = {
      'connections/store.json': {
        id: 'connection:store',
        connectionId: 'store',
        type: connectionType,
        properties: { databaseUri: 'mongodb://real/', collection: 'rows' },
      },
      'pages/home/requests/get_rows.json': {
        id: 'request:home:get_rows',
        type: 'RunQuery',
        requestId: 'get_rows',
        pageId: 'home',
        connectionId: 'store',
        auth: { public: true },
        properties: {},
      },
    };
    const logger = { debug: () => {}, error: () => {}, info: () => {}, warn: () => {} };
    const context = {
      appMeta: {},
      authorizeOutcome: () => 'allow',
      config: {},
      connections: requestConnections,
      handleError: async (error) => {
        error.handled = true;
      },
      headers: {},
      logger,
      mode: 'dev',
      operators: {},
      organization: null,
      readConfigFile: async (filePath) => configFiles[filePath] ?? null,
      scrubSecrets: (value) => value,
      secrets: {},
      steps: {},
      user: null,
    };
    applyDataSetRedirect({ context, session, connections: requestConnections });
    return context;
  }

  beforeEach(() => {
    resolver.mockClear();
  });

  test('fails and never reaches the resolver when the connection type declares no dataSet', async () => {
    const context = createRequestContext({ connectionType: 'Knex' });
    await expect(
      callRequest(context, { pageId: 'home', requestId: 'get_rows', payload: {} })
    ).rejects.toThrow(
      'Connection "store" (type Knex) cannot run under data set "staging-sample": its type does not say how to redirect it.'
    );
    expect(resolver).not.toHaveBeenCalled();
  });

  test('reaches the resolver with the session database when the connection type declares redirect', async () => {
    const context = createRequestContext({ connectionType: 'FolderRuntime' });
    await callRequest(context, { pageId: 'home', requestId: 'get_rows', payload: {} });
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(resolver.mock.calls[0][0].connection).toEqual({
      databaseUri: session.databaseUri,
      databaseName: session.databaseName,
      collection: 'rows',
    });
  });
});
