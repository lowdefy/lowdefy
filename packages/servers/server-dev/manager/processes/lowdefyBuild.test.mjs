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
const mockPublishBuildDirectory = jest.fn();

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
jest.unstable_mockModule('../utils/publishBuildDirectory.mjs', () => ({
  default: mockPublishBuildDirectory,
}));

const { default: lowdefyBuild } = await import('./lowdefyBuild.mjs');

function createContext() {
  return {
    directories: { build: '/app/build', buildStaging: '/app/build-staging' },
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

test('lowdefyBuild builds into the staging directory and then publishes it', async () => {
  const context = createContext();
  mockShallowBuild.mockResolvedValue({ components: {}, pageRegistry: {}, context: {} });

  const build = lowdefyBuild(context);
  await build();

  expect(mockShallowBuild.mock.calls[0][0].directories).toEqual({
    build: '/app/build-staging',
    buildStaging: '/app/build-staging',
  });
  expect(mockPublishBuildDirectory).toHaveBeenCalledWith({
    buildDirectory: '/app/build',
    stagingDirectory: '/app/build-staging',
  });
  expect(mockPublishBuildDirectory.mock.invocationCallOrder[0]).toBeLessThan(
    mockWriteBuildStatus.mock.invocationCallOrder[0]
  );
});

test('lowdefyBuild leaves the live build in place when the build fails', async () => {
  const context = createContext();
  mockShallowBuild.mockRejectedValue(new Error('Build failed'));

  const build = lowdefyBuild(context);
  await expect(build()).rejects.toThrow('Build failed');

  expect(mockPublishBuildDirectory).not.toHaveBeenCalled();
});

test('lowdefyBuild starts a build only after the previous one has finished', async () => {
  const context = createContext();
  const events = [];
  let finishFirst;
  mockShallowBuild
    .mockImplementationOnce(() => {
      events.push('first start');
      return new Promise((resolve) => {
        finishFirst = () => {
          events.push('first end');
          resolve({ components: {}, pageRegistry: {}, context: {} });
        };
      });
    })
    .mockImplementationOnce(async () => {
      events.push('second start');
      return { components: {}, pageRegistry: {}, context: {} };
    });

  const build = lowdefyBuild(context);
  const first = build();
  const second = build();
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(events).toEqual(['first start']);
  finishFirst();
  await Promise.all([first, second]);

  expect(events).toEqual(['first start', 'first end', 'second start']);
});

test('lowdefyBuild runs the next build after a failed one', async () => {
  const context = createContext();
  mockShallowBuild
    .mockRejectedValueOnce(new Error('Build failed'))
    .mockResolvedValueOnce({ components: {}, pageRegistry: {}, context: {} });

  const build = lowdefyBuild(context);
  const first = build();
  const second = build();

  await expect(first).rejects.toThrow('Build failed');
  await expect(second).resolves.toEqual({ components: {}, pageRegistry: {}, context: {} });
});
