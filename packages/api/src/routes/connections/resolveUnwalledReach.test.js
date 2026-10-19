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

import resolveUnwalledReach from './resolveUnwalledReach.js';
import testContext from '../../test/testContext.js';

const walledUri = 'mongodb://host-a:27017,host-b:27017/app?replicaSet=rs';
const sessionUri = 'mongodb://127.0.0.1:5555/?replicaSet=testset';
const sessionName = 'ld_000000000001';

// The build directory as the base reader sees it. The shared file cache holds every artifact, so
// the base reader serves them without touching the disk.
const buildArtifacts = {
  'tenantConnections.json': [{ connectionId: 'walled', type: 'MongoDBCollection' }],
  'unwalledConnections.json': [
    { connectionId: 'plugin', type: 'Plugin' },
    { connectionId: 'runtime', type: 'Runtime' },
  ],
  'connections/walled.json': {
    connectionId: 'walled',
    type: 'MongoDBCollection',
    properties: { databaseUri: walledUri, collection: 'rows' },
  },
  'connections/plugin.json': {
    connectionId: 'plugin',
    type: 'Plugin',
    properties: { nested: { uri: 'mongodb://host-b:27017,host-a:27017/app' } },
  },
  'connections/runtime.json': {
    connectionId: 'runtime',
    type: 'Runtime',
    properties: { databaseUri: 'mongodb://elsewhere:27017/runtime' },
  },
};

const expectedReach = new Map([
  [
    'plugin',
    'Connection "plugin" (Plugin) holds a URI to the database of walled connection "walled". Unwalled connections must not reach walled data: give the plugin a mongoConnectionId and use the walled MongoDB client (@lowdefy/connection-mongodb/walled). Requests on this connection are refused.',
  ],
]);

function createFileCache() {
  return new Map(
    Object.entries(buildArtifacts).map(([filePath, artifact]) => [
      filePath,
      Promise.resolve(artifact),
    ])
  );
}

function plainReader(filePath) {
  return buildArtifacts[filePath] ?? null;
}

// A data session's gate: every connection takes the session database.
function sessionReader(filePath) {
  const artifact = plainReader(filePath);
  if (!filePath.startsWith('connections/') || artifact === null) return artifact;
  return {
    ...artifact,
    properties: { ...artifact.properties, databaseUri: sessionUri, databaseName: sessionName },
  };
}

// A wrapper that hides every connection's properties.
function hidingReader(filePath) {
  const artifact = plainReader(filePath);
  if (!filePath.startsWith('connections/') || artifact === null) return artifact;
  return { ...artifact, properties: {} };
}

function createContext({ config, readConfigFile }) {
  const context = testContext({
    config,
    organization: { policy: 'tenant' },
    readConfigFile,
  });
  context.buildDirectory = '/build';
  context.fileCache = createFileCache();
  return context;
}

test('resolveUnwalledReach gives the same verdict to a data session evaluated first and a plain request after it', async () => {
  const config = {};
  const sessionReach = await resolveUnwalledReach(
    createContext({ config, readConfigFile: sessionReader })
  );
  expect(sessionReach).toEqual(expectedReach);
  const plainReach = await resolveUnwalledReach(
    createContext({ config, readConfigFile: plainReader })
  );
  expect(plainReach).toEqual(expectedReach);
});

test('resolveUnwalledReach gives the same verdict to a plain request evaluated first and a data session after it', async () => {
  const config = {};
  const plainReach = await resolveUnwalledReach(
    createContext({ config, readConfigFile: plainReader })
  );
  expect(plainReach).toEqual(expectedReach);
  const sessionReach = await resolveUnwalledReach(
    createContext({ config, readConfigFile: sessionReader })
  );
  expect(sessionReach).toEqual(expectedReach);
});

test('resolveUnwalledReach under a data session refuses the connections it refuses outside one', async () => {
  const sessionReach = await resolveUnwalledReach(
    createContext({ config: {}, readConfigFile: sessionReader })
  );
  const plainReach = await resolveUnwalledReach(
    createContext({ config: {}, readConfigFile: plainReader })
  );
  expect(sessionReach).toEqual(plainReach);
  expect(sessionReach.has('runtime')).toBe(false);
});

test('resolveUnwalledReach keeps its refusal when a wrapped reader hides the reaching URI', async () => {
  const reach = await resolveUnwalledReach(
    createContext({ config: {}, readConfigFile: hidingReader })
  );
  expect(reach).toEqual(expectedReach);
});
