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

import testContext from '../test-utils/testContext.js';

// child_process is mocked once, before the single import: re-importing
// buildAppMeta after jest.resetModules() trips a jest ESM module-cache bug
// ("Module cache already has entry"), so the git-sha cases live in their own
// file and swap execSync's implementation per test instead.
const mockExecSync = jest.fn();
jest.unstable_mockModule('child_process', () => ({
  execSync: mockExecSync,
}));
jest.unstable_mockModule('./buildRefs/getRefContent.js', () => ({
  default: jest.fn().mockResolvedValue({}),
}));

const { default: buildAppMeta } = await import('./buildAppMeta.js');

const originalEnvShaPresent = Object.prototype.hasOwnProperty.call(process.env, 'LOWDEFY_GIT_SHA');
const originalEnvSha = process.env.LOWDEFY_GIT_SHA;

function makeContext() {
  const context = testContext();
  context.errors = [];
  return context;
}

beforeEach(() => {
  mockExecSync.mockReset();
});

afterAll(() => {
  if (originalEnvShaPresent) {
    process.env.LOWDEFY_GIT_SHA = originalEnvSha;
  } else {
    delete process.env.LOWDEFY_GIT_SHA;
  }
});

test('buildAppMeta LOWDEFY_GIT_SHA env var wins over git rev-parse', async () => {
  mockExecSync.mockImplementation(() => Buffer.from('from-git-rev-parse\n'));

  process.env.LOWDEFY_GIT_SHA = 'from-env-var';
  const context = makeContext();
  await buildAppMeta({ context });
  expect(context.appMeta.gitSha).toBe('from-env-var');

  delete process.env.LOWDEFY_GIT_SHA;
  const context2 = makeContext();
  await buildAppMeta({ context: context2 });
  expect(context2.appMeta.gitSha).toBe('from-git-rev-parse');
});

test('buildAppMeta returns null gitSha when env unset and git rev-parse fails', async () => {
  mockExecSync.mockImplementation(() => {
    throw new Error('not a git repo');
  });

  delete process.env.LOWDEFY_GIT_SHA;
  const context = makeContext();
  await buildAppMeta({ context });
  expect(context.appMeta.gitSha).toBeNull();
});
