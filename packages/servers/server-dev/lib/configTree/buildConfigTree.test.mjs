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

import path from 'node:path';
import { jest } from '@jest/globals';

const mockRunConfigTreeBuild = jest.fn();
let mockArgs = [];

// parseArgs reads the real process.argv, which the test cannot set: jest gives
// it a copy. The real parseArgs runs on the test's arguments instead.
const actualUtil = await import('node:util');
jest.unstable_mockModule('node:util', () => ({
  ...actualUtil,
  default: actualUtil.default,
  parseArgs: (config) => actualUtil.parseArgs({ ...config, args: mockArgs }),
}));

jest.unstable_mockModule('./runConfigTreeBuild.mjs', () => ({
  default: mockRunConfigTreeBuild,
}));

const savedSkip = process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
const savedExitCode = process.exitCode;
let loadCount = 0;

// buildConfigTree.mjs runs its build when imported, so each import is a fresh
// module instance.
async function runScript() {
  loadCount += 1;
  await import(`./buildConfigTree.mjs?case=${loadCount}`);
}

beforeEach(() => {
  mockArgs = ['--config', '/app', '--out', '/out'];
  delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  mockRunConfigTreeBuild.mockReset();
  mockRunConfigTreeBuild.mockResolvedValue({ status: 'ok', errors: [], warnings: [] });
});

afterAll(() => {
  process.exitCode = savedExitCode;
  if (savedSkip === undefined) {
    delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  } else {
    process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS = savedSkip;
  }
});

test('buildConfigTree passes skipPluginChecks true when LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS is true', async () => {
  process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS = 'true';
  await runScript();
  expect(mockRunConfigTreeBuild).toHaveBeenCalledTimes(1);
  const [args] = mockRunConfigTreeBuild.mock.calls[0];
  expect(args.configDirectory).toEqual(path.resolve('/app'));
  expect(args.outDirectory).toEqual(path.resolve('/out'));
  expect(args.skipPluginChecks).toBe(true);
});

test('buildConfigTree passes skipPluginChecks false when LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS is unset', async () => {
  await runScript();
  expect(mockRunConfigTreeBuild).toHaveBeenCalledTimes(1);
  expect(mockRunConfigTreeBuild.mock.calls[0][0].skipPluginChecks).toBe(false);
});
