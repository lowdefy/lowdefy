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
import registerModuleEntry from './registerModules.js';

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
});

test('registerModuleEntry registers a module with resolved manifest', async () => {
  const context = createTestContext();
  const files = [
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

  await registerModuleEntry({
    entry: { id: 'team-users', source: 'file:../modules/team-users', vars: {} },
    resolvedPaths: {
      packageRoot: '/modules/team-users',
      moduleRoot: '/modules/team-users',
      isLocal: true,
    },
    context,
  });

  expect(context.modules['team-users']).toBeDefined();
  expect(context.modules['team-users'].id).toBe('team-users');
  expect(context.modules['team-users'].source).toBe('file:../modules/team-users');
  expect(context.modules['team-users'].isLocal).toBe(true);
  expect(context.modules['team-users'].manifest.pages).toEqual([
    expect.objectContaining({ id: 'users-page', type: 'Box' }),
  ]);
});

test('registerModuleEntry throws when entry id is missing', async () => {
  const context = createTestContext();
  await expect(
    registerModuleEntry({
      entry: { source: 'file:../mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow("Module entry 'id' is required and must be a string.");
});

test('registerModuleEntry throws when entry id is not a string', async () => {
  const context = createTestContext();
  await expect(
    registerModuleEntry({
      entry: { id: 123, source: 'file:../mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow("Module entry 'id' is required and must be a string.");
});

test('registerModuleEntry throws when entry id contains a slash', async () => {
  const context = createTestContext();
  await expect(
    registerModuleEntry({
      entry: { id: 'team/users', source: 'file:../mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow('must not contain');
});

test('registerModuleEntry throws when source is missing', async () => {
  const context = createTestContext();
  await expect(
    registerModuleEntry({
      entry: { id: 'my-mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow("'source' is required and must be a string");
});

test('registerModuleEntry throws for duplicate entry ids', async () => {
  const context = createTestContext();
  context.modules['team-users'] = { id: 'team-users' };

  await expect(
    registerModuleEntry({
      entry: { id: 'team-users', source: 'file:../mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow('Duplicate module entry id "team-users"');
});

test('registerModuleEntry throws when module.lowdefy.yaml is not found', async () => {
  const context = createTestContext();
  mockReadConfigFile.mockImplementation(() => null);

  await expect(
    registerModuleEntry({
      entry: { id: 'my-mod', source: 'file:../mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow('Referenced file does not exist');
});

test('registerModuleEntry throws when required var is missing', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
vars:
  apiKey:
    required: true
    description: The API key for the service
pages: []
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await expect(
    registerModuleEntry({
      entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
      resolvedPaths: {
        packageRoot: '/modules/my-mod',
        moduleRoot: '/modules/my-mod',
        isLocal: true,
      },
      context,
    })
  ).rejects.toThrow('requires var "apiKey"');
});

test('registerModuleEntry throws when var type does not match', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
vars:
  count:
    type: number
pages: []
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await expect(
    registerModuleEntry({
      entry: { id: 'my-mod', source: 'file:../mod', vars: { count: 'not-a-number' } },
      resolvedPaths: {
        packageRoot: '/modules/my-mod',
        moduleRoot: '/modules/my-mod',
        isLocal: true,
      },
      context,
    })
  ).rejects.toThrow('must be type "number" but got "string"');
});

test('registerModuleEntry throws when required plugin is missing from app', async () => {
  const context = createTestContext({ plugins: [] });
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
plugins:
  - name: "@lowdefy/blocks-antd"
    version: ">=4.0.0"
pages: []
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await expect(
    registerModuleEntry({
      entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
      resolvedPaths: {
        packageRoot: '/modules/my-mod',
        moduleRoot: '/modules/my-mod',
        isLocal: true,
      },
      context,
    })
  ).rejects.toThrow('requires plugin "@lowdefy/blocks-antd"');
});

test('registerModuleEntry throws when plugin version does not satisfy range', async () => {
  const context = createTestContext({
    plugins: [{ name: '@lowdefy/blocks-antd', version: '3.0.0' }],
  });
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
plugins:
  - name: "@lowdefy/blocks-antd"
    version: ">=4.0.0"
pages: []
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await expect(
    registerModuleEntry({
      entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
      resolvedPaths: {
        packageRoot: '/modules/my-mod',
        moduleRoot: '/modules/my-mod',
        isLocal: true,
      },
      context,
    })
  ).rejects.toThrow('but the app has version "3.0.0" installed');
});

test('registerModuleEntry accepts plugin when version satisfies range', async () => {
  const context = createTestContext({
    plugins: [{ name: '@lowdefy/blocks-antd', version: '4.5.2' }],
  });
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
plugins:
  - name: "@lowdefy/blocks-antd"
    version: ">=4.0.0"
pages:
  - id: test-page
    type: Box
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await registerModuleEntry({
    entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  expect(context.modules['my-mod']).toBeDefined();
});

test('registerModuleEntry stores connections from entry', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
pages: []
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await registerModuleEntry({
    entry: {
      id: 'my-mod',
      source: 'file:../mod',
      vars: {},
      connections: { db: { connectionString: 'mongodb://localhost' } },
    },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  expect(context.modules['my-mod'].connections).toEqual({
    db: { connectionString: 'mongodb://localhost' },
  });
});
