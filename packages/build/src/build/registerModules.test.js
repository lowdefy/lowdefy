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
import {
  resolveLocalManifest,
  resolveFullManifest,
  validateRequiredVars,
} from './registerModules.js';
import { getRecord } from './buildRefs/deferredRegistry.js';

const mockReadConfigFile = jest.fn();

function createTestContext(overrides = {}) {
  const context = testContext({
    readConfigFile: mockReadConfigFile,
  });
  context.modules = {};
  context.plugins = overrides.plugins ?? [];
  context.defaultPackageNames = overrides.defaultPackageNames ?? new Set();
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
  expect(context.modules['team-users'].consumerVars).toEqual({});
  expect(context.modules['team-users'].varDefs).toEqual({});
  expect(context.modules['team-users'].resolvedVarCache).toEqual({});
  expect(context.modules['team-users'].vars).toBeUndefined();
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

test('validateRequiredVars throws when required var is missing', () => {
  const varDefs = {
    apiKey: {
      required: true,
      description: 'The API key for the service',
    },
  };

  expect(() => validateRequiredVars(varDefs, {}, 'my-mod', 'file:../mod')).toThrow(
    'requires var "apiKey"'
  );
});

test('validateVarTypes catches type mismatch after Phase 2', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
vars:
  count:
    type: number
pages:
  - id: test
    type: Box
    properties:
      value:
        _module.var: count
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  // Phase 1a succeeds — no type validation yet
  await resolveLocalManifest({
    entry: { id: 'my-mod', source: 'file:../mod', vars: { count: 'not-a-number' } },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  expect(context.modules['my-mod']).toBeDefined();

  // Type validation happens after resolveFullManifest
  await expect(resolveFullManifest({ entryId: 'my-mod', context })).rejects.toThrow(
    'must be type "number" but got "string"'
  );
});

test('validateVarTypes throws when a typed var is given a static-foldable runtime operator', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
vars:
  total:
    type: number
pages:
  - id: test
    type: Box
    properties:
      value:
        _module.var: total
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  // Pass a static-foldable runtime operator ({ _sum: [1, 2] }) as the typed var value.
  // Even though _sum with static args could be folded, typed vars must hold concrete values.
  await resolveLocalManifest({
    entry: { id: 'my-mod', source: 'file:../mod', vars: { total: { _sum: [1, 2] } } },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  await expect(resolveFullManifest({ entryId: 'my-mod', context })).rejects.toThrow(
    'var "total" is typed "number" but received a runtime operator "_sum"'
  );
  await expect(resolveFullManifest({ entryId: 'my-mod', context })).rejects.toThrow(
    '"_build.sum"'
  );
});

test('validateVarTypes throws when a typed var is given a dynamic runtime operator', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
vars:
  label:
    type: string
pages:
  - id: test
    type: Box
    properties:
      value:
        _module.var: label
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));

  // Pass a dynamic runtime operator ({ '_string.concat': [..., { _state: x }] }) as the typed var value.
  // Dynamic operators cannot be statically folded, but the check applies regardless.
  await resolveLocalManifest({
    entry: {
      id: 'my-mod',
      source: 'file:../mod',
      vars: { label: { '_string.concat': ['hello', { _state: 'name' }] } },
    },
    resolvedPaths: {
      packageRoot: '/modules/my-mod',
      moduleRoot: '/modules/my-mod',
      isLocal: true,
    },
    context,
  });

  await expect(resolveFullManifest({ entryId: 'my-mod', context })).rejects.toThrow(
    'var "label" is typed "string" but received a runtime operator "_string.concat"'
  );
  await expect(resolveFullManifest({ entryId: 'my-mod', context })).rejects.toThrow(
    '"_build.string.concat"'
  );
});

test('resolveLocalManifest throws when plugin version is missing', async () => {
  const context = createTestContext({ plugins: [] });
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
plugins:
  - name: "@example/custom-blocks"
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
  ).rejects.toThrow('must declare a "version"');
});

test('resolveLocalManifest throws when required plugin is missing from app', async () => {
  const context = createTestContext({ plugins: [] });
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
plugins:
  - name: "@example/custom-blocks"
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
  ).rejects.toThrow('requires plugin "@example/custom-blocks"');
});

test('resolveLocalManifest throws when plugin version does not satisfy range', async () => {
  const context = createTestContext({
    plugins: [{ name: '@example/custom-blocks', version: '3.0.0' }],
  });
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
plugins:
  - name: "@example/custom-blocks"
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
    plugins: [{ name: '@example/custom-blocks', version: '4.5.2' }],
  });
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
plugins:
  - name: "@example/custom-blocks"
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

