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

import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import createPlaywrightConfig from './createPlaywrightConfig.js';

const packageDir = '/repo/packages/plugins/blocks/blocks-basic';

afterEach(() => {
  delete process.env.LOWDEFY_E2E_SERVER;
});

test('createPlaywrightConfig builds and starts the production server by default', () => {
  const config = createPlaywrightConfig({ packageDir });
  assert.match(config.webServer.command, /index\.js build /);
  assert.match(config.webServer.command, /index\.js start /);
  assert.match(config.webServer.command, /--server-directory \/repo\/packages\/servers\/server /);
  assert.doesNotMatch(config.webServer.command, /server-dev|server-e2e/);
  assert.equal(config.webServer.timeout, 180000);
});

test('createPlaywrightConfig with server dev starts the development server without building', () => {
  const config = createPlaywrightConfig({ packageDir, server: 'dev' });
  assert.match(config.webServer.command, /index\.js dev /);
  assert.match(config.webServer.command, /--dev-directory \/repo\/packages\/servers\/server-dev /);
  assert.match(config.webServer.command, /--no-open/);
  assert.doesNotMatch(config.webServer.command, /index\.js build /);
  assert.equal(config.webServer.timeout, 600000);
});

test('createPlaywrightConfig with server e2e builds and starts the e2e server', () => {
  const config = createPlaywrightConfig({ packageDir, server: 'e2e' });
  assert.match(config.webServer.command, /index\.js build /);
  assert.match(
    config.webServer.command,
    /--server-directory \/repo\/packages\/servers\/server-e2e /
  );
});

test('createPlaywrightConfig reads the server mode from LOWDEFY_E2E_SERVER', () => {
  process.env.LOWDEFY_E2E_SERVER = 'e2e';
  const config = createPlaywrightConfig({ packageDir });
  assert.match(config.webServer.command, /server-e2e/);
});

test('createPlaywrightConfig prefers an explicit server over LOWDEFY_E2E_SERVER', () => {
  process.env.LOWDEFY_E2E_SERVER = 'dev';
  const config = createPlaywrightConfig({ packageDir, server: 'prod' });
  assert.doesNotMatch(config.webServer.command, /server-dev/);
});

test('createPlaywrightConfig throws when the server mode is not a known server', () => {
  assert.throws(() => createPlaywrightConfig({ packageDir, server: 'staging' }), {
    message: 'createPlaywrightConfig server must be one of prod, dev, e2e. Received "staging".',
  });
});

test('createPlaywrightConfig keeps the port on the base url and the started server', () => {
  const config = createPlaywrightConfig({ packageDir, port: 3111 });
  assert.equal(config.use.baseURL, 'http://localhost:3111');
  assert.equal(config.webServer.url, 'http://localhost:3111');
  assert.match(config.webServer.command, /--port 3111/);
});
