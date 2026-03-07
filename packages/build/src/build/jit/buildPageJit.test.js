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

import testContext from '../../test-utils/testContext.js';
import { snapshotTypesMap } from '../../test-utils/runBuildForSnapshots.js';
import makeId from '../../utils/makeId.js';
import buildPageJit from './buildPageJit.js';

const mockReadConfigFile = jest.fn();
const mockWriteBuildArtifact = jest.fn();

function createTestContext() {
  const context = testContext({
    readConfigFile: mockReadConfigFile,
    writeBuildArtifact: mockWriteBuildArtifact,
  });
  context.errors = [];
  context.typesMap = snapshotTypesMap;
  context.unresolvedRefVars = {};
  return context;
}

function mockFiles(files) {
  mockReadConfigFile.mockImplementation((filePath) => {
    const file = files.find((f) => f.path === filePath);
    return file ? file.content : null;
  });
}

beforeEach(() => {
  makeId.reset();
  mockReadConfigFile.mockReset();
  mockWriteBuildArtifact.mockReset();
  mockWriteBuildArtifact.mockResolvedValue(undefined);
});

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
  mockFiles([
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
  mockFiles([
    {
      path: 'template.yaml.njk',
      content: `
id: {{ pageId }}
type: PageHeaderMenu
properties:
  title: {{ title }}
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
        refPath: 'template.yaml.njk',
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

  // The unresolved vars contain a _ref that should be resolved fresh from disk.
  // makeRefDefinition normalizes _ref objects during skeleton build, giving them
  // an id, path, etc. JIT ignores old IDs and re-resolves via getRefsFromFile.
  mockFiles([
    {
      path: 'template.yaml.njk',
      content: `
id: {{ pageId }}
type: PageHeaderMenu
areas:
  content:
    blocks:
      {{ sidebar | dump | safe }}
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
        refPath: 'template.yaml.njk',
        // Unresolved vars with an inner _ref — this is what recursiveBuild
        // needs to resolve fresh from disk on each JIT build.
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
  // The sidebar var should have been resolved from components/sidebar.yaml
  const contentBlocks = result.slots?.content?.blocks ?? [];
  expect(contentBlocks).toHaveLength(1);
  expect(contentBlocks[0].blockId).toBe('sidebar_title');
  expect(contentBlocks[0].type).toBe('Title');
});

test('buildPageJit resolves vars with inner _ref and picks up file changes', async () => {
  const context = createTestContext();

  // First build: sidebar has one block
  mockFiles([
    {
      path: 'template.yaml.njk',
      content: `
id: {{ pageId }}
type: PageHeaderMenu
areas:
  content:
    blocks:
      {{ sidebar | dump | safe }}
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
    refPath: 'template.yaml.njk',
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
  makeId.reset();
  context.errors = [];
  context.typeCounters.blocks = (await import('../../utils/createCounter.js')).default();
  context.typeCounters.actions = (await import('../../utils/createCounter.js')).default();

  mockFiles([
    {
      path: 'template.yaml.njk',
      content: `
id: {{ pageId }}
type: PageHeaderMenu
areas:
  content:
    blocks:
      {{ sidebar | dump | safe }}
`,
    },
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
  mockFiles([
    {
      path: 'template.yaml.njk',
      content: `
id: {{ pageId }}
type: PageHeaderMenu
areas:
  content:
    blocks:
      {{ blocks | dump | safe }}
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
        refPath: 'template.yaml.njk',
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
  mockFiles([]);

  // No vars key on resolverOriginal — resolvedVars stays null,
  // so resolverOriginal is passed through as-is to makeRefDefinition.
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
          resolver: 'src/test-utils/buildRefs/testJitPageResolver.js',
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
  // Resolver receives empty vars (makeRefDefinition default), falls back to defaults
  expect(result.properties.title).toBe('Default');
});

test('buildPageJit resolves resolver page by re-running the resolver with fresh vars', async () => {
  const context = createTestContext();
  mockFiles([
    {
      path: 'config.yaml',
      content: `MyApp`,
    },
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
          resolver: 'src/test-utils/buildRefs/testJitPageResolver.js',
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

  // First build: config.yaml has 'AppV1'
  mockFiles([
    {
      path: 'config.yaml',
      content: `AppV1`,
    },
  ]);

  const pageEntry = {
    pageId: 'home',
    auth: { public: true },
    refId: 'ref-resolver',
    refPath: null,
    unresolvedVars: null,
    resolverOriginal: {
      resolver: 'src/test-utils/buildRefs/testJitPageResolver.js',
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
  makeId.reset();
  context.errors = [];
  context.typeCounters.blocks = (await import('../../utils/createCounter.js')).default();
  context.typeCounters.actions = (await import('../../utils/createCounter.js')).default();

  mockFiles([
    {
      path: 'config.yaml',
      content: `AppV2`,
    },
  ]);

  const result2 = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });
  expect(result2.properties.title).toBe('AppV2');
});

test('buildPageJit throws when inner _ref in vars references missing file', async () => {
  const context = createTestContext();
  mockFiles([
    {
      path: 'template.yaml.njk',
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
        refPath: 'template.yaml.njk',
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
  ).rejects.toThrow('Referenced file does not exist: "components/missing.yaml"');
});

test('buildPageJit resolver page traces errors back to resolver when inner _ref fails', async () => {
  const context = createTestContext();
  mockFiles([]);

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
          resolver: 'src/test-utils/buildRefs/testJitPageResolver.js',
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
  ).rejects.toMatchObject({
    message: expect.stringContaining('Referenced file does not exist: "config/missing.yaml"'),
    filePath: 'src/test-utils/buildRefs/testJitPageResolver.js',
  });
});

test('two JIT builds with object vars produce identical results and do not mutate unresolvedVars', async () => {
  const context = createTestContext();
  mockFiles([
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

  // First build
  const result1 = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });

  const contentBlocks1 = result1.areas?.content?.blocks ?? [];
  expect(contentBlocks1).toHaveLength(1);
  expect(contentBlocks1[0].blockId).toBe('h1');

  // Verify unresolvedVars not mutated after first build
  expect(pageEntry.unresolvedVars.header).toEqual({ _ref: 'header.yaml' });

  // Reset for second build
  makeId.reset();
  context.errors = [];
  context.typeCounters.blocks = (await import('../../utils/createCounter.js')).default();
  context.typeCounters.actions = (await import('../../utils/createCounter.js')).default();

  // Second build
  const result2 = await buildPageJit({
    pageId: 'home',
    pageRegistry,
    context,
  });

  const contentBlocks2 = result2.areas?.content?.blocks ?? [];
  expect(contentBlocks2).toHaveLength(1);
  expect(contentBlocks2[0].blockId).toBe('h1');

  // Both builds produce structurally identical results
  expect(contentBlocks1[0].blockId).toBe(contentBlocks2[0].blockId);

  // unresolvedVars still not mutated
  expect(pageEntry.unresolvedVars.header).toEqual({ _ref: 'header.yaml' });
});
