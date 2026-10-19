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

import createEvaluateOperators from '@lowdefy/api/context/createEvaluateOperators.js';
import createWalledResolver from '@lowdefy/api/routes/request/createWalledResolver.js';
import { ConfigError } from '@lowdefy/errors';
import { operatorsServer } from '@lowdefy/operators-js';

import applyDataSetRedirect from './applyDataSetRedirect.js';

const connections = {
  MongoDBCollection: { meta: { tenant: true, dataSet: 'redirect' }, requests: {} },
  WalledRuntime: { meta: { tenant: false, dataSet: 'walled' }, requests: {} },
};

const artifacts = {
  'connections/runtime.json': {
    id: 'connection:runtime',
    connectionId: 'runtime',
    type: 'WalledRuntime',
    properties: { mongoConnectionIds: ['matches'], apiKey: { _secret: 'RUNTIME_KEY' } },
  },
  'connections/runtime_operator.json': {
    id: 'connection:runtime_operator',
    connectionId: 'runtime_operator',
    type: 'WalledRuntime',
    properties: { _if: { test: true, then: { mongoConnectionIds: ['matches'] }, else: {} } },
  },
  'connections/matches.json': {
    id: 'connection:matches',
    connectionId: 'matches',
    '~k': 'k_matches',
    type: 'MongoDBCollection',
    properties: { databaseUri: { _secret: 'MONGODB_URI' }, collection: 'matches', write: true },
  },
  'connections/matches_operator.json': {
    id: 'connection:matches_operator',
    connectionId: 'matches_operator',
    '~k': 'k_matches_operator',
    type: 'MongoDBCollection',
    properties: {
      _if: { test: true, then: { databaseUri: 'mongodb://real/', collection: 'matches' } },
    },
  },
};

const session = {
  id: 'abc',
  name: 'staging-sample',
  state: 'open',
  databaseUri: 'mongodb://127.0.0.1:5555/?replicaSet=testset',
  databaseName: 'ld_000000000001',
};

function createContext({ sessionState = 'open' } = {}) {
  const context = {
    appMeta: {},
    config: {},
    connections,
    logger: { debug: () => {}, error: () => {}, info: () => {}, warn: () => {} },
    operators: { ...operatorsServer },
    organization: null,
    payload: {},
    readConfigFile: async (filePath) => artifacts[filePath] ?? null,
    secrets: { MONGODB_URI: 'mongodb://real-host/app', RUNTIME_KEY: 'key' },
    user: null,
  };
  context.evaluateOperators = createEvaluateOperators(context);
  applyDataSetRedirect({
    context,
    session: { ...session, state: sessionState },
    connections,
  });
  return context;
}

const requestConfig = { '~k': 'r.0', requestId: 'accept_match', connectionId: 'runtime' };

test('applyDataSetRedirect passes a connection whose type declares walled through with its properties untouched', async () => {
  const context = createContext();
  expect(await context.readConfigFile('connections/runtime.json')).toEqual(
    artifacts['connections/runtime.json']
  );
  expect(await context.readConfigFile('connections/runtime_operator.json')).toEqual(
    artifacts['connections/runtime_operator.json']
  );
});

test('applyDataSetRedirect throws on a walled connection read after the session has closed', async () => {
  const context = createContext({ sessionState: 'closed' });
  await expect(context.readConfigFile('connections/runtime.json')).rejects.toThrow(
    'Data session abc has ended.'
  );
});

test('the walled resolver under a data session gives the named MongoDBCollection the session database', async () => {
  const context = createContext();
  const walled = createWalledResolver(context, { requestConfig });
  const bound = await walled('matches');
  expect(bound.connection).toEqual({
    databaseUri: session.databaseUri,
    databaseName: session.databaseName,
    collection: 'matches',
    write: true,
  });
  expect(bound.connectionId).toEqual('matches');
});

test('the walled resolver under a data session refuses a named MongoDBCollection whose properties are an operator', async () => {
  const context = createContext();
  const walled = createWalledResolver(context, { requestConfig });
  const error = await walled('matches_operator').catch((caught) => caught);
  expect(error).toBeInstanceOf(ConfigError);
  expect(error.message).toEqual(
    'Connection "matches_operator" (type MongoDBCollection) cannot run under data set "staging-sample": its properties are an operator, so the redirect cannot be checked.'
  );
  expect(error.configKey).toEqual('k_matches_operator');
});
