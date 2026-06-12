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

// S3a round-trip gate: a compiled build emits a .mjs closure module next to
// every request and connection JSON; importing the closure and evaluating it
// must match ServerParser.parse over the JSON twin's properties — the same
// build artifacts the server consumes, through both dispatch paths.
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { serializer } from '@lowdefy/helpers';
import { ServerParser } from '@lowdefy/operators';
import { evaluateClosures } from '@lowdefy/compile/runtime';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'tests/success');
const tmpDir = path.join(__dirname, '.tmp-closures');

process.env.NEXTAUTH_SECRET = 'test-secret-for-closure-tests';

jest.unstable_mockModule('./build/buildApp.js', () => ({
  default: ({ components }) => {
    if (!components.app) components.app = {};
    if (!components.app.html) components.app.html = {};
    if (!components.app.html.appendBody) components.app.html.appendBody = '';
    if (!components.app.html.appendHead) components.app.html.appendHead = '';
    components.appMeta = { gitSha: 'test' };
    return components;
  },
}));
const mockWriteBuildArtifact = jest.fn();
jest.unstable_mockModule('./utils/writeBuildArtifact.js', () => ({
  default: () => mockWriteBuildArtifact,
}));
jest.unstable_mockModule('./build/full/updateServerPackageJson.js', () => ({
  default: async () => {},
}));
jest.unstable_mockModule('./build/copyPublicFolder.js', () => ({
  default: async () => {},
}));

const { default: build } = await import('./index.js');
const { default: makeId } = await import('./utils/makeId.js');
const { snapshotTypesMap } = await import('./test-utils/runBuildForSnapshots.js');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// Test operators standing in for the server runtime set — what matters is
// that emit-time known/unknown matches dispatch (both keyed by typesMap).
const operators = {
  _payload: ({ params, payload }) => payload[params] ?? null,
  _state: ({ params, state }) => state[params] ?? null,
  _secret: ({ params, secrets }) => secrets[params] ?? null,
};

test('every request and connection artifact has a closure twin matching ServerParser', async () => {
  const configDir = path.join(fixturesDir, '49-request-payload-app');
  const artifacts = {};
  makeId.reset();
  mockWriteBuildArtifact.mockImplementation((filePath, content) => {
    artifacts[filePath] = content;
  });
  await build({
    compiler: true,
    customTypesMap: snapshotTypesMap,
    directories: {
      config: configDir,
      build: path.join(tmpDir, 'build'),
      server: path.join(tmpDir, 'server'),
    },
    logger: { info() {}, log() {}, warn() {}, error() {}, succeed() {} },
    stage: 'prod',
  });

  const jsonConfigs = Object.keys(artifacts).filter(
    (k) => (k.startsWith('pages/') && k.includes('/requests/')) || k.startsWith('connections/')
  );
  const requests = jsonConfigs.filter((k) => k.endsWith('.json'));
  expect(requests.length).toBeGreaterThan(2);

  const env = {
    location: 'closure-roundtrip',
    payload: { query: 'abc', limit: 5, name: 'x', value: 1 },
    state: { searchQuery: 'abc', pageSize: 5 },
    secrets: { API_TOKEN: 'tok' },
    user: { id: 'u1' },
  };
  const parser = new ServerParser({ operators, secrets: env.secrets, user: env.user });

  fs.mkdirSync(tmpDir, { recursive: true });
  for (const jsonKey of requests) {
    const moduleKey = jsonKey.replace(/\.json$/, '.mjs');
    expect(artifacts[moduleKey]).toBeDefined();

    const config = serializer.deserializeFromString(artifacts[jsonKey]);
    const parsed = parser.parse({
      input: config.properties ?? {},
      location: env.location,
      payload: env.payload,
      state: env.state,
    });

    const file = path.join(tmpDir, moduleKey.replace(/[/]/g, '__'));
    fs.writeFileSync(file, artifacts[moduleKey]);
    const mod = await import(`${file}?v=1`);
    const evaluated = evaluateClosures({
      closure: mod.default,
      operators,
      location: env.location,
      payload: env.payload,
      state: env.state,
      secrets: env.secrets,
      user: env.user,
      parser,
    });

    expect(evaluated.output).toEqual(parsed.output);
    expect(evaluated.errors).toEqual(parsed.errors);
  }
});

