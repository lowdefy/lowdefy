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

import applyDataSetRedirect from './applyDataSetRedirect.js';

const artifacts = {
  'connections/tickets.json': {
    id: 'connection:tickets',
    type: 'MongoDBCollection',
    properties: { databaseUri: { _secret: 'MONGODB_URI' }, collection: 'tickets', write: true },
  },
  'connections/folders.json': {
    id: 'connection:folders',
    type: 'FolderRuntime',
    properties: { databaseUri: { _secret: 'MONGODB_URI' }, databaseName: 'app' },
  },
  'connections/api.json': {
    id: 'connection:api',
    type: 'AxiosHttp',
    properties: { baseURL: 'https://example.com' },
  },
  'pages/home.json': { id: 'page:home', properties: { databaseUri: 'not a connection' } },
};

function createContext() {
  return { readConfigFile: async (filePath) => artifacts[filePath] ?? null };
}

const session = {
  id: 'abc',
  state: 'open',
  databaseUri: 'mongodb://127.0.0.1:5555/?replicaSet=testset',
  databaseName: 'ld_000000000001',
};

test('applyDataSetRedirect points a MongoDBCollection connection at the session database', async () => {
  const context = createContext();
  applyDataSetRedirect({ context, session });
  expect(await context.readConfigFile('connections/tickets.json')).toEqual({
    id: 'connection:tickets',
    type: 'MongoDBCollection',
    properties: {
      databaseUri: session.databaseUri,
      databaseName: session.databaseName,
      collection: 'tickets',
      write: true,
    },
  });
});

test('applyDataSetRedirect points a plugin-typed connection with a databaseUri at the session database', async () => {
  const context = createContext();
  applyDataSetRedirect({ context, session });
  const artifact = await context.readConfigFile('connections/folders.json');
  expect(artifact.properties).toEqual({
    databaseUri: session.databaseUri,
    databaseName: session.databaseName,
  });
});

test('applyDataSetRedirect leaves a connection without databaseUri and every other path untouched', async () => {
  const context = createContext();
  applyDataSetRedirect({ context, session });
  expect(await context.readConfigFile('connections/api.json')).toBe(
    artifacts['connections/api.json']
  );
  expect(await context.readConfigFile('pages/home.json')).toBe(artifacts['pages/home.json']);
  expect(await context.readConfigFile('connections/missing.json')).toBeNull();
});

test('applyDataSetRedirect never mutates the artifact it read', async () => {
  const context = createContext();
  applyDataSetRedirect({ context, session });
  await context.readConfigFile('connections/tickets.json');
  expect(artifacts['connections/tickets.json'].properties.databaseUri).toEqual({
    _secret: 'MONGODB_URI',
  });
  expect(artifacts['connections/tickets.json'].properties.databaseName).toBeUndefined();
});

test('applyDataSetRedirect throws on a connection read after the session has closed', async () => {
  const closed = { ...session, state: 'closed' };
  const context = createContext();
  applyDataSetRedirect({ context, session: closed });
  await expect(context.readConfigFile('connections/tickets.json')).rejects.toThrow(
    'Data session abc has ended.'
  );
  expect(await context.readConfigFile('pages/home.json')).toBe(artifacts['pages/home.json']);
});
