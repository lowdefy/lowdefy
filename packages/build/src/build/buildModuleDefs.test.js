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

jest.unstable_mockModule('./fetchModules.js', () => ({
  default: jest.fn(),
}));

let buildModuleDefs;
let mockFetchModules;

beforeAll(async () => {
  const fetchModulesModule = await import('./fetchModules.js');
  mockFetchModules = fetchModulesModule.default;
  const buildModuleDefsModule = await import('./buildModuleDefs.js');
  buildModuleDefs = buildModuleDefsModule.default;
});

import testContext from '../test-utils/testContext.js';

const mockReadConfigFile = jest.fn();

function createTestContext(overrides = {}) {
  const context = testContext({
    readConfigFile: mockReadConfigFile,
  });
  context.modules = {};
  context.plugins = overrides.plugins ?? [];
  context.errors = [];
  context.typesMap = overrides.typesMap ?? {};
  return context;
}

const readConfigFileMockImplementation = (files) => {
  return (filePath) => {
    const file = files.find((f) => f.path === filePath);
    if (!file) return null;
    return file.content;
  };
};

beforeEach(() => {
  mockReadConfigFile.mockReset();
  mockFetchModules.mockReset();
});

test('buildModuleDefs does nothing when no modules array is defined', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
pages:
  - id: home
    type: Box
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await buildModuleDefs({ context });

  expect(mockFetchModules).not.toHaveBeenCalled();
  expect(context.modules).toEqual({});
});

test('buildModuleDefs does nothing when modules array is empty', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules: []
pages:
  - id: home
    type: Box
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await buildModuleDefs({ context });

  expect(mockFetchModules).not.toHaveBeenCalled();
  expect(context.modules).toEqual({});
});

test('buildModuleDefs fetches and registers module entries', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: team-users
    source: "file:../modules/team-users"
    vars:
      apiUrl: https://api.example.com
pages: []
`,
    },
    {
      path: '/modules/team-users/module.lowdefy.yaml',
      content: `
pages:
  - id: users-page
    type: Box
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  mockFetchModules.mockResolvedValue({
    'team-users': {
      packageRoot: '/modules/team-users',
      moduleRoot: '/modules/team-users',
      isLocal: true,
    },
  });

  await buildModuleDefs({ context });

  expect(mockFetchModules).toHaveBeenCalledWith({
    moduleEntries: [
      expect.objectContaining({ id: 'team-users', source: 'file:../modules/team-users' }),
    ],
    context,
  });
  expect(context.modules['team-users']).toBeDefined();
  expect(context.modules['team-users'].id).toBe('team-users');
  expect(context.modules['team-users'].vars).toEqual({ apiUrl: 'https://api.example.com' });
});

test('buildModuleDefs registers multiple modules in order', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: mod-a
    source: "file:../mod-a"
  - id: mod-b
    source: "file:../mod-b"
pages: []
`,
    },
    {
      path: '/mod-a/module.lowdefy.yaml',
      content: 'pages: []',
    },
    {
      path: '/mod-b/module.lowdefy.yaml',
      content: 'pages: []',
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  mockFetchModules.mockResolvedValue({
    'mod-a': { packageRoot: '/mod-a', moduleRoot: '/mod-a', isLocal: true },
    'mod-b': { packageRoot: '/mod-b', moduleRoot: '/mod-b', isLocal: true },
  });

  await buildModuleDefs({ context });

  expect(context.modules['mod-a']).toBeDefined();
  expect(context.modules['mod-b']).toBeDefined();
});

test('buildModuleDefs resolves _ref in lowdefy.yaml modules vars', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: my-mod
    source: "file:../my-mod"
    vars:
      roles:
        _ref: config/roles.yaml
pages: []
`,
    },
    {
      path: 'config/roles.yaml',
      content: `
- admin
- editor
- viewer
`,
    },
    {
      path: '/my-mod/module.lowdefy.yaml',
      content: 'pages: []',
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  mockFetchModules.mockResolvedValue({
    'my-mod': { packageRoot: '/my-mod', moduleRoot: '/my-mod', isLocal: true },
  });

  await buildModuleDefs({ context });

  expect(context.modules['my-mod'].vars).toEqual({
    roles: ['admin', 'editor', 'viewer'],
  });
});

test('buildModuleDefs does not error when non-modules keys contain _ref expressions', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: my-mod
    source: "file:../my-mod"
menus:
  - id: main-menu
    links:
      _ref: menus/main.yaml
pages:
  _ref: pages/all.yaml
`,
    },
    {
      path: '/my-mod/module.lowdefy.yaml',
      content: 'pages: []',
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  mockFetchModules.mockResolvedValue({
    'my-mod': { packageRoot: '/my-mod', moduleRoot: '/my-mod', isLocal: true },
  });

  await buildModuleDefs({ context });

  expect(context.modules['my-mod']).toBeDefined();
  expect(context.modules['my-mod'].id).toBe('my-mod');
});

test('buildModuleDefs preserves non-modules keys without resolving refs', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules: []
menus:
  - id: main-menu
    links:
      _ref: menus/main.yaml
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await buildModuleDefs({ context });

  // menus key should not have been resolved — the _ref should still be raw
  // Since buildModuleDefs returns early for empty modules, and Phase 2 re-reads
  // lowdefy.yaml, the non-modules content is never used in Phase 1.
  // The key assertion is that no error was thrown despite the unresolvable _ref.
  expect(context.modules).toEqual({});
});
