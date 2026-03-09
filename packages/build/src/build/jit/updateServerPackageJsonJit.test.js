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

const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();

jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
}));

test('updateServerPackageJsonJit adds missing packages to package.json', async () => {
  const { default: updateServerPackageJsonJit } = await import('./updateServerPackageJsonJit.js');

  const existingPackageJson = {
    name: '@lowdefy/server',
    dependencies: {
      '@lowdefy/blocks-basic': '1.0.0',
      next: '14.0.0',
    },
  };
  mockReadFile.mockResolvedValue(JSON.stringify(existingPackageJson, null, 2));
  mockWriteFile.mockResolvedValue();

  const missingPackages = new Map([
    ['@lowdefy/plugin-aws', { version: '1.0.0', types: ['S3UploadDragger'] }],
  ]);

  await updateServerPackageJsonJit({
    directories: { server: '/test/server' },
    missingPackages,
  });

  expect(mockReadFile).toHaveBeenCalledWith('/test/server/package.json');
  expect(mockWriteFile).toHaveBeenCalledWith(
    '/test/server/package.json',
    expect.any(String)
  );

  const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
  expect(written.dependencies['@lowdefy/plugin-aws']).toBe('1.0.0');
  expect(written.dependencies['@lowdefy/blocks-basic']).toBe('1.0.0');
  expect(written.dependencies.next).toBe('14.0.0');
});

test('updateServerPackageJsonJit sorts dependencies alphabetically', async () => {
  const { default: updateServerPackageJsonJit } = await import('./updateServerPackageJsonJit.js');

  const existingPackageJson = {
    name: '@lowdefy/server',
    dependencies: {
      next: '14.0.0',
      '@lowdefy/blocks-basic': '1.0.0',
    },
  };
  mockReadFile.mockResolvedValue(JSON.stringify(existingPackageJson, null, 2));
  mockWriteFile.mockResolvedValue();

  const missingPackages = new Map([
    ['@lowdefy/plugin-aws', { version: '1.0.0', types: ['S3UploadDragger'] }],
    ['@lowdefy/blocks-aggrid', { version: '2.0.0', types: ['AgGrid'] }],
  ]);

  await updateServerPackageJsonJit({
    directories: { server: '/test/server' },
    missingPackages,
  });

  const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
  const depNames = Object.keys(written.dependencies);
  expect(depNames).toEqual([...depNames].sort());
});

test('updateServerPackageJsonJit adds multiple missing packages', async () => {
  const { default: updateServerPackageJsonJit } = await import('./updateServerPackageJsonJit.js');

  const existingPackageJson = {
    name: '@lowdefy/server',
    dependencies: {},
  };
  mockReadFile.mockResolvedValue(JSON.stringify(existingPackageJson, null, 2));
  mockWriteFile.mockResolvedValue();

  const missingPackages = new Map([
    ['@lowdefy/plugin-aws', { version: '1.0.0', types: ['S3UploadDragger'] }],
    ['@lowdefy/plugin-mongodb', { version: '3.0.0', types: ['MongoDBFind'] }],
  ]);

  await updateServerPackageJsonJit({
    directories: { server: '/test/server' },
    missingPackages,
  });

  const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
  expect(written.dependencies['@lowdefy/plugin-aws']).toBe('1.0.0');
  expect(written.dependencies['@lowdefy/plugin-mongodb']).toBe('3.0.0');
});

test('updateServerPackageJsonJit writes file with trailing newline', async () => {
  const { default: updateServerPackageJsonJit } = await import('./updateServerPackageJsonJit.js');

  const existingPackageJson = {
    name: '@lowdefy/server',
    dependencies: {},
  };
  mockReadFile.mockResolvedValue(JSON.stringify(existingPackageJson, null, 2));
  mockWriteFile.mockResolvedValue();

  const missingPackages = new Map([
    ['@lowdefy/plugin-aws', { version: '1.0.0', types: ['S3UploadDragger'] }],
  ]);

  await updateServerPackageJsonJit({
    directories: { server: '/test/server' },
    missingPackages,
  });

  const writtenContent = mockWriteFile.mock.calls[0][1];
  expect(writtenContent.endsWith('\n')).toBe(true);
});
