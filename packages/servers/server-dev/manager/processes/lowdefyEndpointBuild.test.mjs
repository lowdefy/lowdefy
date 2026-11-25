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

import fs from 'fs';
import os from 'os';
import path from 'path';

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

const mockBuildEndpointsJit = vi.fn();
const mockFindEndpointsReadingFiles = vi.fn();
const mockWriteBuildStatus = vi.fn(async () => {});

vi.doMock('@lowdefy/build/dev', () => ({
  buildEndpointsJit: mockBuildEndpointsJit,
  findEndpointsReadingFiles: mockFindEndpointsReadingFiles,
}));
vi.doMock('../utils/writeBuildStatus.mjs', () => ({
  default: mockWriteBuildStatus,
}));

const { default: lowdefyEndpointBuild } = await import('./lowdefyEndpointBuild.mjs');
const { default: createBuildQueue } = await import('../utils/createBuildQueue.mjs');

let buildDirectory;
let context;

beforeEach(() => {
  vi.clearAllMocks();
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-endpoint-build-'));
  context = {
    buildContext: { keyMap: {} },
    buildQueue: createBuildQueue(),
    directories: { build: buildDirectory },
    endpointRegistry: { endpoints: new Map() },
    lastBuildFailed: false,
    logger: { info: vi.fn(), warn: vi.fn() },
  };
  mockFindEndpointsReadingFiles.mockReturnValue(['one']);
  mockBuildEndpointsJit.mockResolvedValue({
    endpointIds: ['one'],
    skeletonSourceFiles: ['api/one.yaml', 'lowdefy.yaml'],
    warnings: [{ message: 'A warning' }],
  });
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('rebuilds the endpoints the files feed and writes the build status and skeleton files', async () => {
  const build = lowdefyEndpointBuild(context);

  await expect(build({ files: ['api/one.yaml'] })).resolves.toBe(true);

  expect(mockFindEndpointsReadingFiles).toHaveBeenCalledWith({
    endpointRegistry: context.endpointRegistry,
    files: ['api/one.yaml'],
  });
  expect(mockBuildEndpointsJit).toHaveBeenCalledWith({
    endpointIds: ['one'],
    endpointRegistry: context.endpointRegistry,
    context: context.buildContext,
    directories: { build: buildDirectory },
  });
  expect(mockWriteBuildStatus).toHaveBeenCalledWith({
    directories: context.directories,
    status: 'ok',
    errors: [],
    warnings: [{ message: 'A warning' }],
  });
  expect(
    JSON.parse(fs.readFileSync(path.join(buildDirectory, 'skeletonSourceFiles.json'), 'utf8'))
  ).toEqual(['api/one.yaml', 'lowdefy.yaml']);
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.stringMatching(/^Built endpoint "one" in \d+ms\.$/)
  );
});

test.each([
  ['the last config build failed', () => (context.lastBuildFailed = true)],
  ['no config build has run', () => (context.endpointRegistry = null)],
  [
    'a file is read by more than endpoints',
    () => mockFindEndpointsReadingFiles.mockReturnValue(null),
  ],
])('leaves the edit to a config build when %s', async (_name, arrange) => {
  arrange();
  const build = lowdefyEndpointBuild(context);

  await expect(build({ files: ['api/one.yaml'] })).resolves.toBe(false);

  expect(mockBuildEndpointsJit).not.toHaveBeenCalled();
  expect(mockWriteBuildStatus).not.toHaveBeenCalled();
});

test('leaves the edit to a config build, writing nothing, when the endpoint build falls back', async () => {
  mockBuildEndpointsJit.mockResolvedValue({ fallback: 'the type of endpoint "one" changed' });
  const build = lowdefyEndpointBuild(context);

  await expect(build({ files: ['api/one.yaml'] })).resolves.toBe(false);

  expect(mockWriteBuildStatus).not.toHaveBeenCalled();
  expect(fs.existsSync(path.join(buildDirectory, 'skeletonSourceFiles.json'))).toBe(false);
  expect(context.logger.info).toHaveBeenCalledWith(
    'Building config: the type of endpoint "one" changed.'
  );
});

test('waits for the config build before it in the queue, and reads its result', async () => {
  let finishConfigBuild;
  const configBuild = context.buildQueue(
    () =>
      new Promise((resolve) => {
        finishConfigBuild = () => {
          context.lastBuildFailed = true;
          resolve();
        };
      })
  );
  const build = lowdefyEndpointBuild(context);
  const endpointBuild = build({ files: ['api/one.yaml'] });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(mockFindEndpointsReadingFiles).not.toHaveBeenCalled();

  finishConfigBuild();
  await configBuild;

  await expect(endpointBuild).resolves.toBe(false);
});

test('logs a fault in the endpoint build itself before the config build', async () => {
  const error = new TypeError('x is undefined');
  mockBuildEndpointsJit.mockResolvedValue({ fallback: 'it failed: x is undefined', error });
  const build = lowdefyEndpointBuild(context);

  await expect(build({ files: ['api/one.yaml'] })).resolves.toBe(false);

  expect(context.logger.warn).toHaveBeenCalledWith(error);
});