test('S3c: public pages emit internal-form modules with closure parse roots', async () => {
  const configDir = path.join(fixturesDir, '49-request-payload-app');
  const artifacts = {};
  makeId.reset();
  mockWriteBuildArtifact.mockImplementation((filePath, content) => {
    artifacts[filePath] = content;
  });
  await build({
    compiler: true,
    customTypesMap: snapshotTypesMap,
    directories: {
      config: configDir,
      build: path.join(tmpDir, 'build'),
      server: path.join(tmpDir, 'server'),
    },
    logger: { info() {}, log() {}, warn() {}, error() {}, succeed() {} },
    stage: 'prod',
  });

  const pageJsons = Object.keys(artifacts).filter(
    (k) => k.startsWith('pages/') && k.endsWith('.json') && !k.includes('/requests/')
  );
  expect(pageJsons.length).toBeGreaterThan(0);
  expect(artifacts['pageRegistry.mjs']).toBeDefined();

  fs.mkdirSync(tmpDir, { recursive: true });
  for (const jsonKey of pageJsons) {
    const moduleKey = jsonKey.replace(/\.json$/, '.mjs');
    const pageData = JSON.parse(artifacts[jsonKey]);
    if (pageData.auth?.public !== true) {
      expect(artifacts[moduleKey]).toBeUndefined();
      continue;
    }
    expect(artifacts[moduleKey]).toBeDefined();
    expect(artifacts['pageRegistry.mjs']).toContain(JSON.stringify(`./${moduleKey}`));
    const typesKey = jsonKey.replace(/\.json$/, '.types.mjs');
    expect(artifacts[typesKey]).toBeDefined();
    expect(artifacts['pageRegistry.mjs']).toContain(JSON.stringify(`./${typesKey}`));

    const file = path.join(tmpDir, moduleKey.replace(/[/]/g, '__'));
    fs.writeFileSync(file, artifacts[moduleKey]);
    const mod = await import(`${file}?v=1`);
    const fromModule = mod.default();
    expect(fromModule.pageId).toBe(pageData.pageId);
    expect(fromModule.auth).toBeUndefined();
    // Internal form: provenance markers ride hidden.
    expect(Object.keys(fromModule)).not.toContain('~k');
    expect(fromModule['~k']).toBe(pageData['~k']);
    expect(mod.default()).not.toBe(fromModule);
  }

  // The home page's request payloads carry _state operators — those parse
  // roots ship as closures (the engine adapter evaluates them).
  const homeFile = path.join(tmpDir, 'home.page.mjs');
  fs.writeFileSync(homeFile, artifacts['pages/home.mjs']);
  const home = (await import(`${homeFile}?v=1`)).default();
  const withPayloadOps = home.requests.filter((r) => typeof r.payload === 'function');
  expect(withPayloadOps.length).toBeGreaterThan(0);
});

test('S3a: endpoints emit whole-config modules with routine closures matching ServerParser', async () => {
  const configDir = path.join(fixturesDir, '66-module-with-api');
  const artifacts = {};
  makeId.reset();
  mockWriteBuildArtifact.mockImplementation((filePath, content) => {
    artifacts[filePath] = content;
  });
  await build({
    compiler: true,
    customTypesMap: snapshotTypesMap,
    directories: {
      config: configDir,
      build: path.join(tmpDir, 'build'),
      server: path.join(tmpDir, 'server'),
    },
    logger: { info() {}, log() {}, warn() {}, error() {}, succeed() {} },
    stage: 'prod',
  });

  const jsonKey = 'api/inviter/send-invite.json';
  const moduleKey = 'api/inviter/send-invite.mjs';
  expect(artifacts[jsonKey]).toBeDefined();
  expect(artifacts[moduleKey]).toBeDefined();

  fs.mkdirSync(tmpDir, { recursive: true });
  const file = path.join(tmpDir, 'endpoint__send-invite.mjs');
  fs.writeFileSync(file, artifacts[moduleKey]);
  const mod = await import(`${file}?v=1`);

  const config = serializer.deserializeFromString(artifacts[jsonKey]);
  const endpoint = mod.default();

  // The routine runner traverses structure as data — auth stays for
  // authorizeApiEndpoint, ~k markers ride hidden for error locations.
  expect(endpoint.endpointId).toBe(config.endpointId);
  expect(endpoint.auth).toEqual(config.auth);
  expect(Array.isArray(endpoint.routine)).toBe(true);
  expect(Object.keys(endpoint)).not.toContain('~k');
  expect(endpoint['~k']).toBe(config['~k']);
  expect(mod.default()).not.toBe(endpoint);

  // The send-email step's properties carry a _payload operator — that root
  // ships as a closure and must match ServerParser.parse on the JSON twin.
  const step = endpoint.routine[0];
  const configStep = config.routine[0];
  expect(step.id).toBe(configStep.id);
  expect(step.type).toBe(configStep.type);
  expect(step.connectionId).toBe(configStep.connectionId);
  expect(step['~k']).toBe(configStep['~k']);
  expect(typeof step.properties).toBe('function');

  const env = {
    location: 'endpoint-roundtrip',
    payload: { email: 'ada@example.com' },
    state: {},
    secrets: { SENDGRID_KEY: 'sg-key' },
    user: { id: 'u1' },
  };
  const parser = new ServerParser({ operators, secrets: env.secrets, user: env.user });
  const parsed = parser.parse({
    input: configStep.properties,
    location: env.location,
    payload: env.payload,
    state: env.state,
  });
  const evaluated = evaluateClosures({
    closure: step.properties,
    operators,
    location: env.location,
    payload: env.payload,
    state: env.state,
    secrets: env.secrets,
    user: env.user,
    parser,
  });
  expect(evaluated.output).toEqual(parsed.output);
  expect(evaluated.errors).toEqual(parsed.errors);
  expect(evaluated.output.to).toBe('ada@example.com');
});
