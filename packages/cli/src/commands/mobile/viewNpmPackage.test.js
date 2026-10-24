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

import { vi, beforeEach, expect, test } from 'vitest';

const actualNodeUtils = await import('@lowdefy/node-utils');
const mockSpawnProcess = vi.fn();
vi.doMock('@lowdefy/node-utils', () => ({
  ...actualNodeUtils,
  default: actualNodeUtils.default,
  spawnProcess: mockSpawnProcess,
}));

const { default: viewNpmPackage } = await import('./viewNpmPackage.js');

const context = { configDirectory: '/apps/field', pnpmCmd: 'pnpm' };

beforeEach(() => {
  mockSpawnProcess.mockReset();
});

function printing({ stdout = [], stderr = [], fail = false }) {
  return async ({ stdOutLineHandler, stdErrLineHandler }) => {
    stdout.forEach(stdOutLineHandler);
    stderr.forEach(stdErrLineHandler);
    if (fail) {
      throw new Error('pnpm exited with code 1');
    }
  };
}

test('runs pnpm view in the app config directory, so its .npmrc applies', async () => {
  mockSpawnProcess.mockImplementation(
    printing({
      stdout: ['{', '  "name": "@example/lowdefy-printer",', '  "version": "2.1.0"', '}'],
    })
  );
  await expect(
    viewNpmPackage({ context, name: '@example/lowdefy-printer', version: '2.1.0' })
  ).resolves.toEqual({ name: '@example/lowdefy-printer', version: '2.1.0' });
  const [{ command, args, processOptions }] = mockSpawnProcess.mock.calls[0];
  expect(command).toBe('pnpm');
  expect(args).toEqual(['view', '@example/lowdefy-printer@2.1.0', '--json']);
  expect(processOptions.cwd).toBe('/apps/field');
});

test('returns null for a version the package does not have', async () => {
  mockSpawnProcess.mockImplementation(printing({}));
  await expect(
    viewNpmPackage({ context, name: '@example/lowdefy-printer', version: '9.9.9' })
  ).resolves.toBeNull();
});

test('fails naming the package and what the registry said', async () => {
  mockSpawnProcess.mockImplementation(
    printing({ stderr: ['ERR_PNPM_FETCH_404  404 Not Found'], fail: true })
  );
  await expect(
    viewNpmPackage({ context, name: '@example/missing', version: '1.0.0' })
  ).rejects.toThrow(
    'Could not read "@example/missing@1.0.0" from the registry. ERR_PNPM_FETCH_404  404 Not Found'
  );
});
