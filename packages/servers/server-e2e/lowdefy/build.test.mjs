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

const mockBuild = jest.fn();

jest.unstable_mockModule('@lowdefy/build', () => ({ default: mockBuild }));
jest.unstable_mockModule('@lowdefy/logger/node', () => ({
  createNodeLogger: jest.fn(() => 'logger'),
}));
jest.unstable_mockModule('./createCustomPluginTypesMap.mjs', () => ({
  default: jest.fn().mockResolvedValue({}),
}));

const savedSkip = process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
let loadCount = 0;

// build.mjs runs the build when imported, so each case loads a fresh module
// instance and waits for the build call.
async function runScript() {
  loadCount += 1;
  await import(`./build.mjs?case=${loadCount}`);
  await new Promise((resolve) => setImmediate(resolve));
}

beforeEach(() => {
  delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  mockBuild.mockReset();
  mockBuild.mockResolvedValue();
});

afterAll(() => {
  if (savedSkip === undefined) {
    delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  } else {
    process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS = savedSkip;
  }
});

test('build passes skipPluginChecks true when LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS is true', async () => {
  process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS = 'true';
  await runScript();
  expect(mockBuild).toHaveBeenCalledTimes(1);
  expect(mockBuild.mock.calls[0][0].skipPluginChecks).toBe(true);
});

test('build passes skipPluginChecks false when LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS is unset', async () => {
  await runScript();
  expect(mockBuild).toHaveBeenCalledTimes(1);
  expect(mockBuild.mock.calls[0][0].skipPluginChecks).toBe(false);
});
