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

import { jest } from '@jest/globals';

const originalEnv = process.env.LOWDEFY_TEST_CONNECTION_OVERRIDES;

async function loadWithEnv(value) {
  jest.resetModules();
  if (value === undefined) {
    delete process.env.LOWDEFY_TEST_CONNECTION_OVERRIDES;
  } else {
    process.env.LOWDEFY_TEST_CONNECTION_OVERRIDES = value;
  }
  const { default: applyConnectionOverrides } = await import('./applyConnectionOverrides.js');
  return applyConnectionOverrides;
}

function createContext(artifacts) {
  return {
    logger: { info: jest.fn() },
    readConfigFile: jest.fn(async (filePath) => artifacts[filePath] ?? null),
  };
}

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.LOWDEFY_TEST_CONNECTION_OVERRIDES;
  } else {
    process.env.LOWDEFY_TEST_CONNECTION_OVERRIDES = originalEnv;
  }
});

test('applyConnectionOverrides leaves readConfigFile untouched when the variable is unset', async () => {
  const applyConnectionOverrides = await loadWithEnv(undefined);
  const context = createContext({});
  const original = context.readConfigFile;
  applyConnectionOverrides({ context });
  expect(context.readConfigFile).toBe(original);
  expect(context.logger.info).not.toHaveBeenCalled();
});

test("applyConnectionOverrides replaces an overridden connection's properties and wins over an operator node", async () => {
  const applyConnectionOverrides = await loadWithEnv(
    JSON.stringify({ controls: { databaseUri: 'mongodb://127.0.0.1:27999/' } })
  );
  const context = createContext({
    'connections/controls.json': {
      id: 'connection:controls',
      connectionId: 'controls',
      type: 'MongoDBCollection',
      properties: {
        databaseUri: { _secret: 'MONGODB_URI' },
        collection: 'controls',
        databaseName: 'app',
      },
    },
  });
  applyConnectionOverrides({ context });
  const artifact = await context.readConfigFile('connections/controls.json');
  expect(artifact).toEqual({
    id: 'connection:controls',
    connectionId: 'controls',
    type: 'MongoDBCollection',
    properties: {
      databaseUri: 'mongodb://127.0.0.1:27999/',
      collection: 'controls',
      databaseName: 'app',
    },
  });
  expect(context.logger.info).toHaveBeenCalledWith(
    'Connection properties overridden for test run: controls.'
  );
});

test('applyConnectionOverrides leaves other connections and other artifact paths unchanged', async () => {
  const applyConnectionOverrides = await loadWithEnv(JSON.stringify({ controls: { a: 1 } }));
  const other = { connectionId: 'users', properties: { databaseUri: { _secret: 'X' } } };
  const page = { id: 'page:home', pageId: 'home' };
  const context = createContext({ 'connections/users.json': other, 'pages/home.json': page });
  applyConnectionOverrides({ context });
  expect(await context.readConfigFile('connections/users.json')).toBe(other);
  expect(await context.readConfigFile('pages/home.json')).toBe(page);
  expect(await context.readConfigFile('connections/missing.json')).toBe(null);
});

test('applyConnectionOverrides logs the overridden ids once per process', async () => {
  const applyConnectionOverrides = await loadWithEnv(JSON.stringify({ a: {}, b: {} }));
  const first = createContext({});
  const second = createContext({});
  applyConnectionOverrides({ context: first });
  applyConnectionOverrides({ context: second });
  expect(first.logger.info).toHaveBeenCalledWith(
    'Connection properties overridden for test run: a, b.'
  );
  expect(second.logger.info).not.toHaveBeenCalled();
});

test('applyConnectionOverrides throws at load when the variable is not a JSON object', async () => {
  await expect(loadWithEnv('[1]')).rejects.toThrow(
    'LOWDEFY_TEST_CONNECTION_OVERRIDES should be a JSON object keyed by connectionId. Received [1].'
  );
});
