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

// Full S4 (E3): JIT page builds re-run compiled factories from a fresh
// per-build graph — these tests write real config files (the compiler reads
// sources from disk) and assert the same behavioral contract the walker
// path had: fresh vars resolution, file-change pickup, resolver re-runs,
// error collection, keyMap population, icons, and CallAPI validation.
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { default: testContext } = await import('../../test-utils/testContext.js');
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');
const { default: makeId } = await import('../../utils/makeId.js');
const { default: createCounter } = await import('../../utils/createCounter.js');
const { default: buildPageJit } = await import('./buildPageJit.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '../../..');
const tmpRoot = path.join(pkgRoot, '.tmp-jit', `worker-${process.pid}`);
const TEST_RESOLVER = path.join(pkgRoot, 'src/test-utils/buildRefs/testJitPageResolver.js');

const mockWriteBuildArtifact = jest.fn();
let configDir;

function createTestContext() {
  const context = testContext({
    configDirectory: configDir,
    readConfigFile: (refPath) => {
      try {
        return fs.readFileSync(path.resolve(configDir, refPath), 'utf8');
      } catch {
        return null;
      }
    },
    writeBuildArtifact: mockWriteBuildArtifact,
  });
  context.directories.build = path.join(configDir, '.lowdefy');
  context.errors = [];
  context.typesMap = snapshotTypesMap;
  context.unresolvedRefVars = {};
  return context;
}

function writeFiles(files) {
  for (const file of files) {
    const target = path.join(configDir, file.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.content);
  }
}

beforeEach(() => {
  fs.mkdirSync(tmpRoot, { recursive: true });
  configDir = fs.mkdtempSync(path.join(tmpRoot, 'case-'));
  makeId.reset();
  mockWriteBuildArtifact.mockReset();
  mockWriteBuildArtifact.mockResolvedValue(undefined);
});

afterAll(() => {
  fs.rmSync(path.join(pkgRoot, '.tmp-jit'), { recursive: true, force: true });
});

function resetForRebuild(context) {
  makeId.reset();
  context.errors = [];
  context.typeCounters.blocks = createCounter();
  context.typeCounters.actions = createCounter();
}

test('buildPageJit returns null for unknown pageId', async () => {
  const context = createTestContext();
  const pageRegistry = new Map();
  const result = await buildPageJit({
    pageId: 'unknown',
    pageRegistry,
    context,
  });
  expect(result).toBeNull();
});

test('buildPageJit resolves simple page without vars', async () => {
  const context = createTestContext();
  writeFiles([
    {
      path: 'home.yaml',
      content: `
id: home
type: PageHeaderMenu
`,
    },
  ]);

  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-home',
        refPath: 'home.yaml',
        unresolvedVars: null,
      },
    ],
  ]);

  const result = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });

  expect(result.id).toBe('page:home');
  expect(result.auth).toEqual(expect.objectContaining({ public: true }));
  expect(result.type).toBe('PageHeaderMenu');
});

test('buildPageJit resolves page template with simple vars', async () => {
  const context = createTestContext();
  writeFiles([
    {
      path: 'template.yaml',
      content: `
id:
  _var: pageId
type: PageHeaderMenu
properties:
  title:
    _var: title
`,
    },
  ]);

  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-layout',
        refPath: 'template.yaml',
        unresolvedVars: { pageId: 'home', title: 'Home Page' },
      },
    ],
  ]);

  const result = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });

  expect(result.id).toBe('page:home');
  expect(result.type).toBe('PageHeaderMenu');
  expect(result.properties.title).toBe('Home Page');
});

