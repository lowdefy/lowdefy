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

// Integration test that crosses the *real* dev-server seam for CallAPI endpoint
// validation:
//
//   shallowBuild  ->  build/api/<id>.json on disk  ->  hydrate context (mirror of
//   server-dev getBuildContext + readBuildApiArtifacts)  ->  buildPageJit  ->
//   validateCallApiRefs
//
// The existing buildPageJit.test.js sets context.components.api directly, so it
// never exercises the write/read of build/api/*.json nor the walker resolution of
// _module.endpointId during a JIT build. This test runs the actual pipeline against
// real files on disk to reproduce the dev-server behaviour Gerrie reported.

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { serializer } from '@lowdefy/helpers';

process.env.NEXTAUTH_SECRET = 'test-secret-for-integration-test';

// Mock the steps that touch the real server filesystem / git so shallowBuild can
// run against a throwaway temp directory. Everything that matters for CallAPI
// validation (buildRefs/walker, buildModules, buildApi, writeApi, buildShallowPages,
// writeMaps, buildPageJit, validateCallApiRefs) runs for real.
jest.unstable_mockModule('../buildApp.js', () => ({
  default: ({ components }) => {
    components.app = components.app ?? {};
    components.app.html = components.app.html ?? {};
    components.app.html.appendBody = components.app.html.appendBody ?? '';
    components.app.html.appendHead = components.app.html.appendHead ?? '';
    components.appMeta = {
      slug: components.slug ?? null,
      name: components.name ?? null,
      version: components.version ?? null,
      description: components.description ?? null,
      license: components.license ?? null,
      lowdefyVersion: components.lowdefy ?? null,
      gitSha: 'test-git-sha',
    };
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
const { default: makeId } = await import('../../utils/makeId.js');
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');

// typesMap used by the dev server (snapshot map + the CallAPI action plugin).
const typesMap = {
  ...snapshotTypesMap,
  actions: {
    ...snapshotTypesMap.actions,
    CallAPI: { package: '@lowdefy/actions-core' },
  },
};

// Packages that would be installed in a real dev server using these blocks/actions.
// Set on the hydrated context so detectMissingPluginPackages doesn't short-circuit
// buildPageJit into "installing" mode.
const installedPluginPackages = new Set(['@lowdefy/blocks-basic', '@lowdefy/actions-core']);

function callApiPage(id, endpointId) {
  return `id: ${id}
type: Box
blocks:
  - id: call_btn
    type: Button
    properties:
      title: Call
    events:
      onClick:
        - id: call_action
          type: CallAPI
          params:
            endpointId: ${endpointId}
`;
}

const moduleCallApiPage = `id: invite
type: Box
blocks:
  - id: call_btn
    type: Button
    properties:
      title: Invite
    events:
      onClick:
        - id: call_action
          type: CallAPI
          params:
            endpointId:
              _module.endpointId: send-invite
`;

const returnEndpoint = (id) => `id: ${id}
type: Api
routine:
  - ':return': ok
`;

function writeFixture(configDir) {
  const write = (rel, content) => {
    const full = path.join(configDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  };

  write(
    'lowdefy.yaml',
    `lowdefy: local
name: CallAPI JIT Integration Test

modules:
  - id: inviter
    source: 'file:modules/inviter'

api:
  - _ref: api/top-endpoint.yaml

pages:
  - _ref: pages/home.yaml
  - _ref: pages/missing.yaml
`
  );

  write('api/top-endpoint.yaml', returnEndpoint('top_endpoint'));
  write('pages/home.yaml', callApiPage('home', 'top_endpoint'));
  write('pages/missing.yaml', callApiPage('missing', 'does_not_exist'));

  write(
    'modules/inviter/module.lowdefy.yaml',
    `name: Inviter

pages:
  - _ref: pages/invite.yaml

api:
  - _ref: api/send-invite.yaml
`
  );
  write('modules/inviter/api/send-invite.yaml', returnEndpoint('send-invite'));
  write('modules/inviter/pages/invite.yaml', moduleCallApiPage);
}

function readArtifact(buildDir, fileName) {
  try {
    return serializer.deserialize(JSON.parse(fs.readFileSync(path.join(buildDir, fileName), 'utf8')));
  } catch {
    return null;
  }
}

// Mirror of server-dev readBuildApiArtifacts: recursively read every endpoint
// artifact. Module endpoints live in nested dirs (build/api/<moduleId>/<id>.json)
// because their scoped endpointId contains a "/".
function readApiConfigs(directory) {
  const configs = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      configs.push(...readApiConfigs(entryPath));
    } else if (entry.name.endsWith('.json')) {
      configs.push(serializer.deserialize(JSON.parse(fs.readFileSync(entryPath, 'utf8'))));
    }
  }
  return configs;
}

function readBuildApiArtifacts(buildDir) {
  try {
    return readApiConfigs(path.join(buildDir, 'api'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

// Mirror of server-dev getBuildContext: build a fresh dev context and restore the
// skeleton artifacts from disk, including components.api (the fix under test).
function hydrateContext({ buildDir, configDir }) {
  const context = createContext({
    customTypesMap: typesMap,
    directories: {
      build: buildDir,
      config: configDir,
      server: path.resolve(buildDir, '..'),
    },
    logger: { info: () => {}, log: () => {}, warn: () => {}, error: () => {}, succeed: () => {} },
    stage: 'dev',
  });

  Object.assign(context.refMap, readArtifact(buildDir, 'refMap.json') ?? {});
  Object.assign(context.keyMap, readArtifact(buildDir, 'keyMap.json') ?? {});
  const jsMap = readArtifact(buildDir, 'jsMap.json') ?? { client: {}, server: {} };
  context.jsMap.client = jsMap.client ?? {};
  context.jsMap.server = jsMap.server ?? {};
  for (const id of readArtifact(buildDir, 'connectionIds.json') ?? []) {
    context.connectionIds.add(id);
  }
  const modules = readArtifact(buildDir, 'modules.json');
  if (modules) Object.assign(context.modules, modules);

  context.installedPluginPackages = installedPluginPackages;
  context.components = { api: readBuildApiArtifacts(buildDir) };
  context.iconImports = readArtifact(buildDir, 'iconImports.json') ?? [];
  context.dynamicIconData = {};

  const idCounter = readArtifact(buildDir, 'idCounter.json');
  if (idCounter != null) makeId.setCounter(idCounter);

  return context;
}

let buildDir;
let configDir;
let pageRegistry;
let apiArtifacts;

beforeAll(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-callapi-jit-'));
  configDir = path.join(root, 'config');
  buildDir = path.join(root, '.lowdefy', 'server', 'build');
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(buildDir, { recursive: true });

  writeFixture(configDir);

  await shallowBuild({
    customTypesMap: typesMap,
    directories: {
      config: configDir,
      build: buildDir,
      server: path.join(root, '.lowdefy', 'server'),
    },
    logger: { info: () => {}, log: () => {}, warn: () => {}, error: () => {}, succeed: () => {} },
    stage: 'dev',
  });

  pageRegistry = readArtifact(buildDir, 'pageRegistry.json');
  apiArtifacts = readBuildApiArtifacts(buildDir);
});

async function buildAndCollectWarnings(pageId) {
  const context = hydrateContext({ buildDir, configDir });
  const result = await buildPageJit({ pageId, pageRegistry, context });
  const warnings = (result?._warnings ?? []).filter((w) => w.message.includes('non-existent endpoint'));
  return { result, warnings };
}

test('shallowBuild writes scoped api endpoint artifacts to build/api', () => {
  const endpointIds = apiArtifacts.map((c) => c.endpointId).sort();
  // Top-level keeps its id; module endpoint is scoped with the module entry id.
  expect(endpointIds).toEqual(['inviter/send-invite', 'top_endpoint']);
});

test('JIT build of a page calling a top-level endpoint emits no false non-existent warning', async () => {
  const { result, warnings } = await buildAndCollectWarnings('home');
  expect(result.id).toBe('page:home');
  expect(warnings).toEqual([]);
});

test('JIT build of a module page calling its endpoint via _module.endpointId emits no false warning', async () => {
  const { result, warnings } = await buildAndCollectWarnings('inviter/invite');
  expect(result.id).toBe('page:inviter/invite');
  expect(warnings).toEqual([]);
});

test('JIT build still warns when a CallAPI targets a genuinely missing endpoint', async () => {
  const { warnings } = await buildAndCollectWarnings('missing');
  expect(warnings).toHaveLength(1);
  expect(warnings[0].message).toBe(
    'CallAPI action on page "missing" references non-existent endpoint "does_not_exist".'
  );
});
