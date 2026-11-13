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
import path from 'path';
import { fileURLToPath } from 'url';

import { Hono } from 'hono';
import { vi, afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

const secret = 'planted-e2e-secret';
process.env.LOWDEFY_SECRET_TEST = secret;

vi.doMock('@lowdefy/api', () => ({
  createInjectedApiContext: vi.fn(),
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
vi.doMock('../../lib/server/log/createLogger.js', () => ({
  default: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
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
const { createInjectedApiContext } = await import('@lowdefy/api');
const { default: authJson } = await import('../../lib/build/auth.js');
const { default: getUser } = await import('../../lib/server/auth/getUser.js');

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
  app.get('/api/caller', (c) => {
    const context = c.get('lowdefyContext');
    return c.json({ organization: context.organization, user: context.user });
  });
  return app;
}

afterEach(() => {
  delete authJson.organizations;
});

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

test('apiContext builds every request context from the built auth config', async () => {
  await createApp().request('/api/ping');
  expect(createInjectedApiContext).toHaveBeenCalledTimes(1);
  const [context, options] = createInjectedApiContext.mock.calls[0];
  expect(context.mode).toEqual('prod');
  expect(options).toEqual({ authJson });
});

test('a cookie user in a tenant-policy app gets the tenant policy binding, so the wall engages', async () => {
  const actual = await vi.importActual('@lowdefy/api');
  createInjectedApiContext.mockImplementationOnce(actual.createInjectedApiContext);
  authJson.organizations = { policy: 'tenant' };
  getUser.mockReturnValueOnce({ id: 'u_1', roles: ['admin'] });
  const res = await createApp().request('/api/caller');
  expect(await res.json()).toEqual({
    organization: { policy: 'tenant', pinned: null },
    user: { id: 'u_1', roles: ['admin'] },
  });
});

test('a cookie user in an app that declares no organizations gets no organization binding', async () => {
  const actual = await vi.importActual('@lowdefy/api');
  createInjectedApiContext.mockImplementationOnce(actual.createInjectedApiContext);
  getUser.mockReturnValueOnce({ id: 'u_1', roles: ['admin'] });
  const res = await createApp().request('/api/caller');
  expect(await res.json()).toEqual({ organization: null, user: { id: 'u_1', roles: ['admin'] } });
});

const { default: createErrorHandler } = await import('./errorHandler.js');

// No auth engine runs in the e2e server, so the gate's enforcement facts come from the built auth
// config (createInjectedApiContext). Each test sends a request through the apiContext middleware,
// runs the real @lowdefy/api function on the context it built, and is answered by the server's
// own error handler.
describe('the gate an injected caller meets', () => {
  const artifacts = {
    'routes.json': [{ pageId: 'reports', path: 'reports' }],
    'pages/reports.json': {
      id: 'page:reports',
      pageId: 'reports',
      blockId: 'reports',
      type: 'Box',
      auth: { public: false },
    },
    'api/nightly.json': {
      endpointId: 'nightly',
      type: 'InternalApi',
      auth: { public: false },
      routine: [],
    },
  };
  const authConfigured = {
    authPages: { signIn: '/login', twoFactorEnrol: '/two-factor-enrol' },
    configured: true,
    pagesProtectedByDefault: true,
    twoFactor: { required: true },
  };
  let actual;

  // With no lowdefy_e2e_user cookie (getUser answers nothing) the caller is signed out.
  async function send({ path: requestPath = '/api/gate', run }) {
    const app = new Hono();
    app.use('*', apiContext());
    app.all('*', async (c) => {
      const context = c.get('lowdefyContext');
      context.readConfigFile = async (file) => artifacts[file] ?? null;
      return c.json(await run(context));
    });
    app.onError(createErrorHandler({ logger: { error: vi.fn(), warn: vi.fn() } }));
    const res = await app.request(requestPath, { method: 'POST' });
    return { status: res.status, body: await res.json() };
  }

  beforeEach(async () => {
    actual = await vi.importActual('@lowdefy/api');
    createInjectedApiContext.mockImplementationOnce(actual.createInjectedApiContext);
  });

  afterEach(() => {
    Object.keys(authConfigured).forEach((key) => {
      delete authJson[key];
    });
  });

  test('a signed-out caller asking for a missing request is told to authenticate with a 401, not that the request does not exist', async () => {
    Object.assign(authJson, authConfigured);
    const answer = await send({
      path: '/api/request/reports/missing',
      run: (context) =>
        actual.callRequest(context, { pageId: 'reports', payload: {}, requestId: 'missing' }),
    });
    expect(answer).toEqual({
      status: 401,
      body: {
        name: 'AuthenticationError',
        message: 'Authentication required for request "missing".',
      },
    });
  });

  test('a signed-out caller asking for a missing endpoint is told to authenticate with a 401, not that the endpoint does not exist', async () => {
    Object.assign(authJson, authConfigured);
    const answer = await send({
      path: '/api/endpoints/missing',
      run: (context) => actual.callEndpoint(context, { endpointId: 'missing', payload: {} }),
    });
    expect(answer).toEqual({
      status: 401,
      body: {
        name: 'AuthenticationError',
        message: 'Authentication required for API endpoint "missing".',
      },
    });
  });

  test('a signed-out caller asking for an internal endpoint is told to authenticate with a 401, not that the endpoint does not exist', async () => {
    Object.assign(authJson, authConfigured);
    const answer = await send({
      path: '/api/endpoints/nightly',
      run: (context) => actual.callEndpoint(context, { endpointId: 'nightly', payload: {} }),
    });
    expect(answer).toEqual({
      status: 401,
      body: {
        name: 'AuthenticationError',
        message: 'Authentication required for API endpoint "nightly".',
      },
    });
  });

  test('a signed-out caller on an unknown path is unauthenticated, not not_found, when pages are protected by default', async () => {
    Object.assign(authJson, authConfigured);
    const answer = await send({
      run: (context) => actual.getPageConfig(context, { path: 'no-such-page' }),
    });
    expect(answer).toEqual({ status: 200, body: { status: 'unauthenticated' } });
  });

  test('a cookie user carrying two_factor_enrolled false is asked to enrol on a protected page when a second factor is required', async () => {
    Object.assign(authJson, authConfigured);
    getUser.mockReturnValueOnce({ id: 'u_1', roles: [], two_factor_enrolled: false });
    const answer = await send({
      run: (context) => actual.getPageConfig(context, { path: 'reports' }),
    });
    expect(answer).toEqual({
      status: 200,
      body: { status: 'enrol_required', pageId: 'reports', pathParams: {} },
    });
  });

  test('a cookie user with no two_factor_enrolled key opens a protected page when a second factor is required', async () => {
    Object.assign(authJson, authConfigured);
    getUser.mockReturnValueOnce({ id: 'u_1', roles: [] });
    const answer = await send({
      run: (context) => actual.getPageConfig(context, { path: 'reports' }),
    });
    expect(answer.body.status).toEqual('ok');
    expect(answer.body.pageId).toEqual('reports');
  });

  test('an app with no auth configured gets no organization and no enforcement facts, and a signed-out caller is still told a missing request does not exist', async () => {
    const answer = await send({
      run: async (context) => ({
        authEnforcement: context.authEnforcement,
        organization: context.organization,
        missingRequest: await actual
          .callRequest(context, { pageId: 'reports', payload: {}, requestId: 'missing' })
          .catch((error) => ({ name: error.name, message: error.message })),
      }),
    });
    expect(answer.body).toEqual({
      authEnforcement: null,
      organization: null,
      missingRequest: { name: 'ConfigError', message: 'Request "missing" does not exist.' },
    });
  });
});