test('buildPageJit resolves vars containing inner _ref from disk', async () => {
  const context = createTestContext();
  writeFiles([
    {
      path: 'template.yaml',
      content: `
id:
  _var: pageId
type: PageHeaderMenu
areas:
  content:
    blocks:
      _var: sidebar
`,
    },
    {
      path: 'components/sidebar.yaml',
      content: `
- id: sidebar_title
  type: Title
  properties:
    content: Sidebar
`,
    },
  ]);

  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-layout',
        refPath: 'template.yaml',
        // Unresolved vars with an inner _ref — resolved fresh from disk on
        // each JIT build.
        unresolvedVars: {
          pageId: 'home',
          sidebar: { _ref: 'components/sidebar.yaml' },
        },
      },
    ],
  ]);

  const result = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });

  expect(result.id).toBe('page:home');
  expect(result.type).toBe('PageHeaderMenu');
  const contentBlocks = result.slots?.content?.blocks ?? [];
  expect(contentBlocks).toHaveLength(1);
  expect(contentBlocks[0].blockId).toBe('sidebar_title');
  expect(contentBlocks[0].type).toBe('Title');
});

test('buildPageJit resolves vars with inner _ref and picks up file changes', async () => {
  const context = createTestContext();
  writeFiles([
    {
      path: 'template.yaml',
      content: `
id:
  _var: pageId
type: PageHeaderMenu
areas:
  content:
    blocks:
      _var: sidebar
`,
    },
    {
      path: 'components/sidebar.yaml',
      content: `
- id: sidebar_v1
  type: Title
  properties:
    content: Version 1
`,
    },
  ]);

  const pageEntry = {
    pageId: 'home',
    auth: { public: true },
    refId: 'ref-layout',
    refPath: 'template.yaml',
    unresolvedVars: {
      pageId: 'home',
      sidebar: { _ref: 'components/sidebar.yaml' },
    },
  };
  const pageRegistry = new Map([['home', pageEntry]]);

  const result1 = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });
  const contentBlocks1 = result1.slots?.content?.blocks ?? [];
  expect(contentBlocks1[0].blockId).toBe('sidebar_v1');

  // Second build: sidebar file changed on disk
  resetForRebuild(context);
  writeFiles([
    {
      path: 'components/sidebar.yaml',
      content: `
- id: sidebar_v2
  type: Title
  properties:
    content: Version 2
`,
    },
  ]);

  const result2 = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });
  const contentBlocks2 = result2.slots?.content?.blocks ?? [];
  expect(contentBlocks2[0].blockId).toBe('sidebar_v2');
});

test('buildPageJit evaluates build operators in resolved vars', async () => {
  const context = createTestContext();
  writeFiles([
    {
      path: 'template.yaml',
      content: `
id:
  _var: pageId
type: PageHeaderMenu
areas:
  content:
    blocks:
      _var: blocks
`,
    },
    {
      path: 'components/block1.yaml',
      content: `
id: block1
type: TextInput
`,
    },
    {
      path: 'components/block2.yaml',
      content: `
id: block2
type: TextInput
`,
    },
  ]);

  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-layout',
        refPath: 'template.yaml',
        // Vars with a _build operator that concatenates two ref-resolved arrays
        unresolvedVars: {
          pageId: 'home',
          blocks: {
            '_build.array.concat': [
              [{ _ref: 'components/block1.yaml' }],
              [{ _ref: 'components/block2.yaml' }],
            ],
          },
        },
      },
    ],
  ]);

  const result = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });

  expect(result.id).toBe('page:home');
  const contentBlocks = result.slots?.content?.blocks ?? [];
  expect(contentBlocks).toHaveLength(2);
  expect(contentBlocks[0].blockId).toBe('block1');
  expect(contentBlocks[1].blockId).toBe('block2');
});

test('buildPageJit resolves resolver page without vars', async () => {
  const context = createTestContext();
  writeFiles([{ path: 'lowdefy.yaml', content: 'lowdefy: local\n' }]);

  // No vars key on resolverOriginal — the resolver receives empty vars and
  // falls back to defaults.
  const pageRegistry = new Map([
    [
      'resolved-page',
      {
        pageId: 'resolved-page',
        auth: { public: true },
        refId: 'ref-resolver',
        refPath: null,
        unresolvedVars: null,
        resolverOriginal: {
          resolver: TEST_RESOLVER,
          vars: { pageId: 'resolved-page' },
        },
      },
    ],
  ]);

  const result = await buildPageJit({
    pageId: 'resolved-page',
    pageRegistry,
    context,
  });

  expect(result.id).toBe('page:resolved-page');
  expect(result.type).toBe('PageHeaderMenu');
  expect(result.properties.title).toBe('Default');
});

