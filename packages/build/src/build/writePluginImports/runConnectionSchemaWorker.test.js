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

import { jest } from '@jest/globals';

// The worker is a real thread, outside jest's module registry: this mock only
// reaches imports made in the test's own thread, so it shows the connection
// packages are never imported here.
const mockImportPluginModule = jest.fn();
jest.unstable_mockModule('./importPluginModule.js', () => ({ default: mockImportPluginModule }));

const { default: runConnectionSchemaWorker } = await import('./runConnectionSchemaWorker.js');

const serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-connection-schemas-'));

function writePackage({ name, connectionsSource }) {
  const directory = path.join(serverDirectory, 'node_modules', name);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({
      name,
      version: '1.0.0',
      type: 'module',
      exports: { './connections': './connections.js' },
    })
  );
  fs.writeFileSync(path.join(directory, 'connections.js'), connectionsSource);
}

writePackage({
  name: 'local-functions-plugin',
  connectionsSource: `
    function Fetch() {}
    Fetch.schema = { type: 'object', properties: { url: { type: 'string' } } };
    Fetch.meta = { checkRead: true, checkWrite: false, transform: (value) => value };
    export const LocalApi = {
      schema: { type: 'object' },
      requests: { Fetch },
      createClient: () => ({}),
    };
  `,
});
writePackage({
  name: 'broken-plugin',
  connectionsSource: "throw new Error('Driver failed to load.');\n",
});

afterAll(() => {
  fs.rmSync(serverDirectory, { recursive: true, force: true });
});

test('runConnectionSchemaWorker returns the schemas of a package from its own dependencies', async () => {
  const collected = await runConnectionSchemaWorker({
    packageNames: ['@lowdefy/connection-axios-http'],
    serverDirectory,
  });

  const { connections, requests } = collected['@lowdefy/connection-axios-http'];
  expect(connections.AxiosHttp.schema).toBeDefined();
  expect(connections.AxiosHttp.requests).toEqual(['AxiosHttp']);
  expect(requests.AxiosHttp.schema).toBeDefined();
  expect(requests.AxiosHttp.meta).toBeDefined();
  expect(mockImportPluginModule).not.toHaveBeenCalled();
});

test('runConnectionSchemaWorker sends back plain JSON from a module full of functions', async () => {
  const collected = await runConnectionSchemaWorker({
    packageNames: ['local-functions-plugin'],
    serverDirectory,
  });

  expect(collected['local-functions-plugin']).toEqual({
    connections: { LocalApi: { schema: { type: 'object' }, requests: ['Fetch'] } },
    requests: {
      Fetch: {
        schema: { type: 'object', properties: { url: { type: 'string' } } },
        meta: { checkRead: true, checkWrite: false },
      },
    },
  });
});

test('runConnectionSchemaWorker returns null for a package that does not resolve', async () => {
  const collected = await runConnectionSchemaWorker({
    packageNames: ['non-existent-package', 'local-functions-plugin'],
    serverDirectory,
  });

  expect(collected['non-existent-package']).toBeNull();
  expect(collected['local-functions-plugin']).not.toBeNull();
});

test('runConnectionSchemaWorker rejects when a package fails while loading', async () => {
  await expect(
    runConnectionSchemaWorker({ packageNames: ['broken-plugin'], serverDirectory })
  ).rejects.toThrow('Driver failed to load.');
});
