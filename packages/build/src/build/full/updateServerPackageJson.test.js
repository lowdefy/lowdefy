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

function makeComponents({ actions, blocks }) {
  return {
    types: {
      actions: actions ?? {},
      agents: {},
      auth: { adapters: {}, providers: {}, strategies: {} },
      blocks: blocks ?? {},
      connections: {},
      notifications: {},
      operators: { client: {}, server: {} },
      requests: {},
      websockets: {},
    },
  };
}

const context = {
  directories: { server: '/test/server' },
  typesMap: { notifications: {} },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockReadFile.mockResolvedValue(
    JSON.stringify({ name: '@lowdefy/server', dependencies: { '@lowdefy/server': '1.0.0' } })
  );
  mockWriteFile.mockResolvedValue();
});

test('updateServerPackageJson writes a dependency for each plugin package', async () => {
  const { default: updateServerPackageJson } = await import('./updateServerPackageJson.js');

  await updateServerPackageJson({
    components: makeComponents({
      blocks: { Button: { package: '@lowdefy/blocks-basic', version: '2.0.0' } },
    }),
    context,
  });

  const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
  expect(written.dependencies['@lowdefy/blocks-basic']).toBe('2.0.0');
});

test('updateServerPackageJson writes no dependency for a file plugin type', async () => {
  const { default: updateServerPackageJson } = await import('./updateServerPackageJson.js');

  await updateServerPackageJson({
    components: makeComponents({
      actions: { MyFileAction: { package: null, version: null, packageId: 'file-plugin' } },
      blocks: { MyFileBlock: { package: null, version: null, packageId: 'file-plugin' } },
    }),
    context,
  });

  const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
  expect(written.dependencies).toEqual({ '@lowdefy/server': '1.0.0' });
});
