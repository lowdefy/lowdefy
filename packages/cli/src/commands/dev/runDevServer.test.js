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

import { vi, afterAll, beforeEach, expect, test } from 'vitest';

const mockSpawnServer = vi.fn();
vi.doMock('../../utils/spawnServer.js', () => ({
  default: mockSpawnServer,
}));
vi.doMock('@lowdefy/logger/cli', () => ({
  createStdOutLineHandler: vi.fn(() => 'lineHandler'),
}));

const { default: runDevServer } = await import('./runDevServer.js');

const savedSkip = process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;

function createContext(options) {
  return {
    directories: { config: '/app' },
    logger: { info: vi.fn() },
    options: { refResolver: 'resolver.js', watch: [], watchIgnore: [], ...options },
  };
}

beforeEach(() => {
  delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  mockSpawnServer.mockReset();
  mockSpawnServer.mockResolvedValue();
});

afterAll(() => {
  if (savedSkip === undefined) {
    delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  } else {
    process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS = savedSkip;
  }
});

test('runDevServer sets LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS when skipPluginChecks is set', async () => {
  await runDevServer({ context: createContext({ skipPluginChecks: true }), directory: '/dev' });
  const { directory, entry, env } = mockSpawnServer.mock.calls[0][0];
  expect(directory).toEqual('/dev');
  expect(entry).toEqual('manager/run.mjs');
  expect(env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS).toEqual('true');
  expect(env.LOWDEFY_BUILD_REF_RESOLVER).toEqual('resolver.js');
});

test('runDevServer leaves LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS out when skipPluginChecks is not set', async () => {
  await runDevServer({ context: createContext({}), directory: '/dev' });
  const { env } = mockSpawnServer.mock.calls[0][0];
  expect('LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS' in env).toBe(false);
  expect(env.LOWDEFY_BUILD_REF_RESOLVER).toEqual('resolver.js');
});

test('runDevServer passes a bare --lan as LOWDEFY_SERVER_DEV_LAN "true"', async () => {
  await runDevServer({ context: createContext({ lan: true }), directory: '/dev' });
  expect(mockSpawnServer.mock.calls[0][0].env.LOWDEFY_SERVER_DEV_LAN).toEqual('true');
});

test('runDevServer passes the --lan interface name as LOWDEFY_SERVER_DEV_LAN', async () => {
  await runDevServer({ context: createContext({ lan: 'en0' }), directory: '/dev' });
  expect(mockSpawnServer.mock.calls[0][0].env.LOWDEFY_SERVER_DEV_LAN).toEqual('en0');
});

test('runDevServer leaves LOWDEFY_SERVER_DEV_LAN out without --lan', async () => {
  await runDevServer({ context: createContext({}), directory: '/dev' });
  expect('LOWDEFY_SERVER_DEV_LAN' in mockSpawnServer.mock.calls[0][0].env).toBe(false);
});

test('runDevServer ends the shutdown spinner once the manager exits', async () => {
  const context = createContext({});
  await runDevServer({ context, directory: '/dev' });
  expect(context.logger.info).toHaveBeenCalledWith(
    { spin: 'succeed' },
    'Development server stopped.'
  );
});

test('runDevServer does not report a stop when the manager fails', async () => {
  mockSpawnServer.mockRejectedValue(new Error('Server exited with code 1.'));
  const context = createContext({});
  await expect(runDevServer({ context, directory: '/dev' })).rejects.toThrow(
    'Server exited with code 1.'
  );
  expect(context.logger.info).not.toHaveBeenCalled();
});
