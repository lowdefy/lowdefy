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
  default: jest.fn(() => undefined),
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
fixtures.forEach(({ absolutePath }) => {
  jest.unstable_mockModule(absolutePath, () => ({
    default: {},
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

test('createLowdefyContext sets an empty loopback cookie when the request carries no journey cookie', async () => {
  const context = await createLowdefyContext({ c: createHonoContext() });
  expect(context.loopbackHeaders).toEqual({ cookie: '' });
});