test('buildPageJit resolves resolver page by re-running the resolver with fresh vars', async () => {
  const context = createTestContext();
  writeFiles([
    { path: 'lowdefy.yaml', content: 'lowdefy: local\n' },
    { path: 'config.yaml', content: `MyApp` },
  ]);

  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-resolver',
        refPath: null,
        unresolvedVars: null,
        resolverOriginal: {
          resolver: TEST_RESOLVER,
          vars: {
            pageId: 'home',
            app_name: { _ref: 'config.yaml' },
          },
        },
      },
    ],
  ]);

  const result = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });

  expect(result.id).toBe('page:home');
  expect(result.type).toBe('PageHeaderMenu');
  expect(result.properties.title).toBe('MyApp');
});

test('buildPageJit resolver page picks up config file changes on subsequent JIT builds', async () => {
  const context = createTestContext();
  writeFiles([
    { path: 'lowdefy.yaml', content: 'lowdefy: local\n' },
    { path: 'config.yaml', content: `AppV1` },
  ]);

  const pageEntry = {
    pageId: 'home',
    auth: { public: true },
    refId: 'ref-resolver',
    refPath: null,
    unresolvedVars: null,
    resolverOriginal: {
      resolver: TEST_RESOLVER,
      vars: {
        pageId: 'home',
        app_name: { _ref: 'config.yaml' },
      },
    },
  };
  const pageRegistry = new Map([['home', pageEntry]]);

  const result1 = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });
  expect(result1.properties.title).toBe('AppV1');

  // Second build: config.yaml changed on disk
  resetForRebuild(context);
  writeFiles([{ path: 'config.yaml', content: `AppV2` }]);

  const result2 = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });
  expect(result2.properties.title).toBe('AppV2');
});

test('buildPageJit throws when inner _ref in vars references missing file', async () => {
  const context = createTestContext();
  writeFiles([
    {
      path: 'template.yaml',
      content: `
id: home
type: PageHeaderMenu
`,
    },
  ]);

  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-layout',
        refPath: 'template.yaml',
        unresolvedVars: {
          sidebar: { _ref: 'components/missing.yaml' },
        },
      },
    ],
  ]);

  await expect(
    buildPageJit({
      pageId: 'home',
      pageRegistry,
      context,
    })
  ).rejects.toThrow('Page "home" build failed with 1 error(s).');

  // Verify the underlying error is preserved in buildErrors
  try {
    await buildPageJit({ pageId: 'home', pageRegistry, context });
  } catch (err) {
    expect(err.buildErrors[0].message).toMatch(
      'Referenced file does not exist: "components/missing.yaml"'
    );
  }
});

test('buildPageJit resolver page traces errors back to resolver when inner _ref fails', async () => {
  const context = createTestContext();
  writeFiles([{ path: 'lowdefy.yaml', content: 'lowdefy: local\n' }]);

  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-resolver',
        refPath: null,
        unresolvedVars: null,
        resolverOriginal: {
          resolver: TEST_RESOLVER,
          vars: {
            app_name: { _ref: 'config/missing.yaml' },
          },
        },
      },
    ],
  ]);

  await expect(
    buildPageJit({
      pageId: 'home',
      pageRegistry,
      context,
    })
  ).rejects.toThrow('Page "home" build failed with 1 error(s).');

  // Verify the underlying error details are preserved
  try {
    await buildPageJit({ pageId: 'home', pageRegistry, context });
  } catch (err) {
    expect(err.buildErrors[0].message).toMatch(
      'Referenced file does not exist: "config/missing.yaml"'
    );
  }
});