test('resolveLocalManifest skips validation for default plugins', async () => {
  const context = createTestContext({
    plugins: [],
    defaultPackageNames: new Set(['@lowdefy/blocks-antd']),
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

test('resolveLocalManifest silently ignores manifest.exports', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
exports:
  pages:
    - id: company-list
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

  expect(context.modules['my-mod']).toBeDefined();
  expect(context.modules['my-mod'].exports).toBeUndefined();
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

test('resolveLocalManifest preserves var default fields but walks schema structure', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
vars:
  components:
    type: object
    properties:
      detail:
        default:
          _ref: defaults/detail.yaml
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

  const varDefs = context.modules['my-mod'].varDefs;
  // Schema structure is walked (type, properties resolved)
  expect(varDefs.components.type).toBe('object');
  expect(varDefs.components.properties.detail).toBeDefined();
  // Default values are preserved — _ref NOT resolved during Phase 1a
  expect(varDefs.components.properties.detail.default).toEqual({
    _ref: 'defaults/detail.yaml',
  });
});

test('resolveLocalManifest does not throw for required var with default', async () => {
  const context = createTestContext();
  const files = [
    {
      path: '/modules/my-mod/module.lowdefy.yaml',
      content: `
vars:
  theme:
    required: true
    default: light
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

  expect(context.modules['my-mod']).toBeDefined();
});

test('validateRequiredVars throws for undeclared namespace property', () => {
  const varDefs = {
    ui: {
      type: 'object',
      properties: {
        theme: { type: 'string' },
      },
    },
  };

  expect(() =>
    validateRequiredVars(
      varDefs,
      { ui: { theme: 'dark', color: 'blue' } },
      'my-mod',
      'file:../mod'
    )
  ).toThrow('undeclared property "color"');
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

describe('operator-generated components sections', () => {
  const resolveLocal = async (context, manifestContent) => {
    const files = [
      { path: '/modules/team-users/module.lowdefy.yaml', content: manifestContent },
    ];
    mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
    return resolveLocalManifest({
      entry: { id: 'team-users', source: 'file:../modules/team-users', vars: {} },
      resolvedPaths: {
        packageRoot: '/modules/team-users',
        moduleRoot: '/modules/team-users',
        isLocal: true,
      },
      context,
    });
  };

  test('throws when the components value is an operator whose content uses _var', async () => {
    const context = createTestContext();
    await expect(
      resolveLocal(
        context,
        `
components:
  _build.array.map:
    on: [a, b]
    map:
      id: { _var: item }
      component: { type: Box }
`
      )
    ).rejects.toThrow(
      'Module "team-users": _var inside an operator-generated components section ' +
        'cannot resolve per consumer. Found "_build.array.map" at "components" with a _var'
    );
  });

  test('throws when a components array element is an operator whose content uses _var', async () => {
    const context = createTestContext();
    await expect(
      resolveLocal(
        context,
        `
components:
  - id: static-one
    component: { type: Box }
  - _build.if:
      test: true
      then:
        id: dyn
        component:
          type: Box
          properties: { content: { _var: text } }
`
      )
    ).rejects.toThrow(
      'Module "team-users": _var inside an operator-generated components section ' +
        'cannot resolve per consumer. Found "_build.if" at "components.1" with a _var'
    );
  });

  test('allows var-free operator-composed components sections (fixture 81 contract)', async () => {
    const context = createTestContext();
    await resolveLocal(
      context,
      `
components:
  _build.array.concat:
    - - id: inline-one
        component: { type: Box }
    - - id: inline-two
        component: { type: Title }
`
    );
    expect(context.errors).toEqual([]);
    const components = context.modules['team-users'].manifest.components;
    expect(components.map((c) => c.id)).toEqual(['inline-one', 'inline-two']);
  });

  test('allows _var inside a preserved body at components.<i>.component', async () => {
    const context = createTestContext();
    await resolveLocal(
      context,
      `
components:
  - id: dynamic-body
    component:
      type: Box
      blocks:
        - _var: content
`
    );
    // Body record-ified raw — the _var survives un-resolved for per-consumer resolution.
    expect(context.modules['team-users'].manifest.components[0].component).toEqual({
      '~deferred': 'team-users:components.0.component',
    });
    const record = getRecord(context, 'team-users:components.0.component');
    expect(record.body.blocks[0]).toEqual({ _var: 'content' });
  });

  test('allows components section composed via _ref', async () => {
    const context = createTestContext();
    const files = [
      {
        path: '/modules/team-users/module.lowdefy.yaml',
        content: `
components:
  _ref: components.yaml
`,
      },
      {
        path: '/modules/team-users/components.yaml',
        content: `
- id: from-file
  component: { type: Box }
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
    expect(context.modules['team-users'].manifest.components[0].id).toBe('from-file');
    const record = getRecord(context, 'team-users:components.0.component');
    expect(record.body).toEqual({ type: 'Box' });
    // The record env names the ref'd file the body came from.
    expect(record.env.file).toBe('/modules/team-users/components.yaml');
  });
});
