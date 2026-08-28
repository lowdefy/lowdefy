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
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('allowDependencyBuild creates pnpm-workspace.yaml in the app directory when no workspace root exists', async () => {
  const { default: fs } = await import('fs');
  const { default: allowDependencyBuild } = await import('./allowDependencyBuild.js');
  fs.existsSync.mockReturnValue(false);
  allowDependencyBuild({ cwd: '/repo', appPath: 'app', dependency: 'mongodb-memory-server' });
  expect(fs.writeFileSync.mock.calls).toEqual([
    [
      '/repo/app/pnpm-workspace.yaml',
      `packages:
  - .
onlyBuiltDependencies:
  - mongodb-memory-server
allowBuilds:
  mongodb-memory-server: true
`,
    ],
  ]);
});

test('allowDependencyBuild adds the dependency to the workspace root pnpm-workspace.yaml', async () => {
  const { default: fs } = await import('fs');
  const { default: allowDependencyBuild } = await import('./allowDependencyBuild.js');
  fs.existsSync.mockImplementation((filePath) => filePath === '/repo/pnpm-workspace.yaml');
  fs.readFileSync.mockReturnValue(`packages:
  - app
onlyBuiltDependencies:
  - esbuild
`);
  allowDependencyBuild({ cwd: '/repo', appPath: 'app', dependency: 'mongodb-memory-server' });
  expect(fs.writeFileSync.mock.calls).toEqual([
    [
      '/repo/pnpm-workspace.yaml',
      `packages:
  - app
onlyBuiltDependencies:
  - esbuild
  - mongodb-memory-server
allowBuilds:
  mongodb-memory-server: true
`,
    ],
  ]);
});

test('allowDependencyBuild does not write when the dependency is already covered by both keys', async () => {
  const { default: fs } = await import('fs');
  const { default: allowDependencyBuild } = await import('./allowDependencyBuild.js');
  fs.existsSync.mockImplementation((filePath) => filePath === '/repo/pnpm-workspace.yaml');
  fs.readFileSync.mockReturnValue(`packages:
  - app
onlyBuiltDependencies:
  - mongodb-memory-server
allowBuilds:
  mongodb-memory-server: true
`);
  allowDependencyBuild({ cwd: '/repo', appPath: 'app', dependency: 'mongodb-memory-server' });
  expect(fs.writeFileSync).not.toHaveBeenCalled();
});
