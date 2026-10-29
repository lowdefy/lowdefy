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

import fs from 'fs';
import fsPromises from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

import { Hono } from 'hono';
import { serializer } from '@lowdefy/helpers';
import { vi, afterAll, expect, test } from 'vitest';

const secret = 'planted-e2e-secret';
process.env.LOWDEFY_SECRET_TEST = secret;

// The client-error route runs the real logClientError, so a test can follow a
// client error's location through context.readMaps.
const actualApi = await vi.importActual('@lowdefy/api');
vi.doMock('@lowdefy/api', () => ({
  isSameOriginRequest: actualApi.isSameOriginRequest,
  logClientError: actualApi.logClientError,
  parseRequestBody: actualApi.parseRequestBody,
  createApiContext: vi.fn(),
  createRequestSignal: vi.fn(({ clientSignal }) => clientSignal),
  normalizeInjectedCaller: vi.fn((user) => user),
}));
vi.doMock('../../lib/build/appMeta.js', () => ({ default: {} }));
vi.doMock('../../lib/build/config.js', () => ({ default: {} }));
vi.doMock('../../lib/build/auth.js', () => ({ default: {} }));
vi.doMock('../../lib/build/i18n.js', () => ({ default: {} }));
vi.doMock('../../lib/server/log/createHandleError.js', () => ({
  default: vi.fn(() => vi.fn()),
}));
const loggers = [];
vi.doMock('../../lib/server/log/createLogger.js', () => ({
  default: vi.fn(() => {
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    loggers.push(logger);
    return logger;
  }),
}));
vi.doMock('../../lib/server/fileCache.js', () => ({ default: {} }));
vi.doMock('../../lib/server/getE2eSecrets.js', () => ({
  default: vi.fn(() => ({ TEST: process.env.LOWDEFY_SECRET_TEST })),
}));
vi.doMock('../../lib/server/auth/getUser.js', () => ({
  default: vi.fn(() => undefined),
}));
vi.doMock('../../lib/server/log/logRequest.js', () => ({ default: vi.fn() }));

// apiContext statically imports the app build's plugin artifacts, which only
// exist in a built app (build/** is gitignored). Materialize the minimal set
// it needs so the import resolves; clean up only what this test created.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsDir = path.resolve(dirname, '../../build/plugins');
const fixtures = [
  { file: 'agents.js', content: 'export default {};\n' },
  { file: 'connections.js', content: 'export default {};\n' },
  { file: path.join('operators', 'server.js'), content: 'export default {};\n' },
  { file: path.join('operators', 'serverJsMap.js'), content: 'export default {};\n' },
  { file: 'steps.js', content: 'export default {};\n' },
  { file: 'websockets.js', content: 'export default {};\n' },
].map(({ file, content }) => ({ absolutePath: path.join(pluginsDir, file), content }));

const createdFixtures = [];
fixtures.forEach(({ absolutePath, content }) => {
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
    createdFixtures.push(absolutePath);
  }
});

// A checkout that has built an app already holds real artifacts here, which import plugins this
// package does not depend on, so the stubs are also mocked over whatever is on disk.
fixtures.forEach(({ absolutePath }) => {
  vi.doMock(absolutePath, () => ({
    default: {},
    interpolateProperties: () => {},
    renderEmail: () => {},
  }));
});

afterAll(() => {
  createdFixtures.forEach((absolutePath) => fs.rmSync(absolutePath, { force: true }));
});

const { default: apiContext } = await import('./apiContext.js');

function createApp() {
  const app = new Hono();
  app.use('*', apiContext());
  app.get('/api/ping', (c) => {
    const context = c.get('lowdefyContext');
    return c.json({
      mode: context.mode,
      scrubbed: context.scrubSecrets(`token ${secret} end`),
    });
  });
  return app;
}

test('apiContext sets mode to prod', async () => {
  const res = await createApp().request('/api/ping');
  expect(res.status).toEqual(200);
  const body = await res.json();
  expect(body.mode).toEqual('prod');
});

