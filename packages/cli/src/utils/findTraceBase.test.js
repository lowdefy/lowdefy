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

import path from 'path';
import { jest } from '@jest/globals';

jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn(),
  },
}));

jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  findPnpmWorkspaceRoot: jest.fn(),
}));

beforeEach(async () => {
  const { default: fs } = await import('fs');
  const { findPnpmWorkspaceRoot } = await import('@lowdefy/node-utils');
  // Walks up like the real function, over the mocked fs.
  findPnpmWorkspaceRoot.mockImplementation((startDir) => {
    let dir = startDir;
    while (dir !== path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
        return dir;
      }
      dir = path.dirname(dir);
    }
    return null;
  });
});

test('findTraceBase returns the parent workspace root when the server is its own nested workspace', async () => {
  const { default: fs } = await import('fs');
  const { default: findTraceBase } = await import('./findTraceBase.js');
  fs.existsSync.mockImplementation((filePath) =>
    ['/repo/pnpm-workspace.yaml', '/repo/apps/app/.lowdefy/server/pnpm-workspace.yaml'].includes(
      filePath
    )
  );
  expect(findTraceBase({ serverDirectory: '/repo/apps/app/.lowdefy/server' })).toEqual('/repo');
});

test('findTraceBase returns the server directory for a standalone server workspace', async () => {
  const { default: fs } = await import('fs');
  const { default: findTraceBase } = await import('./findTraceBase.js');
  fs.existsSync.mockImplementation(
    (filePath) => filePath === '/repo/app/.lowdefy/server/pnpm-workspace.yaml'
  );
  expect(findTraceBase({ serverDirectory: '/repo/app/.lowdefy/server' })).toEqual(
    '/repo/app/.lowdefy/server'
  );
});

test('findTraceBase falls back to the repository root without any pnpm workspace', async () => {
  const { default: fs } = await import('fs');
  const { default: findTraceBase } = await import('./findTraceBase.js');
  fs.existsSync.mockImplementation((filePath) => filePath === '/repo/.git');
  expect(findTraceBase({ serverDirectory: '/repo/app/.lowdefy/server' })).toEqual('/repo');
});
