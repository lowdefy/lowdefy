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

function createHonoContext({ path: reqPath = '/api/request/foo' } = {}) {
  return {
    req: {
      header: (name) => (name ? undefined : {}),
      path: reqPath,
      method: 'POST',
      raw: { headers: new Headers() },
      url: `http://localhost${reqPath}`,
    },
  };
}

test('createLowdefyContext sets mode to dev', async () => {
  const context = await createLowdefyContext({ c: createHonoContext() });
  expect(context.mode).toEqual('dev');
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
