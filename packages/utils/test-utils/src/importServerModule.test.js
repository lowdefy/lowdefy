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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, expect, test } from 'vitest';

import importServerModule from './importServerModule.js';

const created = [];

// A server directory whose install holds its own copy of a package this package also depends on.
function makeServerDirectory() {
  const server = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-utils-server-'));
  created.push(server);
  const packageDirectory = path.join(server, 'node_modules', '@lowdefy', 'helpers');
  fs.mkdirSync(packageDirectory, { recursive: true });
  fs.writeFileSync(path.join(server, 'package.json'), JSON.stringify({ name: '@lowdefy/server' }));
  fs.writeFileSync(
    path.join(packageDirectory, 'package.json'),
    JSON.stringify({ name: '@lowdefy/helpers', type: 'module', exports: './index.js' })
  );
  fs.writeFileSync(
    path.join(packageDirectory, 'index.js'),
    "export const loadedFrom = 'the server install';\n"
  );
  return server;
}

afterEach(() => {
  created.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true }));
});

test("importServerModule loads the package in the server's node_modules, not this package's own", async () => {
  const server = makeServerDirectory();
  const helpers = await importServerModule({ directories: { server }, name: '@lowdefy/helpers' });
  expect(helpers.loadedFrom).toEqual('the server install');
  expect(helpers.type).toBeUndefined();
});

test('importServerModule refuses a package the server install does not have, though this package can resolve it', async () => {
  const server = makeServerDirectory();
  await expect(
    importServerModule({ directories: { server }, name: '@lowdefy/node-utils' })
  ).rejects.toThrow(
    `Could not find "@lowdefy/node-utils" in the Lowdefy server at "${server}". Run "lowdefy build --no-client-build" in the app's directory, which installs the server's packages, then run the tests again.`
  );
});