test('buildPageJit populates the in-memory keyMap so error handlers resolve correct locations', async () => {
  const context = createTestContext();
  writeFiles([
    {
      path: 'page-with-action.yaml',
      content: `id: action-page
type: PageHeaderMenu
blocks:
  - id: btn1
    type: Button
    events:
      onClick:
        - id: my_action
          type: UndefinedAction
          params:
            message: test`,
    },
  ]);

  const pageEntry = {
    pageId: 'action-page',
    auth: { public: true },
    refId: 'ref-action-page',
    refPath: 'page-with-action.yaml',
  };
  const pageRegistry = new Map([['action-page', pageEntry]]);

  await expect(
    buildPageJit({
      pageId: 'action-page',
      pageRegistry,
      context,
    })
  ).rejects.toMatchObject({
    message: expect.stringContaining('Action type "UndefinedAction" was used but is not defined'),
  });

  // keyMap/refMap are no longer written per JIT build — the dev server reads
  // them from the shared in-memory build context. The context keyMap must
  // contain the action's ~k entry with the correct source line so error
  // handlers can resolve the location.
  const writeArgs = mockWriteBuildArtifact.mock.calls.map((c) => c[0]);
  expect(writeArgs).not.toContain('keyMap.json');
  expect(writeArgs).not.toContain('refMap.json');

  // Find the entry for the UndefinedAction (line 8 in the YAML: the action map)
  const actionEntry = Object.values(context.keyMap).find(
    (entry) => entry.key && entry.key.includes('UndefinedAction')
  );
  expect(actionEntry).toBeDefined();
  expect(actionEntry['~l']).toBe(8);
});

test('two JIT builds with object vars produce identical results and do not mutate unresolvedVars', async () => {
  const context = createTestContext();
  writeFiles([
    {
      path: 'page-template.yaml',
      content: `
id: home
type: PageHeaderMenu
areas:
  content:
    blocks:
      _var: header`,
    },
    {
      path: 'header.yaml',
      content: `
- id: h1
  type: Title`,
    },
  ]);

  const pageEntry = {
    pageId: 'home',
    auth: { public: true },
    refId: 'ref-home',
    refPath: 'page-template.yaml',
    unresolvedVars: { header: { _ref: 'header.yaml' } },
  };
  const pageRegistry = new Map([['home', pageEntry]]);

  const result1 = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });

  const contentBlocks1 = result1.slots?.content?.blocks ?? [];
  expect(contentBlocks1).toHaveLength(1);
  expect(contentBlocks1[0].blockId).toBe('h1');

  // Verify unresolvedVars not mutated after first build
  expect(pageEntry.unresolvedVars.header).toEqual({ _ref: 'header.yaml' });

  resetForRebuild(context);

  const result2 = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });

  const contentBlocks2 = result2.slots?.content?.blocks ?? [];
  expect(contentBlocks2).toHaveLength(1);
  expect(contentBlocks2[0].blockId).toBe('h1');

  // Both builds produce structurally identical results
  expect(contentBlocks1[0].blockId).toBe(contentBlocks2[0].blockId);

  // unresolvedVars still not mutated
  expect(pageEntry.unresolvedVars.header).toEqual({ _ref: 'header.yaml' });
});

// Icon detection tests
// Note: existing tests above implicitly cover the !iconImports guard path
// since they do not set context.iconImports.

