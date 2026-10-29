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

import { vi, expect, test } from 'vitest';

const mockInstallIfPackageJsonChanged = vi.fn();

vi.doMock('@lowdefy/node-utils', () => ({
  installIfPackageJsonChanged: mockInstallIfPackageJsonChanged,
  spawnProcess: vi.fn(),
}));

const { default: installServer } = await import('./installServer.js');

function createContext() {
  return { logger: { info: vi.fn() }, pnpmCmd: 'pnpm' };
}

test('installServer passes skipIfInstalled on and logs when nothing installs', async () => {
  mockInstallIfPackageJsonChanged.mockResolvedValue(false);
  const context = createContext();
  await installServer({ context, directory: '/server', skipIfInstalled: true });
  expect(mockInstallIfPackageJsonChanged).toHaveBeenCalledWith(
    expect.objectContaining({ directory: '/server', skipIfInstalled: true })
  );
  expect(context.logger.info).toHaveBeenCalledWith('Dependencies unchanged.');
});

test('installServer keeps exact matching when skipIfInstalled is not passed', async () => {
  mockInstallIfPackageJsonChanged.mockResolvedValue(true);
  const context = createContext();
  await installServer({ context, directory: '/server' });
  expect(mockInstallIfPackageJsonChanged).toHaveBeenCalledWith(
    expect.objectContaining({ directory: '/server', skipIfInstalled: false })
  );
  expect(context.logger.info).not.toHaveBeenCalledWith('Dependencies unchanged.');
});
