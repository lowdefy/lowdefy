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

const mockShallowBuild = jest.fn();

jest.unstable_mockModule('@lowdefy/build/dev', () => ({
  shallowBuild: mockShallowBuild,
  serializeBuildException: jest.fn((exception) => ({ message: exception.message })),
}));
jest.unstable_mockModule('../utils/writeBuildStatus.mjs', () => ({
  default: jest.fn(),
}));
jest.unstable_mockModule('../utils/createCustomPluginTypesMap.mjs', () => ({
  default: jest.fn().mockResolvedValue({}),
}));
jest.unstable_mockModule('../utils/createCustomPluginMessagesMap.mjs', () => ({
  default: jest.fn().mockResolvedValue({}),
}));
jest.unstable_mockModule('../utils/publishBuildDirectory.mjs', () => ({
  default: jest.fn(async () => {}),
}));

const { default: lowdefyBuild } = await import('./lowdefyBuild.mjs');

function createContext(options) {
  return {
    directories: { build: '/app/build', buildStaging: '/app/build-staging' },
    logger: { info: jest.fn() },
    options,
  };
}

beforeEach(() => {
  mockShallowBuild.mockResolvedValue({ components: {}, pageRegistry: {}, context: {} });
});

test('lowdefyBuild passes skipPluginChecks true to shallowBuild', async () => {
  await lowdefyBuild(createContext({ skipPluginChecks: true }))();
  expect(mockShallowBuild.mock.calls[0][0].skipPluginChecks).toBe(true);
});

test('lowdefyBuild passes skipPluginChecks undefined to shallowBuild when the option is not set', async () => {
  await lowdefyBuild(createContext({}))();
  const [args] = mockShallowBuild.mock.calls[0];
  expect(args.skipPluginChecks).toBeUndefined();
  expect(args.stage).toEqual('dev');
});

test('lowdefyBuild passes pluginInstallFollows to shallowBuild', async () => {
  await lowdefyBuild(createContext({}))({ pluginInstallFollows: true });
  expect(mockShallowBuild.mock.calls.at(-1)[0].pluginInstallFollows).toBe(true);
});

test('lowdefyBuild passes pluginInstallFollows false when the build is not given it', async () => {
  await lowdefyBuild(createContext({}))();
  expect(mockShallowBuild.mock.calls.at(-1)[0].pluginInstallFollows).toBe(false);
});