test('buildPageJit detects missing icons and writes dynamic icon data', async () => {
  const context = createTestContext();
  // Set up iconImports with no IoAddCircle — simulating shallow build that missed it
  context.iconImports = [
    { icons: [], package: 'react-icons/ai' },
    { icons: [], package: 'react-icons/io5' },
  ];
  context.dynamicIconData = {};
  context.directories.server = path.join(configDir, 'server');

  writeFiles([
    {
      path: 'home.yaml',
      content: `
id: home
type: PageHeaderMenu
blocks:
  - id: action_button
    type: Button
    properties:
      title: Do Something
      icon: IoAddCircle
`,
    },
  ]);

  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-home',
        refPath: 'home.yaml',
        unresolvedVars: null,
      },
    ],
  ]);

  const result = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });

  expect(result.id).toBe('page:home');
  const io5Entry = context.iconImports.find((i) => i.package === 'react-icons/io5');
  expect(io5Entry.icons).toContain('IoAddCircle');
  const iconDynamicCall = mockWriteBuildArtifact.mock.calls.find(
    (c) => c[0] === 'plugins/iconsDynamic.js'
  );
  expect(iconDynamicCall).toBeDefined();
});

test('buildPageJit does not write dynamic icons when all icons already present', async () => {
  const context = createTestContext();
  context.iconImports = [{ icons: ['AiFillHome'], package: 'react-icons/ai' }];
  context.dynamicIconData = {};

  writeFiles([
    {
      path: 'home.yaml',
      content: `
id: home
type: PageHeaderMenu
blocks:
  - id: btn
    type: Button
    properties:
      title: Home
      icon: AiFillHome
`,
    },
  ]);

  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-home',
        refPath: 'home.yaml',
        unresolvedVars: null,
      },
    ],
  ]);

  await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });

  // plugins/iconsDynamic.js should NOT have been written
  const iconDynamicCall = mockWriteBuildArtifact.mock.calls.find(
    (c) => c[0] === 'plugins/iconsDynamic.js'
  );
  expect(iconDynamicCall).toBeUndefined();
});

// CallAPI endpoint reference validation (validateCallApiRefs) in the JIT path.
// The dev server hydrates context.components.api from build/api/*.json before building
// a page (see getBuildContext + readBuildApiArtifacts). These tests assert that, given
// that hydrated context, a valid CallAPI endpointId does NOT produce a false warning,
// while a genuinely missing endpointId still does.
function createTestContextWithApi(api) {
  const context = createTestContext();
  context.components = { api };
  context.typesMap = {
    ...snapshotTypesMap,
    actions: {
      ...snapshotTypesMap.actions,
      CallAPI: { package: '@lowdefy/actions-core' },
    },
  };
  return context;
}

const callApiPageYaml = `
id: home
type: PageHeaderMenu
blocks:
  - id: btn
    type: Button
    events:
      onClick:
        - id: call_endpoint
          type: CallAPI
          params:
            endpointId: my_endpoint
`;

function callApiPageRegistry() {
  return new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-home',
        refPath: 'home.yaml',
        unresolvedVars: null,
      },
    ],
  ]);
}

test('buildPageJit does not warn for a CallAPI action when the endpoint exists in components.api', async () => {
  const context = createTestContextWithApi([{ endpointId: 'my_endpoint', type: 'Api' }]);
  const warnings = [];
  context.handleWarning = (warning) => warnings.push(warning);

  writeFiles([{ path: 'home.yaml', content: callApiPageYaml }]);

  const result = await buildPageJit({
    pageId: 'home',
    pageRegistry: callApiPageRegistry(),
    context,
  });

  expect(result.id).toBe('page:home');
  expect(warnings.find((w) => w.message.includes('non-existent endpoint'))).toBeUndefined();
});

test('buildPageJit warns for a CallAPI action when the endpoint is missing from components.api', async () => {
  const context = createTestContextWithApi([]);
  const warnings = [];
  context.handleWarning = (warning) => warnings.push(warning);

  writeFiles([{ path: 'home.yaml', content: callApiPageYaml }]);

  await buildPageJit({
    pageId: 'home',
    pageRegistry: callApiPageRegistry(),
    context,
  });

  const warning = warnings.find((w) => w.checkSlug === 'callapi-refs');
  expect(warning).toBeDefined();
  expect(warning.message).toBe(
    'CallAPI action on page "home" references non-existent endpoint "my_endpoint".'
  );
});
