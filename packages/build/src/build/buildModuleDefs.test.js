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
import expectTerminates from '../test-utils/expectTerminates.js';

const mockReadConfigFile = jest.fn();

function createTestContext(overrides = {}) {
  const context = testContext({
    readConfigFile: mockReadConfigFile,
  });
  context.modules = {};
  context.plugins = overrides.plugins ?? [];
  context.errors = [];
  context.typesMap = overrides.typesMap ?? {};
  context.unresolvedRefVars = {};
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
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  mockFetchModules.mockResolvedValue({
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
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  mockFetchModules.mockResolvedValue({
    contacts: { packageRoot: '/contacts', moduleRoot: '/contacts', isLocal: true },
    app: { packageRoot: '/app', moduleRoot: '/app', isLocal: true },
  });

  await buildModuleDefs({ context });

  expect(context.modules['app'].consumerVars.contact_link).toBe('contacts/view');
});

test('buildModuleDefs preserves runtime operators in entry vars (folded by Phase 3.5)', async () => {
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
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue({
      'my-mod': { packageRoot: '/my-mod', moduleRoot: '/my-mod', isLocal: true },
    });

    await buildModuleDefs({ context });

    // Runtime operators in entry vars are no longer folded during Phase 2.5.
    // They flow through _module.var into manifests and are folded in Phase 3.5
    // (precomputeRuntimeOperators on components after buildModules merges manifests).
    expect(context.modules['my-mod'].consumerVars.my_var).toEqual({ _env: 'TEST_VAR_PHASE25' });
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
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  mockFetchModules.mockResolvedValue({
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
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  mockFetchModules.mockResolvedValue({
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
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  mockFetchModules.mockResolvedValue({
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
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  mockFetchModules.mockResolvedValue({
    companies: { packageRoot: '/companies', moduleRoot: '/companies', isLocal: true },
  });

  await expect(buildModuleDefs({ context })).rejects.toThrow(
    '_module.var cannot be used at the app level.'
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
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  mockFetchModules.mockResolvedValue({
    data: { packageRoot: '/data', moduleRoot: '/data', isLocal: true },
    companies: { packageRoot: '/companies', moduleRoot: '/companies', isLocal: true },
  });

  await buildModuleDefs({ context });

  expect(context.modules['companies'].connections.mongo_main).toBe('data/mongo_main');
});

describe('demand-driven entry-config resolution', () => {
  // Fails fast with a clear message if a cycle/ordering regression deadlocks the
  // build instead of settling (resolved, or settled-with-collected-error).
  function buildWithTimeout(context, ms = 4000) {
    return expectTerminates(
      buildModuleDefs({ context }),
      ms,
      'build did not terminate — suspected cycle-detection regression'
    );
  }

  const mockPaths = (ids) =>
    Object.fromEntries(
      ids.map((id) => [id, { packageRoot: `/${id}`, moduleRoot: `/${id}`, isLocal: true }])
    );

  // Recursive scan for the ~deferredModuleRef sentinel marker. The marker is
  // NON-ENUMERABLE, so Object.keys won't see it — use Reflect.ownKeys.
  function hasDeferredMarker(node, seen = new Set()) {
    if (node === null || typeof node !== 'object') return false;
    if (seen.has(node)) return false;
    seen.add(node);
    for (const key of Reflect.ownKeys(node)) {
      if (key === '~deferredModuleRef') return true;
    }
    for (const key of Reflect.ownKeys(node)) {
      if (typeof key === 'symbol') continue;
      if (hasDeferredMarker(node[key], seen)) return true;
    }
    return false;
  }

  // Test 1 — the repro. A (listed FIRST) pulls B's reader component, which reads
  // B's own var x (supplied in B's ENTRY vars). Under the old single-pass code,
  // B was unresolved when A's ref was pulled, so x resolved to null and the null
  // was cached. The fix prepares all entries then finalizes demand-driven, so the
  // first read of B resolves it regardless of order.
  test('repro: A-before-B cross-module ref resolves B var to its real value (not null)', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
    vars:
      slot:
        _ref:
          module: b
          component: reader
  - id: b
    source: "file:../b"
    vars:
      x: hello
`,
      },
      { path: '/a/module.lowdefy.yaml', content: 'pages: []' },
      {
        path: '/b/module.lowdefy.yaml',
        content: `
vars:
  x: {}
components:
  - id: reader
    component:
      type: Box
      properties:
        value:
          _module.var: x
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a', 'b']));

    await buildModuleDefs({ context });

    const slot = context.modules['a'].consumerVars.slot;
    expect(slot).not.toHaveProperty('_ref');
    expect(slot).toEqual({ type: 'Box', properties: { value: 'hello' } });
    expect(slot.properties.value).toBe('hello');
    // The real value is cached on B — not the buggy null.
    expect(context.modules['b'].resolvedVarCache.x).toBe('hello');
  });

  // Test 2 — order independence. Same fixture with B listed FIRST must produce
  // identical results.
  test('order independence: B-before-A produces identical resolution', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: b
    source: "file:../b"
    vars:
      x: hello
  - id: a
    source: "file:../a"
    vars:
      slot:
        _ref:
          module: b
          component: reader
`,
      },
      { path: '/a/module.lowdefy.yaml', content: 'pages: []' },
      {
        path: '/b/module.lowdefy.yaml',
        content: `
vars:
  x: {}
components:
  - id: reader
    component:
      type: Box
      properties:
        value:
          _module.var: x
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a', 'b']));

    await buildModuleDefs({ context });

    const slot = context.modules['a'].consumerVars.slot;
    expect(slot).not.toHaveProperty('_ref');
    expect(slot.properties.value).toBe('hello');
    expect(context.modules['b'].resolvedVarCache.x).toBe('hello');
  });

  // Test 3 — mutual embedding, acyclic values (the design's worked example).
  // companies pulls workflows' actions (reads workflows_config); workflows pulls
  // companies' selector (reads collection_name, a LITERAL). Neither value depends
  // on the other circularly, so the build must settle in BOTH orders.
  function mutualEmbedFiles(order) {
    const companies = `  - id: companies
    source: "file:../companies"
    vars:
      sidebar_slots:
        _ref:
          module: workflows
          component: actions
      collection_name: companies_main`;
    const workflows = `  - id: workflows
    source: "file:../workflows"
    vars:
      workflows_config:
        _ref:
          module: companies
          component: selector`;
    const mods = order === 'companies-first' ? `${companies}\n${workflows}` : `${workflows}\n${companies}`;
    return [
      { path: 'lowdefy.yaml', content: `\nlowdefy: 4.0.0\nmodules:\n${mods}\n` },
      {
        path: '/companies/module.lowdefy.yaml',
        content: `
vars:
  sidebar_slots: {}
  collection_name: {}
components:
  - id: selector
    component:
      type: Box
      properties:
        coll:
          _module.var: collection_name
pages: []
`,
      },
      {
        path: '/workflows/module.lowdefy.yaml',
        content: `
vars:
  workflows_config: {}
components:
  - id: actions
    component:
      type: Box
      properties:
        cfg:
          _module.var: workflows_config
pages: []
`,
      },
    ];
  }

  const mutualEmbedCase = async (order) => {
    const context = createTestContext();
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(mutualEmbedFiles(order)));
    mockFetchModules.mockResolvedValue(mockPaths(['companies', 'workflows']));

    await buildWithTimeout(context);

    const companies = context.modules['companies'];
    const workflows = context.modules['workflows'];
    // Both refs resolved to inlined components — no _ref, no null.
    expect(companies.consumerVars.sidebar_slots).not.toHaveProperty('_ref');
    expect(workflows.consumerVars.workflows_config).not.toHaveProperty('_ref');
    // The literal flows all the way through both embeddings.
    expect(workflows.consumerVars.workflows_config.properties.coll).toBe('companies_main');
    expect(companies.consumerVars.sidebar_slots.properties.cfg.properties.coll).toBe(
      'companies_main'
    );
    expect(companies.resolvedVarCache.collection_name).toBe('companies_main');
  };

  test.each(['companies-first'])(
    'mutual acyclic embedding settles and resolves both entries (order=%s)',
    mutualEmbedCase
  );

  // Living reproducer of the order-dependent false cycle: the read path's case 3
  // conflates "value is still deferred" with "value is part of a cycle", so this
  // order resolves sidebar_slots to null and collects a false cycle error. The
  // deferred-records rearchitecture fixes this at value granularity; when it
  // does, this test "passes unexpectedly" and the .failing marker must be removed.
  test.failing(
    'mutual acyclic embedding settles and resolves both entries (order=workflows-first)',
    () => mutualEmbedCase('workflows-first')
  );

  // Test 4 — self-embed. An entry embeds a component from ITS OWN module that
  // reads that module's var (supplied as a literal in the SAME entry vars).
  test('self-embed resolves own-module var via structural read', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
    vars:
      title: My Title
      slot:
        _ref:
          module: a
          component: header
`,
      },
      {
        path: '/a/module.lowdefy.yaml',
        content: `
vars:
  title: {}
  slot: {}
components:
  - id: header
    component:
      type: Box
      properties:
        text:
          _module.var: title
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a']));

    await buildModuleDefs({ context });

    expect(context.modules['a'].consumerVars.slot.properties.text).toBe('My Title');
    expect(context.modules['a'].resolvedVarCache.title).toBe('My Title');
  });

  // Test 5 — true value cycle (two-entry topology → chain a → b → a).
  // a.dep_x pulls b's b_reader (reads b.dep_y) → b.dep_y pulls a's a_reader
  // (reads a.dep_x, which IS a's still-resolving deferred ref). Thrown deep inside
  // a sentinel's loadAndWalkRef → caught and COLLECTED into context.errors.
  test('true value cycle settles and collects a named-chain ConfigError', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
    vars:
      dep_x:
        _ref:
          module: b
          component: b_reader
  - id: b
    source: "file:../b"
    vars:
      dep_y:
        _ref:
          module: a
          component: a_reader
`,
      },
      {
        path: '/a/module.lowdefy.yaml',
        content: `
vars:
  dep_x: {}
components:
  - id: a_reader
    component:
      type: Box
      properties:
        value:
          _module.var: dep_x
pages: []
`,
      },
      {
        path: '/b/module.lowdefy.yaml',
        content: `
vars:
  dep_y: {}
components:
  - id: b_reader
    component:
      type: Box
      properties:
        value:
          _module.var: dep_y
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a', 'b']));

    // Must SETTLE (not hang); the cycle error is collected, not thrown.
    await buildWithTimeout(context);

    expect(context.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringMatching(/Circular module entry vars: a → b → a/),
        }),
      ])
    );
    const cycleError = context.errors.find((e) =>
      /Circular module entry vars:/.test(e.message)
    );
    expect(cycleError.message).toContain('Var "dep_x"');
  });

  // Test 6 — whole-blob ref. An entry whose ENTIRE vars object is one cross-module
  // ref. Acyclic → resolves to the inlined config.
  test('whole-blob cross-module ref resolves the entire vars object', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
    vars:
      _ref:
        module: b
        component: cfg
  - id: b
    source: "file:../b"
`,
      },
      { path: '/a/module.lowdefy.yaml', content: 'pages: []' },
      {
        path: '/b/module.lowdefy.yaml',
        content: `
components:
  - id: cfg
    component:
      type: Box
      properties:
        setting: enabled
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a', 'b']));

    await buildModuleDefs({ context });

    expect(context.modules['a'].consumerVars).not.toHaveProperty('_ref');
    expect(context.modules['a'].consumerVars).toEqual({
      type: 'Box',
      properties: { setting: 'enabled' },
    });
  });

  // Test 6 (re-entrant half) — whole-blob refs that point back at each other.
  // The re-entrant read hits a sentinel sitting at the path ROOT of the structural
  // blob → cycle error, collected. Must settle, not hang.
  test('re-entrant whole-blob refs settle and collect a vars cycle error', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
    vars:
      _ref:
        module: b
        component: b_cfg
  - id: b
    source: "file:../b"
    vars:
      _ref:
        module: a
        component: a_cfg
`,
      },
      {
        path: '/a/module.lowdefy.yaml',
        content: `
components:
  - id: a_cfg
    component:
      type: Box
      properties:
        v:
          _module.var: anything
pages: []
`,
      },
      {
        path: '/b/module.lowdefy.yaml',
        content: `
components:
  - id: b_cfg
    component:
      type: Box
      properties:
        w:
          _module.var: whatever
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a', 'b']));

    await buildWithTimeout(context);

    expect(context.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringMatching(/Circular module entry vars: a → b → a/),
        }),
      ])
    );
  });

  // Test 7 — scope correctness of prepared refs. The deferred ref's `vars` use
  // `_var: name`, bound in the ENCLOSING scope (a file ref carrying name=Acme).
  // Stage 1 must resolve the ref's vars in that enclosing scope before deferring,
  // so the embedded component receives Acme.
  test('deferred ref resolves its vars in the enclosing scope (stage 1)', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
    vars:
      slot:
        _ref:
          path: config/a-vars.yaml
          vars:
            name: Acme
  - id: b
    source: "file:../b"
`,
      },
      {
        path: 'config/a-vars.yaml',
        content: `
_ref:
  module: b
  component: reader
  vars:
    reference_field:
      _var: name
`,
      },
      { path: '/a/module.lowdefy.yaml', content: 'pages: []' },
      {
        path: '/b/module.lowdefy.yaml',
        content: `
components:
  - id: reader
    component:
      type: Box
      properties:
        field:
          _var: reference_field
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a', 'b']));

    await buildModuleDefs({ context });

    expect(context.errors).toEqual([]);
    expect(context.modules['a'].consumerVars.slot.properties.field).toBe('Acme');
  });

  // Test 8 — default fallback mid-flight. A re-entrant read of a key ABSENT from
  // B's structural blob, with NO sentinel ancestor, falls back to the manifest
  // default (a literal) — not an error.
  test('absent var with no sentinel ancestor falls back to manifest default mid-flight', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
    vars:
      slot:
        _ref:
          module: b
          component: reader
  - id: b
    source: "file:../b"
`,
      },
      { path: '/a/module.lowdefy.yaml', content: 'pages: []' },
      {
        path: '/b/module.lowdefy.yaml',
        content: `
vars:
  x:
    default: fallback_default
components:
  - id: reader
    component:
      type: Box
      properties:
        v:
          _module.var: x
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a', 'b']));

    await buildModuleDefs({ context });

    expect(context.errors).toEqual([]);
    expect(context.modules['a'].consumerVars.slot.properties.v).toBe('fallback_default');
    expect(context.modules['b'].resolvedVarCache.x).toBe('fallback_default');
  });

  // Test 9 — _module.pageId resolves (stage 1) inside a deferred ref's vars.
  test('_module.pageId inside a deferred ref vars resolves to the scoped id', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: contacts
    source: "file:../contacts"
  - id: a
    source: "file:../a"
    vars:
      slot:
        _ref:
          module: b
          component: reader
          vars:
            link:
              _module.pageId:
                id: view
                module: contacts
  - id: b
    source: "file:../b"
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
      { path: '/a/module.lowdefy.yaml', content: 'pages: []' },
      {
        path: '/b/module.lowdefy.yaml',
        content: `
components:
  - id: reader
    component:
      type: Box
      properties:
        href:
          _var: link
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['contacts', 'a', 'b']));

    await buildModuleDefs({ context });

    expect(context.errors).toEqual([]);
    expect(context.modules['a'].consumerVars.slot.properties.href).toBe('contacts/view');
  });

  // Test 10 — required vars validated even for entries no ref reads. Proves sweep
  // 2.5b finalizes EVERY entry (demanded or not).
  test('required var missing on an undemanded entry fails the build', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
`,
      },
      {
        path: '/a/module.lowdefy.yaml',
        content: `
vars:
  needed:
    required: true
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a']));

    await expect(buildModuleDefs({ context })).rejects.toThrow(/requires var "needed"/);
  });

  // Test 11 — no sentinel leaks. After a successful build, NO ~deferredModuleRef
  // marker survives anywhere (the marker is non-enumerable → scan with ownKeys).
  test('no ~deferredModuleRef sentinels survive a successful build', async () => {
    const context = createTestContext();
    mockReadConfigFile.mockImplementation(
      readConfigFileMockImplementation(mutualEmbedFiles('companies-first'))
    );
    mockFetchModules.mockResolvedValue(mockPaths(['companies', 'workflows']));

    await buildModuleDefs({ context });

    for (const id of ['companies', 'workflows']) {
      const m = context.modules[id];
      expect(hasDeferredMarker(m.consumerVars)).toBe(false);
      expect(hasDeferredMarker(m.connections)).toBe(false);
      expect(hasDeferredMarker(m.resolvedVarCache)).toBe(false);
    }
  });

  // Test 12 — connection-remap ordering. Acyclic chain a → b → third resolves to
  // the fully-remapped id in BOTH orders.
  function connChainFiles(order) {
    const a = `  - id: a
    source: "file:../a"
    connections:
      c:
        _module.connectionId:
          id: c
          module: b`;
    const b = `  - id: b
    source: "file:../b"
    connections:
      c:
        _module.connectionId:
          id: c
          module: third`;
    const third = `  - id: third
    source: "file:../third"`;
    const mods = order === 'a-first' ? `${a}\n${b}\n${third}` : `${third}\n${b}\n${a}`;
    return [
      { path: 'lowdefy.yaml', content: `\nlowdefy: 4.0.0\nmodules:\n${mods}\n` },
      { path: '/a/module.lowdefy.yaml', content: 'pages: []' },
      { path: '/b/module.lowdefy.yaml', content: 'pages: []' },
      { path: '/third/module.lowdefy.yaml', content: 'pages: []' },
    ];
  }

  test.each(['a-first', 'third-first'])(
    'acyclic connection remap chain resolves to the fully-remapped id (order=%s)',
    async (order) => {
      const context = createTestContext();
      mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(connChainFiles(order)));
      mockFetchModules.mockResolvedValue(mockPaths(['a', 'b', 'third']));

      await buildWithTimeout(context);

      expect(context.modules['a'].connections.c).toBe('third/c');
      expect(context.modules['b'].connections.c).toBe('third/c');
    }
  );

  // Test 12 (cycle half) — a true remap cycle (a → b → a). Surfaces from
  // resolveModuleConnectionId during finalize's DIRECT connections walk → THROWN
  // (not collected). Must reject with the named chain, not hang.
  test('true connection remap cycle throws a named-chain ConfigError', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
    connections:
      c:
        _module.connectionId:
          id: c
          module: b
  - id: b
    source: "file:../b"
    connections:
      c:
        _module.connectionId:
          id: c
          module: a
`,
      },
      { path: '/a/module.lowdefy.yaml', content: 'pages: []' },
      { path: '/b/module.lowdefy.yaml', content: 'pages: []' },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a', 'b']));

    await expect(buildWithTimeout(context)).rejects.toThrow(
      /Circular module entry connections: a → b → a/
    );
  });

  // Test 13 — concurrent demand of one entry. A single pulled component reads TWO
  // of B's vars while B is still structural; the two reads race within one finalize
  // walk. Build must settle (no false cycle), both reads correct, B.cache holds both.
  test('concurrent demand of two vars on one entry settles with both values correct', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
    vars:
      slot:
        _ref:
          module: b
          component: reader
  - id: b
    source: "file:../b"
    vars:
      x: valx
      y: valy
`,
      },
      { path: '/a/module.lowdefy.yaml', content: 'pages: []' },
      {
        path: '/b/module.lowdefy.yaml',
        content: `
vars:
  x: {}
  y: {}
components:
  - id: reader
    component:
      type: Box
      properties:
        vx:
          _module.var: x
        vy:
          _module.var: y
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a', 'b']));

    await buildWithTimeout(context);

    // No false cycle ConfigError raised by the racing reads.
    expect(context.errors).toEqual([]);
    const slot = context.modules['a'].consumerVars.slot;
    expect(slot.properties.vx).toBe('valx');
    expect(slot.properties.vy).toBe('valy');
    expect(context.modules['b'].resolvedVarCache.x).toBe('valx');
    expect(context.modules['b'].resolvedVarCache.y).toBe('valy');
    // Single-finalize: B reaches the terminal 'resolved' state exactly once and
    // holds a single coalesced finalizePromise. NOTE: a direct spy on
    // validateRequiredVars is impractical here — registerModules.js exports both
    // validateRequiredVars and the heavy resolveLocalManifest/resolveFullManifest,
    // and ESM whole-module mocking with self-passthrough recurses (OOM). The
    // strongest clean signals available are asserted instead: B is terminally
    // resolved, both racing reads coalesced onto correct values with no duplicate
    // resolution artifacts, and no false cycle was collected.
    expect(context.modules['b'].entryConfigState).toBe('resolved');
  });

  // Test 15 — default that reads another var, mid-flight. Acyclic: b.x is absent
  // from the structural blob and its default reads _module.var: y, which resolves
  // to a sentinel-free structural value → resolves via the case-3 fall-through.
  test('manifest default that reads another var resolves mid-flight (acyclic)', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
    vars:
      slot:
        _ref:
          module: b
          component: reader
  - id: b
    source: "file:../b"
    vars:
      y: yval
`,
      },
      { path: '/a/module.lowdefy.yaml', content: 'pages: []' },
      {
        path: '/b/module.lowdefy.yaml',
        content: `
vars:
  x:
    default:
      _module.var: y
  y: {}
components:
  - id: reader
    component:
      type: Box
      properties:
        v:
          _module.var: x
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a', 'b']));

    await buildWithTimeout(context);

    expect(context.errors).toEqual([]);
    expect(context.modules['a'].consumerVars.slot.properties.v).toBe('yval');
    expect(context.modules['b'].resolvedVarCache.x).toBe('yval');
  });

  // Test 15 (true-cycle half) — the default reads back into the unresolved chain.
  // b.x default reads b.dep_y, which pulls a's a_reader reading a's still-resolving
  // dep_x → cycle, collected. Must settle, not hang.
  test('manifest default that reads back into the unresolved chain settles as a cycle', async () => {
    const context = createTestContext();
    const files = [
      {
        path: 'lowdefy.yaml',
        content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"
    vars:
      dep_x:
        _ref:
          module: b
          component: b_reader
  - id: b
    source: "file:../b"
    vars:
      dep_y:
        _ref:
          module: a
          component: a_reader
`,
      },
      {
        path: '/a/module.lowdefy.yaml',
        content: `
vars:
  dep_x: {}
components:
  - id: a_reader
    component:
      type: Box
      properties:
        value:
          _module.var: dep_x
pages: []
`,
      },
      {
        path: '/b/module.lowdefy.yaml',
        content: `
vars:
  dep_y: {}
  x:
    default:
      _module.var: dep_y
components:
  - id: b_reader
    component:
      type: Box
      properties:
        value:
          _module.var: x
pages: []
`,
      },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    mockFetchModules.mockResolvedValue(mockPaths(['a', 'b']));

    await buildWithTimeout(context);

    expect(context.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringMatching(/Circular module entry vars: a → b → a/),
        }),
      ])
    );
  });
});

describe('demand-only var defaults', () => {
  const mockModulePaths = (ids) =>
    Object.fromEntries(
      ids.map((id) => [id, { packageRoot: `/${id}`, moduleRoot: `/${id}`, isLocal: true }])
    );

  const brokenDefaultFiles = (entryVars) => [
    {
      path: 'lowdefy.yaml',
      content: `
lowdefy: 4.0.0
modules:
  - id: a
    source: "file:../a"${entryVars}
`,
    },
    {
      path: '/a/module.lowdefy.yaml',
      content: `
vars:
  x:
    default:
      _ref: /a/missing.yaml
pages:
  - id: home
    type: Box
    properties:
      value:
        _module.var: x
`,
    },
  ];

  test('a broken default builds green when the consumer supplies the var', async () => {
    const context = createTestContext();
    mockReadConfigFile.mockImplementation(
      readConfigFileMockImplementation(
        brokenDefaultFiles(`
    vars:
      x: supplied-value`)
      )
    );
    mockFetchModules.mockResolvedValue(mockModulePaths(['a']));

    await expectTerminates(buildModuleDefs({ context }), 4000, 'demand-only default hang');

    expect(context.errors).toHaveLength(0);
    expect(context.modules['a'].manifest.pages[0].properties.value).toBe('supplied-value');
  });

  test('a broken default errors only when demanded', async () => {
    const context = createTestContext();
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(brokenDefaultFiles('')));
    mockFetchModules.mockResolvedValue(mockModulePaths(['a']));

    await expectTerminates(buildModuleDefs({ context }), 4000, 'demanded broken default hang');

    expect(context.errors.length).toBeGreaterThan(0);
    expect(String(context.errors[0].message)).toContain('missing.yaml');
  });
});
