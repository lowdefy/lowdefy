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

const mockSpawnProcess = vi.fn();
vi.doMock('@lowdefy/node-utils', () => ({
  spawnProcess: mockSpawnProcess,
}));
vi.doMock('@lowdefy/logger/cli', () => ({
  createStdOutLineHandler: vi.fn(() => 'lineHandler'),
}));

const { default: runLowdefyBuild } = await import('./runLowdefyBuild.js');

const savedSkip = process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;

function createContext(options) {
  return {
    directories: { config: '/app' },
    logger: { info: vi.fn() },
    options: { refResolver: 'resolver.js', ...options },
    pnpmCmd: 'pnpm',
  };
}

beforeEach(() => {
  delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  mockSpawnProcess.mockReset();
  mockSpawnProcess.mockResolvedValue();
});

afterAll(() => {
  if (savedSkip === undefined) {
    delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  } else {
    process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS = savedSkip;
  }
});

test('runLowdefyBuild sets LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS when skipPluginChecks is set', async () => {
  await runLowdefyBuild({ context: createContext({ skipPluginChecks: true }), directory: '/srv' });
  const { args, processOptions } = mockSpawnProcess.mock.calls[0][0];
  expect(args).toEqual(['run', 'build:lowdefy']);
  expect(processOptions.cwd).toEqual('/srv');
  expect(processOptions.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS).toEqual('true');
  expect(processOptions.env.LOWDEFY_BUILD_REF_RESOLVER).toEqual('resolver.js');
  expect(processOptions.env.LOWDEFY_DIRECTORY_CONFIG).toEqual('/app');
});

test('runLowdefyBuild leaves LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS out when skipPluginChecks is not set', async () => {
  await runLowdefyBuild({ context: createContext({}), directory: '/srv' });
  const { processOptions } = mockSpawnProcess.mock.calls[0][0];
  expect('LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS' in processOptions.env).toBe(false);
  expect(processOptions.env.LOWDEFY_BUILD_REF_RESOLVER).toEqual('resolver.js');
});
