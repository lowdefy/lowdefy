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
import { resolveLocalManifest, resolveFullManifest } from './registerModules.js';

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

test('resolveLocalManifest registers a module with locally resolved manifest', async () => {
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

  await resolveLocalManifest({
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
  // Pages are preserved in local resolve
  expect(context.modules['team-users'].manifest.pages).toBeDefined();
});

test('resolveLocalManifest throws when entry id is missing', async () => {
  const context = createTestContext();
  await expect(
    resolveLocalManifest({
      entry: { source: 'file:../mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow("Module entry 'id' is required and must be a string.");
});

test('resolveLocalManifest throws when entry id is not a string', async () => {
  const context = createTestContext();
  await expect(
    resolveLocalManifest({
      entry: { id: 123, source: 'file:../mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow("Module entry 'id' is required and must be a string.");
});

test('resolveLocalManifest throws when entry id contains a slash', async () => {
  const context = createTestContext();
  await expect(
    resolveLocalManifest({
      entry: { id: 'team/users', source: 'file:../mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow('must not contain');
});

test('resolveLocalManifest throws when source is missing', async () => {
  const context = createTestContext();
  await expect(
    resolveLocalManifest({
      entry: { id: 'my-mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow("'source' is required and must be a string");
});

test('resolveLocalManifest throws for duplicate entry ids', async () => {
  const context = createTestContext();
  context.modules['team-users'] = { id: 'team-users' };

  await expect(
    resolveLocalManifest({
      entry: { id: 'team-users', source: 'file:../mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow('Duplicate module entry id "team-users"');
});

test('resolveLocalManifest throws when module.lowdefy.yaml is not found', async () => {
  const context = createTestContext();
  mockReadConfigFile.mockImplementation(() => null);

  await expect(
    resolveLocalManifest({
      entry: { id: 'my-mod', source: 'file:../mod' },
      resolvedPaths: { packageRoot: '/mod', moduleRoot: '/mod', isLocal: true },
      context,
    })
  ).rejects.toThrow('Referenced file does not exist');
});

test('resolveLocalManifest throws when required var is missing', async () => {
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
    resolveLocalManifest({
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

test('resolveLocalManifest throws when var type does not match', async () => {
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
    resolveLocalManifest({
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

test('resolveLocalManifest throws when required plugin is missing from app', async () => {
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
    resolveLocalManifest({
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

test('resolveLocalManifest throws when plugin version does not satisfy range', async () => {
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
    resolveLocalManifest({
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

test('resolveLocalManifest accepts plugin when version satisfies range', async () => {
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

  await resolveLocalManifest({
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

test('resolveLocalManifest parses dependencies array from manifest', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
dependencies:
  - id: contacts
    description: Contact management
  - id: layout
    description: Page layout components
pages: []
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await resolveLocalManifest({
    entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  expect(context.modules['my-mod'].dependencies).toEqual([
    { id: 'contacts', description: 'Contact management' },
    { id: 'layout', description: 'Page layout components' },
  ]);
});

test('resolveLocalManifest defaults dependencies to empty array when absent', async () => {
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

  await resolveLocalManifest({
    entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  expect(context.modules['my-mod'].dependencies).toEqual([]);
});

test('resolveLocalManifest throws when dependencies item has no string id', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
dependencies:
  - description: Missing id field
pages: []
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await expect(
    resolveLocalManifest({
      entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
      resolvedPaths: {
        packageRoot: '/modules/my-mod',
        moduleRoot: '/modules/my-mod',
        isLocal: true,
      },
      context,
    })
  ).rejects.toThrow('each item in "dependencies" must have a string "id"');
});

test('resolveLocalManifest parses exports object from manifest', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
exports:
  pages:
    - id: company-list
    - id: company-detail
  components:
    - id: company-selector
      description: Dropdown selector
  menus:
    - id: default
  connections:
    - id: companies-db
  api:
    - id: save-company
pages: []
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await resolveLocalManifest({
    entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  expect(context.modules['my-mod'].exports).toEqual({
    pages: [{ id: 'company-list' }, { id: 'company-detail' }],
    components: [{ id: 'company-selector', description: 'Dropdown selector' }],
    menus: [{ id: 'default' }],
    connections: [{ id: 'companies-db' }],
    api: [{ id: 'save-company' }],
  });
});

test('resolveLocalManifest defaults exports sections to empty arrays when absent', async () => {
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

  await resolveLocalManifest({
    entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  expect(context.modules['my-mod'].exports).toEqual({
    pages: [],
    components: [],
    menus: [],
    connections: [],
    api: [],
  });
});

test('resolveLocalManifest throws when exports section item has no string id', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
exports:
  pages:
    - description: Missing id
pages: []
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await expect(
    resolveLocalManifest({
      entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
      resolvedPaths: {
        packageRoot: '/modules/my-mod',
        moduleRoot: '/modules/my-mod',
        isLocal: true,
      },
      context,
    })
  ).rejects.toThrow('each item in exports.pages must have a string "id"');
});

test('resolveLocalManifest throws for unknown exports sections', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
exports:
  widgets:
    - id: foo
pages: []
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await expect(
    resolveLocalManifest({
      entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
      resolvedPaths: {
        packageRoot: '/modules/my-mod',
        moduleRoot: '/modules/my-mod',
        isLocal: true,
      },
      context,
    })
  ).rejects.toThrow('unknown exports section "widgets"');
});

test('resolveLocalManifest stores moduleDependencies from entry dependencies', async () => {
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

  await resolveLocalManifest({
    entry: {
      id: 'my-mod',
      source: 'file:../mod',
      vars: {},
      dependencies: { layout: 'app-layout', contacts: 'crm-contacts' },
    },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  expect(context.modules['my-mod'].moduleDependencies).toEqual({
    layout: 'app-layout',
    contacts: 'crm-contacts',
  });
});

test('resolveLocalManifest defaults moduleDependencies to empty object when absent', async () => {
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

  await resolveLocalManifest({
    entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  expect(context.modules['my-mod'].moduleDependencies).toEqual({});
});

test('resolveLocalManifest stores connections from entry', async () => {
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

  await resolveLocalManifest({
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

test('resolveLocalManifest preserves pages, api, connections, and menu links', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
pages:
  - id: my-page
    type: Box
    blocks:
      - id: block1
        type: TextInput
connections:
  - id: my-conn
    type: MongoDBCollection
api:
  - id: my-endpoint
    type: MongoDBFind
menus:
  - id: default
    links:
      - id: link1
        pageId: my-page
components:
  - id: my-comp
    component:
      id: inner
      type: Box
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await resolveLocalManifest({
    entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  const manifest = context.modules['my-mod'].manifest;
  // Pages, connections, api preserved (content exists but was stopped from deep resolution)
  expect(manifest.pages).toBeDefined();
  expect(manifest.connections).toBeDefined();
  expect(manifest.api).toBeDefined();
  expect(manifest.menus).toBeDefined();
  expect(manifest.components).toBeDefined();
});

test('resolveFullManifest resolves preserved content in second pass', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
pages:
  - id: my-page
    type: Box
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await resolveLocalManifest({
    entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  await resolveFullManifest({ entryId: 'my-mod', context });

  expect(context.modules['my-mod'].manifest.pages).toEqual([
    expect.objectContaining({ id: 'my-page', type: 'Box' }),
  ]);
});

test('resolveFullManifest filters null entries from pages, connections, api', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
pages:
  - id: good-page
    type: Box
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  await resolveLocalManifest({
    entry: { id: 'my-mod', source: 'file:../mod', vars: {} },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  // Manually inject a null to simulate a failed ref resolution
  context.modules['my-mod'].manifest.pages.push(null);

  await resolveFullManifest({ entryId: 'my-mod', context });

  expect(context.modules['my-mod'].manifest.pages).toEqual([
    expect.objectContaining({ id: 'good-page', type: 'Box' }),
  ]);
});
