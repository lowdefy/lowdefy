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
const mockSerializeBuildException = jest.fn((exception) => ({ message: exception.message }));
const mockWriteBuildStatus = jest.fn();
const mockCreateCustomPluginTypesMap = jest.fn().mockResolvedValue({});
const mockCreateCustomPluginMessagesMap = jest.fn().mockResolvedValue({});

jest.unstable_mockModule('@lowdefy/build/dev', () => ({
  shallowBuild: mockShallowBuild,
  serializeBuildException: mockSerializeBuildException,
}));
jest.unstable_mockModule('../utils/writeBuildStatus.mjs', () => ({
  default: mockWriteBuildStatus,
}));
jest.unstable_mockModule('../utils/createCustomPluginTypesMap.mjs', () => ({
  default: mockCreateCustomPluginTypesMap,
}));
jest.unstable_mockModule('../utils/createCustomPluginMessagesMap.mjs', () => ({
  default: mockCreateCustomPluginMessagesMap,
}));

const { default: lowdefyBuild } = await import('./lowdefyBuild.mjs');

function createContext() {
  return {
    directories: { build: '/app/build' },
    logger: { info: jest.fn() },
    options: { refResolver: undefined },
  };
}

test('lowdefyBuild writes an ok buildStatus.json after a successful build', async () => {
  const context = createContext();
  const warning = { message: 'Deprecated feature used' };
  mockShallowBuild.mockResolvedValue({
    components: {},
    pageRegistry: {},
    context: { warnings: [warning] },
  });

  const build = lowdefyBuild(context);
  await build();

  expect(mockWriteBuildStatus).toHaveBeenCalledWith({
    directories: context.directories,
    status: 'ok',
    errors: [],
    warnings: [{ message: 'Deprecated feature used' }],
  });
  expect(mockSerializeBuildException).toHaveBeenCalledWith(warning, 0, [warning]);
});

test('lowdefyBuild writes an error buildStatus.json and rethrows when the build fails', async () => {
  const context = createContext();
  const buildError = new Error('Build failed with 1 error(s). See above for details.');
  buildError.errors = [{ message: 'Bad config' }];
  buildError.warnings = [{ message: 'Deprecated feature used' }];
  mockShallowBuild.mockRejectedValue(buildError);

  const build = lowdefyBuild(context);
  await expect(build()).rejects.toBe(buildError);

  expect(mockWriteBuildStatus).toHaveBeenCalledWith({
    directories: context.directories,
    status: 'error',
    errors: [{ message: 'Bad config' }],
    warnings: [{ message: 'Deprecated feature used' }],
  });
});

test('lowdefyBuild falls back to the raw error message when the thrown error has no errors array', async () => {
  const context = createContext();
  const buildError = new Error('Build failed due to internal error. See above for details.');
  mockShallowBuild.mockRejectedValue(buildError);

  const build = lowdefyBuild(context);
  await expect(build()).rejects.toBe(buildError);

  expect(mockWriteBuildStatus).toHaveBeenCalledWith({
    directories: context.directories,
    status: 'error',
    errors: [{ message: 'Build failed due to internal error. See above for details.' }],
    warnings: [],
  });
});
