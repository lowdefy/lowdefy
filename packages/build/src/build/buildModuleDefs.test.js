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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const { default: testContext } = await import('../test-utils/testContext.js');
const { snapshotTypesMap } = await import('../test-utils/runBuildForSnapshots.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '../..');
const tmpRoot = path.join(pkgRoot, '.tmp-buildmoduledefs', `worker-${process.pid}`);
let configDir;

const mockReadConfigFile = jest.fn();

function createTestContext(overrides = {}) {
  const context = testContext({
    readConfigFile: mockReadConfigFile,
  });
  context.modules = {};
  context.plugins = overrides.plugins ?? [];
  context.errors = [];
  context.typesMap = overrides.typesMap ?? snapshotTypesMap;
  context.unresolvedRefVars = {};
  context.directories.config = configDir;
  context.directories.build = path.join(configDir, '.lowdefy');
  return context;
}

// buildModuleDefs compiles lowdefy.yaml and module manifests through the real
// compiler (filesystem), so fixtures are written to a temp config dir and the
// reader points at disk. Absolute fixture keys (/mod-a/...) are placed under
// the config dir so module roots resolve to real paths.
function writeFiles(files) {
  for (const file of files) {
    const rel = file.path.startsWith('/') ? file.path.slice(1) : file.path;
    const target = path.join(configDir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.content);
  }
  mockReadConfigFile.mockImplementation((filePath) => {
    try {
      return fs.readFileSync(path.resolve(configDir, filePath), 'utf8');
    } catch {
      return null;
    }
  });
}

// fetchModules mock: rewrite the test's /abs roots to real paths under the
// temp config dir (where writeFiles placed the manifests).
function fetchRoots(map) {
  const resolved = {};
  for (const [id, entry] of Object.entries(map)) {
    const under = (p) => path.join(configDir, String(p).replace(/^\//, ''));
    resolved[id] = {
      ...entry,
      packageRoot: under(entry.packageRoot),
      moduleRoot: under(entry.moduleRoot),
    };
  }
  mockFetchModules.mockResolvedValue(resolved);
}

beforeEach(() => {
  mockReadConfigFile.mockReset();
  mockFetchModules.mockReset();
  fs.mkdirSync(tmpRoot, { recursive: true });
  configDir = fs.mkdtempSync(path.join(tmpRoot, 'case-'));
});

afterAll(() => {
  fs.rmSync(path.join(pkgRoot, '.tmp-buildmoduledefs'), { recursive: true, force: true });
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
  writeFiles(files);

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
  writeFiles(files);

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
  writeFiles(files);
  fetchRoots({
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
  expect(context.modules['team-users'].consumerVars).toEqual({
    apiUrl: 'https://api.example.com',
  });
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
  writeFiles(files);
  fetchRoots({
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
  writeFiles(files);
  fetchRoots({
    'my-mod': { packageRoot: '/my-mod', moduleRoot: '/my-mod', isLocal: true },
  });

  await buildModuleDefs({ context });

  expect(context.modules['my-mod'].consumerVars).toEqual({
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
  writeFiles(files);
  fetchRoots({
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
  writeFiles(files);

  await buildModuleDefs({ context });

  // menus key should not have been resolved — the _ref should still be raw
  // Since buildModuleDefs returns early for empty modules, and Phase 2 re-reads
  // lowdefy.yaml, the non-modules content is never used in Phase 1.
  // The key assertion is that no error was thrown despite the unresolvable _ref.
  expect(context.modules).toEqual({});
});

test('buildModuleDefs resolves cross-module _ref to component in entry vars', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: activities
    source: "file:../activities"
  - id: companies
    source: "file:../companies"
    vars:
      components:
        sidebar_slots:
          - _ref:
              module: activities
              component: tile_activities
              vars:
                reference_field: company_ids
pages: []
`,
    },
    {
      path: '/activities/module.lowdefy.yaml',
      content: `
components:
  - id: tile_activities
    component:
      type: Box
      properties:
        title: Activities
`,
    },
    {
      path: '/companies/module.lowdefy.yaml',
      content: 'pages: []',
    },
  ];
  writeFiles(files);
  fetchRoots({
    activities: { packageRoot: '/activities', moduleRoot: '/activities', isLocal: true },
    companies: { packageRoot: '/companies', moduleRoot: '/companies', isLocal: true },
  });

  await buildModuleDefs({ context });

  const slot = context.modules['companies'].consumerVars?.components?.sidebar_slots?.[0];
  expect(slot).toBeDefined();
  expect(slot).not.toHaveProperty('_ref');
  expect(slot).toEqual(
    expect.objectContaining({
      type: 'Box',
      properties: expect.objectContaining({ title: 'Activities' }),
    })
  );
});

test('buildModuleDefs resolves _module.pageId { id, module } in entry vars', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: contacts
    source: "file:../contacts"
  - id: app
    source: "file:../app"
    vars:
      contact_link:
        _module.pageId:
          id: view
          module: contacts
`,
    },
    {
      path: '/contacts/module.lowdefy.yaml',
      content: `
pages:
  - id: view
    type: Box
`,
    },
    {
      path: '/app/module.lowdefy.yaml',
      content: 'pages: []',
    },
  ];
  writeFiles(files);
  fetchRoots({
    contacts: { packageRoot: '/contacts', moduleRoot: '/contacts', isLocal: true },
    app: { packageRoot: '/app', moduleRoot: '/app', isLocal: true },
  });

  await buildModuleDefs({ context });

  expect(context.modules['app'].consumerVars.contact_link).toBe('contacts/view');
});

test('buildModuleDefs resolves _env operator in entry vars (Phase 2.5 regression)', async () => {
  const previous = process.env.TEST_VAR_PHASE25;
  process.env.TEST_VAR_PHASE25 = 'env-value';
  try {
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
      my_var:
        _env: TEST_VAR_PHASE25
pages: []
`,
      },
      {
        path: '/my-mod/module.lowdefy.yaml',
        content: 'pages: []',
      },
    ];
    writeFiles(files);
    fetchRoots({
      'my-mod': { packageRoot: '/my-mod', moduleRoot: '/my-mod', isLocal: true },
    });

    await buildModuleDefs({ context });

    expect(context.modules['my-mod'].consumerVars.my_var).toBe('env-value');
  } finally {
    if (previous === undefined) {
      delete process.env.TEST_VAR_PHASE25;
    } else {
      process.env.TEST_VAR_PHASE25 = previous;
    }
  }
});

test('buildModuleDefs required-var check passes when cross-module _ref resolves to non-null', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: shared
    source: "file:../shared"
  - id: consumer
    source: "file:../consumer"
    vars:
      my_config:
        _ref:
          module: shared
          component: my-config-block
`,
    },
    {
      path: '/shared/module.lowdefy.yaml',
      content: `
components:
  - id: my-config-block
    component:
      foo: bar
`,
    },
    {
      path: '/consumer/module.lowdefy.yaml',
      content: `
vars:
  my_config:
    required: true
pages: []
`,
    },
  ];
  writeFiles(files);
  fetchRoots({
    shared: { packageRoot: '/shared', moduleRoot: '/shared', isLocal: true },
    consumer: { packageRoot: '/consumer', moduleRoot: '/consumer', isLocal: true },
  });

  await buildModuleDefs({ context });

  expect(context.modules['consumer'].consumerVars.my_config).toEqual(
    expect.objectContaining({ foo: 'bar' })
  );
});

test('buildModuleDefs required-var check fails when _ref resolves to null', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: consumer
    source: "file:../consumer"
    vars:
      roles:
        _ref: config/empty.yaml
`,
    },
    {
      path: 'config/empty.yaml',
      content: 'null',
    },
    {
      path: '/consumer/module.lowdefy.yaml',
      content: `
vars:
  roles:
    required: true
pages: []
`,
    },
  ];
  writeFiles(files);
  fetchRoots({
    consumer: { packageRoot: '/consumer', moduleRoot: '/consumer', isLocal: true },
  });

  await expect(buildModuleDefs({ context })).rejects.toThrow('requires var "roles"');
});

test('buildModuleDefs collects error when cross-module _ref targets an unregistered module', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: companies
    source: "file:../companies"
    vars:
      x:
        _ref:
          module: missing
          component: y
`,
    },
    {
      path: '/companies/module.lowdefy.yaml',
      content: 'pages: []',
    },
  ];
  writeFiles(files);
  fetchRoots({
    companies: { packageRoot: '/companies', moduleRoot: '/companies', isLocal: true },
  });

  // Cross-module ref errors are caught by walker.js:739–743 and pushed to
  // context.errors, so the build completes; the production checkpoint
  // (logCollectedErrors) is what raises them. Assert on the collected error.
  await buildModuleDefs({ context });

  expect(context.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message: expect.stringContaining(
          'references module "missing" but no module with that entry id was registered'
        ),
      }),
    ])
  );
});

