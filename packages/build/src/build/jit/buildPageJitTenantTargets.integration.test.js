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

// Dev/build parity for the tenant pipeline checks on page requests. A page is
// built in dev after the skeleton build, one page at a time, against a fresh
// context; the scoped connections, walled collections and shared connections
// buildConnections computed must reach it through the tenantTargets.json
// artifact, or the checks silently never run in dev:
//
//   shallowBuild -> tenantTargets.json -> restoreTenantTargets (as server-dev
//   getBuildContext does) -> buildPageJit -> buildRequests checks

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { serializer } from '@lowdefy/helpers';

jest.unstable_mockModule('../buildApp.js', () => ({
  computeAppMeta: () => ({ slug: null, name: null, version: null, gitSha: 'test-git-sha' }),
  default: ({ components }) => {
    components.app = components.app ?? {};
    components.app.html = { appendBody: '', appendHead: '', ...components.app.html };
    components.appMeta = { gitSha: 'test-git-sha' };
    return components;
  },
}));
jest.unstable_mockModule('../full/updateServerPackageJson.js', () => ({
  default: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../copyPublicFolder.js', () => ({
  default: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../copyAgentFileSystems.js', () => ({
  default: jest.fn(async () => {}),
}));

const { default: shallowBuild } = await import('./shallowBuild.js');
const { default: buildPageJit } = await import('./buildPageJit.js');
const { default: createContext } = await import('../../createContext.js');
const { default: restoreTenantTargets } = await import('../restoreTenantTargets.js');
const { default: makeId } = await import('../../utils/makeId.js');
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');

const typesMap = {
  ...snapshotTypesMap,
  requests: {
    ...snapshotTypesMap.requests,
    MongoDBAggregation: { package: '@lowdefy/connection-mongodb' },
  },
  connectionMetas: {
    MongoDBCollection: {
      tenant: true,
      tenantTarget: {
        database: ['databaseUri', 'databaseName'],
        collection: 'collection',
        changeLogCollection: 'changeLog.collection',
      },
    },
  },
};

const logger = {
  info: () => {},
  log: () => {},
  warn: () => {},
  error: () => {},
  succeed: () => {},
};

function aggregationPage(id, connectionId, stage, tenant) {
  return `id: ${id}
type: Box
requests:
  - id: rollup
    type: MongoDBAggregation
    connectionId: ${connectionId}
${tenant ? `    tenant: ${tenant}\n` : ''}    properties:
      pipeline:
        - ${stage}
`;
}

function writeFixture(configDir) {
  const write = (rel, content) => {
    const full = path.join(configDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  };
  write(
    'lowdefy.yaml',
    `lowdefy: local
name: Tenant targets JIT parity

auth:
  secret:
    _secret: BETTER_AUTH_SECRET
  database:
    id: auth_db
    type: MongoDBAuthAdapter
    properties: {}
  emailAndPassword:
    enabled: true
  organizations:
    policy: tenant

connections:
  - id: totals
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: totals
  - id: orders_all
    type: MongoDBCollection
    tenant: shared
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: orders

pages:
  - _ref: pages/shared-out.yaml
  - _ref: pages/walled-search.yaml
  - _ref: pages/shared-read.yaml
`
  );
  write('pages/shared-out.yaml', aggregationPage('shared-out', 'orders_all', '$out: totals'));
  write(
    'pages/walled-search.yaml',
    aggregationPage('walled-search', 'totals', '$search: { text: { query: q, path: name } }')
  );
  write('pages/shared-read.yaml', aggregationPage('shared-read', 'orders_all', '$match: {}'));
}

function readArtifact(buildDir, fileName) {
  return serializer.deserialize(JSON.parse(fs.readFileSync(path.join(buildDir, fileName), 'utf8')));
}

let buildDir;
let configDir;
let pageRegistry;

beforeAll(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-tenant-targets-jit-'));
  configDir = path.join(root, 'config');
  buildDir = path.join(root, '.lowdefy', 'server', 'build');
  fs.mkdirSync(buildDir, { recursive: true });
  writeFixture(configDir);
  await shallowBuild({
    customTypesMap: typesMap,
    directories: {
      config: configDir,
      build: buildDir,
      server: path.join(root, '.lowdefy', 'server'),
    },
    logger,
    stage: 'dev',
  });
  pageRegistry = readArtifact(buildDir, 'pageRegistry.json');
});

// The dev server's getBuildContext: a fresh context restored from artifacts.
function devContext() {
  const context = createContext({
    customTypesMap: typesMap,
    directories: { build: buildDir, config: configDir, server: path.resolve(buildDir, '..') },
    logger,
    stage: 'dev',
  });
  for (const id of readArtifact(buildDir, 'connectionIds.json')) {
    context.connectionIds.add(id);
  }
  restoreTenantTargets({ context, tenantTargets: readArtifact(buildDir, 'tenantTargets.json') });
  context.installedPluginPackages = new Set([
    '@lowdefy/blocks-basic',
    '@lowdefy/connection-mongodb',
  ]);
  context.components = { api: [] };
  context.bundledIcons = new Set();
  context.dynamicIconData = {};
  makeId.continueFrom(readArtifact(buildDir, 'idCounter.json'));
  return context;
}

test('a dev page build refuses a shared connection $out into a walled collection', async () => {
  await expect(
    buildPageJit({ pageId: 'shared-out', pageRegistry, context: devContext() })
  ).rejects.toThrow(
    'writes into collection "totals" with "$out" on tenant: shared connection "orders_all"'
  );
});

test('a dev page build refuses a walled $search without tenant authored', async () => {
  await expect(
    buildPageJit({ pageId: 'walled-search', pageRegistry, context: devContext() })
  ).rejects.toThrow('contains "$search" on tenant connection "totals"');
});

test('a dev page build of a shared connection read passes', async () => {
  const page = await buildPageJit({ pageId: 'shared-read', pageRegistry, context: devContext() });
  expect(page.id).toBe('page:shared-read');
});
