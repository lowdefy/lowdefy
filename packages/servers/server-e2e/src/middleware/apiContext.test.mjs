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
import { jest } from '@jest/globals';

const secret = 'planted-e2e-secret';
process.env.LOWDEFY_SECRET_TEST = secret;

jest.unstable_mockModule('@lowdefy/api', () => ({ createApiContext: jest.fn() }));
jest.unstable_mockModule('../../lib/build/appMeta.js', () => ({ default: {} }));
jest.unstable_mockModule('../../lib/build/config.js', () => ({ default: {} }));
jest.unstable_mockModule('../../lib/build/i18n.js', () => ({ default: {} }));
jest.unstable_mockModule('../../lib/server/log/createHandleError.js', () => ({
  default: jest.fn(() => jest.fn()),
}));
jest.unstable_mockModule('../../lib/server/log/createLogger.js', () => ({
  default: jest.fn(() => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() })),
}));
jest.unstable_mockModule('../../lib/server/fileCache.js', () => ({ default: {} }));
jest.unstable_mockModule('../../lib/server/getE2eSecrets.js', () => ({
  default: jest.fn(() => ({ TEST: process.env.LOWDEFY_SECRET_TEST })),
}));
jest.unstable_mockModule('../../lib/server/auth/session.js', () => ({
  default: jest.fn(() => undefined),
}));
jest.unstable_mockModule('../../lib/server/log/logRequest.js', () => ({ default: jest.fn() }));

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
