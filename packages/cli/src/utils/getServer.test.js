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

jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn(),
  },
}));

jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  cleanDirectory: jest.fn(),
  readFile: jest.fn(),
}));

jest.unstable_mockModule('./fetchNpmTarball.js', () => ({
  default: jest.fn(),
}));

const createContext = () => ({
  lowdefyVersion: '1.2.3',
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('skip fetch when running local version', async () => {
  const { default: fs } = await import('fs');
  const { cleanDirectory } = await import('@lowdefy/node-utils');
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  const { default: getServer } = await import('./getServer.js');
  const context = { ...createContext(), lowdefyVersion: 'local' };
  await getServer({ context, packageName: '@lowdefy/server', directory: '/dir' });
  expect(fs.existsSync).not.toHaveBeenCalled();
  expect(cleanDirectory).not.toHaveBeenCalled();
  expect(fetchNpmTarball).not.toHaveBeenCalled();
  expect(context.logger.warn.mock.calls).toEqual([['Running local @lowdefy/server.']]);
});

test('fetch when server directory does not exist', async () => {
  const { default: fs } = await import('fs');
  const { cleanDirectory } = await import('@lowdefy/node-utils');
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  const { default: getServer } = await import('./getServer.js');
  fs.existsSync.mockReturnValue(false);
  const context = createContext();
  await getServer({ context, packageName: '@lowdefy/server', directory: '/dir' });
  expect(cleanDirectory).not.toHaveBeenCalled();
  expect(fetchNpmTarball).toHaveBeenCalledWith({
    packageName: '@lowdefy/server',
    version: '1.2.3',
    directory: '/dir',
  });
});

test('skip fetch when server matches package name and version', async () => {
  const { default: fs } = await import('fs');
  const { cleanDirectory, readFile } = await import('@lowdefy/node-utils');
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  const { default: getServer } = await import('./getServer.js');
  fs.existsSync.mockReturnValue(true);
  readFile.mockResolvedValue(JSON.stringify({ name: '@lowdefy/server', version: '1.2.3' }));
  const context = createContext();
  await getServer({ context, packageName: '@lowdefy/server', directory: '/dir' });
  expect(cleanDirectory).not.toHaveBeenCalled();
  expect(fetchNpmTarball).not.toHaveBeenCalled();
});

test('re-fetch when server version differs', async () => {
  const { default: fs } = await import('fs');
  const { cleanDirectory, readFile } = await import('@lowdefy/node-utils');
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  const { default: getServer } = await import('./getServer.js');
  fs.existsSync.mockReturnValue(true);
  readFile.mockResolvedValue(JSON.stringify({ name: '@lowdefy/server', version: '1.0.0' }));
  const context = createContext();
  await getServer({ context, packageName: '@lowdefy/server', directory: '/dir' });
  expect(cleanDirectory).toHaveBeenCalledWith('/dir');
  expect(fetchNpmTarball).toHaveBeenCalledWith({
    packageName: '@lowdefy/server',
    version: '1.2.3',
    directory: '/dir',
  });
});

test('re-fetch when server package name differs from requested', async () => {
  const { default: fs } = await import('fs');
  const { cleanDirectory, readFile } = await import('@lowdefy/node-utils');
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  const { default: getServer } = await import('./getServer.js');
  fs.existsSync.mockReturnValue(true);
  readFile.mockResolvedValue(JSON.stringify({ name: '@lowdefy/server', version: '1.2.3' }));
  const context = createContext();
  await getServer({ context, packageName: '@lowdefy/server-e2e', directory: '/dir' });
  expect(cleanDirectory).toHaveBeenCalledWith('/dir');
  expect(fetchNpmTarball).toHaveBeenCalledWith({
    packageName: '@lowdefy/server-e2e',
    version: '1.2.3',
    directory: '/dir',
  });
});
