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

import { jest } from '@jest/globals';
import { projectCaughtError } from '@lowdefy/helpers';
import { operatorsServer } from '@lowdefy/operators-js';

const secret = 'planted-dev-secret';
process.env.LOWDEFY_SECRET_TEST = secret;

jest.unstable_mockModule('@lowdefy/api', () => ({
  createApiContext: jest.fn(),
  createRequestSignal: jest.fn(({ clientSignal, timeoutSignal }) =>
    timeoutSignal ? AbortSignal.any([clientSignal, timeoutSignal]) : clientSignal
  ),
  // Returns what the server passes, so the test reads the auth-hook system context inputs.
  createSystemContext: jest.fn((options) => options),
  ensureMcpOauthResource: jest.fn(async () => {}),
  normalizeInjectedCaller: jest.fn((user) => user),
  resolveAuthentication: jest.fn(async () => {}),
  resolvePinnedOrganization: jest.fn(async () => {}),
  resolveTenantPreflight: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../build/appMeta.js', () => ({ default: {} }));
jest.unstable_mockModule('../build/config.js', () => ({ default: {} }));
jest.unstable_mockModule('../build/auth.js', () => ({ default: {} }));
jest.unstable_mockModule('../build/i18n.js', () => ({ default: {} }));
jest.unstable_mockModule('./log/createHandleError.js', () => ({
  default: jest.fn(() => jest.fn()),
}));
jest.unstable_mockModule('./log/createLogger.js', () => ({
  default: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));
jest.unstable_mockModule('./fileCache.js', () => ({ default: {} }));
jest.unstable_mockModule('./auth/getAuth.js', () => ({ default: jest.fn(() => null) }));
jest.unstable_mockModule('./auth/getHeadlessUser.js', () => ({
  default: jest.fn(() => null),
}));
jest.unstable_mockModule('./auth/getMockUser.js', () => ({ default: jest.fn(() => undefined) }));
jest.unstable_mockModule('./auth/getStrategies.js', () => ({ default: jest.fn(() => null) }));
jest.unstable_mockModule('./loadDynamicJsMap.js', () => ({ default: jest.fn(() => ({})) }));
jest.unstable_mockModule('./log/logRequest.js', () => ({ default: jest.fn() }));

// createLowdefyContext statically imports the app build's plugin artifacts,
// which only exist in a built app (build/** is gitignored). Materialize the
// minimal set it needs — same fixture strategy as auth/getDevSession.test.mjs
// — so the import resolves; clean up only what this test created.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsDir = path.resolve(dirname, '../../build/plugins');
const fixtures = [
  { file: 'agents.js', content: 'export default {};\n' },
  { file: 'connections.js', content: 'export default {};\n' },
  {
    file: 'notifications.js',
    content:
      'export default {};\nexport const interpolateProperties = () => {};\nexport const renderEmail = () => {};\n',
  },
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
// The connection plugin map carries each type's meta.dataSet, which the data session gate reads.
const connectionPlugins = {
  MongoDBCollection: { meta: { tenant: true, dataSet: 'redirect' } },
  Knex: {},
};
fixtures.forEach(({ absolutePath }) => {
  jest.unstable_mockModule(absolutePath, () => ({
    default: absolutePath.endsWith(`${path.sep}connections.js`) ? connectionPlugins : {},
    interpolateProperties: () => {},
    renderEmail: () => {},
  }));
});

afterAll(() => {
  createdFixtures.forEach((absolutePath) => fs.rmSync(absolutePath, { force: true }));
});

const { default: createLowdefyContext } = await import('./createLowdefyContext.js');
const { default: createSystemContext } = await import('./auth/createSystemContext.js');
const { journeyActorToken } = await import('./auth/journeyActor.js');
const { createApiContext } = await import('@lowdefy/api');
const { openMutantRun } = await import('./mutants/mutantRuns.js');

function createHonoContext({
  path: reqPath = '/api/request/foo',
  requestTimeoutSignal,
  headers = {},
} = {}) {
  const variables = { requestTimeoutSignal };
  return {
    get: (key) => variables[key],
    req: {
      header: (name) => (name ? headers[name] : headers),
      path: reqPath,
      method: 'POST',
      raw: { headers: new Headers(), signal: new AbortController().signal },
      url: `http://localhost${reqPath}`,
    },
  };
}

test('createLowdefyContext sets mode to dev', async () => {
  const context = await createLowdefyContext({ c: createHonoContext() });
  expect(context.mode).toEqual('dev');
});

test('createLowdefyContext cancels the request work with the incoming request signal', async () => {
  const c = createHonoContext();
  const context = await createLowdefyContext({ c });
  expect(context.signal).toBe(c.req.raw.signal);
});

test('createLowdefyContext cancels the request work when the request timeout answers first', async () => {
  const timeout = new AbortController();
  const c = createHonoContext({ requestTimeoutSignal: timeout.signal });
  const context = await createLowdefyContext({ c });
  expect(context.signal.aborted).toBe(false);
  const reason = new DOMException('The request timeout of 20ms was exceeded.', 'TimeoutError');
  timeout.abort(reason);
  expect(context.signal.aborted).toBe(true);
  expect(context.signal.reason).toBe(reason);
});

test('createLowdefyContext scrubSecrets redacts a planted secret', async () => {
  const context = await createLowdefyContext({ c: createHonoContext() });
  expect(context.scrubSecrets(`token ${secret} end`)).toEqual('token [REDACTED] end');
});

// controlTry builds the value `_error` reads from context.scrubSecrets, so a dev context has to
// scrub a caught message the same way the production server does.
test('_error on a dev context reads a caught message with a planted secret scrubbed', async () => {
  const context = await createLowdefyContext({ c: createHonoContext() });
  const error = projectCaughtError(new Error(`Connect failed with ${secret}.`), {
    scrub: context.scrubSecrets,
  });
  expect(operatorsServer._error({ error, location: 'test', params: 'message' })).toEqual(
    'Connect failed with [REDACTED].'
  );
});

test('the auth-hook system context is built with mode dev and a scrubSecrets that redacts', () => {
  const context = createSystemContext({ auth: null });
  expect(context.mode).toEqual('dev');
  expect(context.scrubSecrets(`token ${secret} end`)).toEqual('token [REDACTED] end');
});

test('createLowdefyContext forwards the verified loopback journey cookies on loopbackHeaders', async () => {
  const context = await createLowdefyContext({
    c: createHonoContext({
      headers: {
        cookie: `session=abc; lowdefy_journey_actor=${journeyActorToken}.203.0.113.7; lowdefy_journey_mutant=${journeyActorToken}.run1`,
      },
    }),
  });
  expect(context.loopbackHeaders).toEqual({
    cookie: `lowdefy_journey_mutant=${journeyActorToken}.run1`,
  });
});

test('createLowdefyContext forwards no Cookie header when the request carries no journey cookie', async () => {
  const context = await createLowdefyContext({ c: createHonoContext() });
  expect(context.loopbackHeaders).toEqual({});
});

test('createLowdefyContext serves the mutated artifact to a request whose cookie names an open mutant run', async () => {
  const artifact = { id: 'page:form', blocks: [] };
  createApiContext.mockImplementationOnce((context) => {
    context.readConfigFile = async () => artifact;
  });
  const opened = openMutantRun({
    mutant: {
      buildId: 'b',
      artifact: 'pages/form.json',
      key: 'missing',
      arg: null,
      operator: 'drop-block',
    },
  });
  const context = await createLowdefyContext({
    c: createHonoContext({
      headers: { cookie: `lowdefy_journey_mutant=${journeyActorToken}.${opened.cookiePayload}` },
    }),
  });
  await context.readConfigFile('pages/form.json');
  expect(opened.run.misses).toEqual([{ reason: 'key not found', path: 'pages/form.json' }]);
  expect(context.loopbackHeaders.cookie).toEqual(
    `lowdefy_journey_mutant=${journeyActorToken}.${opened.cookiePayload}`
  );
  opened.close();
});

test('createLowdefyContext leaves readConfigFile alone without a mutant cookie', async () => {
  const readConfigFile = async () => ({});
  createApiContext.mockImplementationOnce((context) => {
    context.readConfigFile = readConfigFile;
  });
  const context = await createLowdefyContext({ c: createHonoContext() });
  expect(context.readConfigFile).toBe(readConfigFile);
});

const { default: dataSessionRegistry } = await import('../docs/dataSets/dataSessionRegistry.js');
const { default: getAuth } = await import('./auth/getAuth.js');
const { default: getHeadlessUser } = await import('./auth/getHeadlessUser.js');
const { default: getMockUser } = await import('./auth/getMockUser.js');
const { resolveAuthentication, resolveTenantPreflight } = await import('@lowdefy/api');

describe('data sessions', () => {
  const realArtifact = {
    type: 'MongoDBCollection',
    properties: { databaseUri: { _secret: 'MONGODB_URI' }, collection: 'tickets' },
  };

  function registerSession(state = 'open') {
    const session = {
      id: 'session1',
      name: 'staging-sample',
      state,
      databaseUri: 'mongodb://memory/',
      databaseName: 'ld_aaaaaaaaaaaa',
      work: new Set(),
    };
    dataSessionRegistry.set(session.id, session);
    return session;
  }

  function mockReadConfigFile() {
    const readConfigFile = jest.fn(async () => realArtifact);
    createApiContext.mockImplementationOnce((context) => {
      context.readConfigFile = readConfigFile;
    });
    return readConfigFile;
  }

  afterEach(() => {
    dataSessionRegistry.clear();
  });

  test('a verified data cookie redirects connections, tracks background work, forwards the cookie and skips the tenant preflight', async () => {
    const session = registerSession();
    mockReadConfigFile();
    getHeadlessUser.mockReturnValueOnce({ user: { id: 'u_1', roles: ['admin'] }, explicit: true });
    const cookie = `lowdefy_journey_data=${journeyActorToken}.session1`;
    const context = await createLowdefyContext({ c: createHonoContext({ headers: { cookie } }) });
    expect((await context.readConfigFile('connections/tickets.json')).properties).toEqual({
      databaseUri: 'mongodb://memory/',
      databaseName: 'ld_aaaaaaaaaaaa',
      collection: 'tickets',
    });
    expect(context.dataSet).toEqual('staging-sample');
    expect(context.loopbackHeaders).toEqual({ cookie });
    expect(resolveTenantPreflight).not.toHaveBeenCalled();
    let release;
    const work = new Promise((resolve) => {
      release = resolve;
    });
    context.waitUntil(work);
    expect(session.work.has(work)).toBe(true);
    release();
    await work;
    await Promise.resolve();
    expect(session.work.size).toBe(0);
  });

  test('a data-session request refuses a connection whose type declares no dataSet, naming it', async () => {
    registerSession();
    createApiContext.mockImplementationOnce((context) => {
      context.readConfigFile = async () => ({
        connectionId: 'warehouse',
        type: 'Knex',
        properties: { client: 'pg', connection: 'postgres://real/' },
      });
    });
    const context = await createLowdefyContext({
      c: createHonoContext({
        headers: { cookie: `lowdefy_journey_data=${journeyActorToken}.session1` },
      }),
    });
    await expect(context.readConfigFile('connections/warehouse.json')).rejects.toThrow(
      'Connection "warehouse" (type Knex) cannot run under data set "staging-sample": its type does not say how to redirect it.'
    );
  });

  test('a data cookie and a mutant cookie are both forwarded on loopbackHeaders', async () => {
    registerSession();
    const opened = openMutantRun({
      mutant: {
        buildId: 'b',
        artifact: 'pages/form.json',
        key: 'k',
        arg: null,
        operator: 'drop-block',
      },
    });
    const data = `lowdefy_journey_data=${journeyActorToken}.session1`;
    const mutant = `lowdefy_journey_mutant=${journeyActorToken}.${opened.cookiePayload}`;
    const context = await createLowdefyContext({
      c: createHonoContext({ headers: { cookie: `${mutant}; ${data}` } }),
    });
    expect(context.loopbackHeaders).toEqual({ cookie: `${data}; ${mutant}` });
    opened.close();
  });

  test('a wrong token or no data cookie gets no redirect, no waitUntil and no data set', async () => {
    registerSession();
    for (const headers of [{ cookie: 'lowdefy_journey_data=forged.session1' }, {}]) {
      const readConfigFile = mockReadConfigFile();
      const context = await createLowdefyContext({ c: createHonoContext({ headers }) });
      expect(context.readConfigFile).toBe(readConfigFile);
      expect(context.waitUntil).toBeUndefined();
      expect(context.dataSet).toBeUndefined();
      expect(context.loopbackHeaders).toEqual({});
    }
    expect(resolveTenantPreflight).toHaveBeenCalledTimes(2);
  });

  test('a verified data cookie for a closed or unknown session is answered 410 and reads no database', async () => {
    const session = registerSession();
    dataSessionRegistry.delete(session.id);
    for (const id of ['session1', 'never-opened']) {
      const readConfigFile = mockReadConfigFile();
      const error = await createLowdefyContext({
        c: createHonoContext({
          headers: { cookie: `lowdefy_journey_data=${journeyActorToken}.${id}` },
        }),
      }).catch((caught) => caught);
      expect(error.status).toBe(410);
      const response = error.getResponse();
      expect(response.status).toBe(410);
      expect(await response.json()).toEqual({
        name: 'DataSessionEnded',
        message: `Data session ${id} has ended; this request outlived its journey.`,
      });
      expect(readConfigFile).not.toHaveBeenCalled();
      createApiContext.mockReset();
    }
    expect(getAuth).not.toHaveBeenCalled();
  });

  test('a data-session request with no headless cookie gets no auth engine and no user', async () => {
    registerSession();
    const context = await createLowdefyContext({
      c: createHonoContext({
        path: '/api/detached/nightly',
        headers: { cookie: `lowdefy_journey_data=${journeyActorToken}.session1` },
      }),
    });
    expect(context.auth).toBeNull();
    expect(context.user).toBeNull();
    expect(getAuth).not.toHaveBeenCalled();
    expect(resolveAuthentication).not.toHaveBeenCalled();
  });
});

describe('who a headless caller is under a dev mock user', () => {
  const mockUser = { id: 'mock', roles: ['mock-role'] };

  test('a journey user the caller named wins over the mock user', async () => {
    getMockUser.mockReturnValueOnce(mockUser);
    getHeadlessUser.mockReturnValueOnce({
      user: { id: 'lowdefy-headless', name: 'Lowdefy Headless', roles: ['admin'] },
      explicit: true,
    });
    const context = await createLowdefyContext({ c: createHonoContext() });
    expect(context.auth).toBeNull();
    expect(context.user.roles).toEqual(['admin']);
  });

  test('the roleless headless default yields to the mock user', async () => {
    getMockUser.mockReturnValueOnce(mockUser);
    getHeadlessUser.mockReturnValueOnce({
      user: { id: 'lowdefy-headless', name: 'Lowdefy Headless', roles: [] },
      explicit: false,
    });
    const context = await createLowdefyContext({ c: createHonoContext() });
    expect(context.user).toEqual(mockUser);
  });

  test('the roleless headless default is the caller when no mock user is active', async () => {
    getHeadlessUser.mockReturnValueOnce({
      user: { id: 'lowdefy-headless', name: 'Lowdefy Headless', roles: [] },
      explicit: false,
    });
    const context = await createLowdefyContext({ c: createHonoContext() });
    expect(context.user).toEqual({ id: 'lowdefy-headless', name: 'Lowdefy Headless', roles: [] });
  });
});