test('apiContext scrubSecrets redacts a planted secret', async () => {
  const res = await createApp().request('/api/ping');
  expect(res.status).toEqual(200);
  const body = await res.json();
  expect(body.scrubbed).toEqual('token [REDACTED] end');
});

// Each client-error test loads apiContext afresh, so readMaps' per-process load
// starts unmade, and runs it with its working directory on a temp app whose
// build folder holds the maps or not.
async function createClientErrorApp({ withMaps }) {
  const appDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-e2e-api-context-'));
  const buildDirectory = path.join(appDirectory, 'build');
  fs.mkdirSync(buildDirectory);
  if (withMaps) {
    const keyMap = {
      k1: { s: 'root', p: 'k0', r: 'ref_0', l: 1 },
      k2: { s: '.pages[0:home]', p: 'k1', r: 'ref_1', l: 1 },
      k3: { s: '.blocks[0:header]', p: 'k2', l: 5 },
    };
    const refMap = { ref_0: { path: 'lowdefy.yaml' }, ref_1: { path: 'pages/home.yaml' } };
    fs.writeFileSync(
      path.join(buildDirectory, 'keyMap.json.gz'),
      zlib.gzipSync(JSON.stringify(keyMap))
    );
    fs.writeFileSync(
      path.join(buildDirectory, 'refMap.json.gz'),
      zlib.gzipSync(JSON.stringify(refMap))
    );
  }
  vi.spyOn(process, 'cwd').mockReturnValue(appDirectory);
  vi.resetModules();
  const { default: freshApiContext } = await import('./apiContext.js');
  const { default: clientErrorHandler } = await import('../routes/clientError.js');
  const app = new Hono();
  app.use('*', freshApiContext());
  app.all('/api/client-error', clientErrorHandler);
  return { app, appDirectory };
}

function postClientError(app) {
  const error = new Error('Block failed');
  error.configKey = 'k3';
  return app.request('http://localhost/api/client-error', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      host: 'localhost',
      origin: 'http://localhost',
      'sec-fetch-site': 'same-origin',
    },
    body: JSON.stringify(serializer.serialize(error)),
  });
}

function lastLoggedError() {
  const logger = loggers.at(-1);
  return logger.error.mock.calls.at(-1)[0];
}

function mapReads(readFile) {
  return readFile.mock.calls
    .map(([filePath]) => path.basename(String(filePath)))
    .filter((name) => name.startsWith('keyMap.json') || name.startsWith('refMap.json'));
}

test('a client error resolves its location from the gzipped maps through context.readMaps', async () => {
  const { app, appDirectory } = await createClientErrorApp({ withMaps: true });
  try {
    const res = await postClientError(app);
    expect(res.status).toEqual(200);
    const logged = lastLoggedError();
    expect(logged.message).toEqual('Block failed');
    expect(logged.source).toEqual(path.join(appDirectory, 'pages/home.yaml:5'));
    expect(logged.config).toEqual('root.pages[0:home].blocks[0:header]');
  } finally {
    vi.restoreAllMocks();
    fs.rmSync(appDirectory, { recursive: true, force: true });
  }
});

test('a second client error on a build with no maps reads no map file', async () => {
  const { app, appDirectory } = await createClientErrorApp({ withMaps: false });
  const readFile = vi.spyOn(fsPromises, 'readFile');
  try {
    expect((await postClientError(app)).status).toEqual(200);
    expect(lastLoggedError().source).toBeUndefined();
    expect(mapReads(readFile).sort()).toEqual(['keyMap.json.gz', 'refMap.json.gz']);

    readFile.mockClear();
    expect((await postClientError(app)).status).toEqual(200);
    expect(lastLoggedError().source).toBeUndefined();
    expect(mapReads(readFile)).toEqual([]);
  } finally {
    vi.restoreAllMocks();
    fs.rmSync(appDirectory, { recursive: true, force: true });
  }
});