test('buildModuleDefs throws when _module.var is used in entry vars (app-level guard)', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: companies
    source: "file:../companies"
    vars:
      x:
        _module.var: some_var
`,
    },
    {
      path: '/companies/module.lowdefy.yaml',
      content: 'pages: []',
    },
  ];
  writeFiles(files);
  fetchRoots({
    companies: { packageRoot: '/companies', moduleRoot: '/companies', isLocal: true },
  });

  // Same condition the walker guarded (app-level _module.var), clearer
  // compiled-runtime message.
  await expect(buildModuleDefs({ context })).rejects.toThrow(
    '_module.var "some_var" used outside a module — no module to resolve against.'
  );
});

test('buildModuleDefs resolves cross-module _module.connectionId in entry connections', async () => {
  const context = createTestContext();
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: data
    source: "file:../data"
  - id: companies
    source: "file:../companies"
    connections:
      mongo_main:
        _module.connectionId:
          id: mongo_main
          module: data
`,
    },
    {
      path: '/data/module.lowdefy.yaml',
      content: `
pages: []
`,
    },
    {
      path: '/companies/module.lowdefy.yaml',
      content: 'pages: []',
    },
  ];
  writeFiles(files);
  fetchRoots({
    data: { packageRoot: '/data', moduleRoot: '/data', isLocal: true },
    companies: { packageRoot: '/companies', moduleRoot: '/companies', isLocal: true },
  });

  await buildModuleDefs({ context });

  expect(context.modules['companies'].connections.mongo_main).toBe('data/mongo_main');
});
