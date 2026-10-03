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

jest.unstable_mockModule('child_process', () => ({
  execSync: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('getPnpmMajorVersion reads the major version of a pinned pnpm', async () => {
  const { execSync } = await import('child_process');
  const { default: getPnpmMajorVersion } = await import('./getPnpmMajorVersion.js');
  expect(
    getPnpmMajorVersion({ directory: '/dir', packageManager: 'pnpm@11.15.0', pnpmCmd: 'pnpm' })
  ).toBe(11);
  expect(
    getPnpmMajorVersion({
      directory: '/dir',
      packageManager: 'pnpm@10.29.2+sha512.abc123',
      pnpmCmd: 'pnpm',
    })
  ).toBe(10);
  expect(execSync).not.toHaveBeenCalled();
});

test('getPnpmMajorVersion asks the pnpm the CLI runs when no pnpm is pinned', async () => {
  const { execSync } = await import('child_process');
  const { default: getPnpmMajorVersion } = await import('./getPnpmMajorVersion.js');
  execSync.mockReturnValue('11.15.0\n');
  expect(
    getPnpmMajorVersion({ directory: '/dir', packageManager: 'yarn@4.0.0', pnpmCmd: 'pnpm' })
  ).toBe(11);
  expect(getPnpmMajorVersion({ directory: '/dir', pnpmCmd: 'pnpm' })).toBe(11);
  expect(execSync.mock.calls).toEqual([
    ['pnpm --version', { cwd: '/dir', encoding: 'utf8' }],
    ['pnpm --version', { cwd: '/dir', encoding: 'utf8' }],
  ]);
});
