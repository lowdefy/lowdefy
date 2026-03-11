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
import buildRefs from './buildRefs.js';

const mockReadConfigFile = jest.fn();

const readConfigFileMockImplementation = (files) => {
  const mockImp = (filePath) => {
    const file = files.find((file) => file.path === filePath);
    if (!file) {
      return null;
    }
    return file.content;
  };
  return mockImp;
};

const context = testContext({
  readConfigFile: mockReadConfigFile,
});

beforeEach(() => {
  mockReadConfigFile.mockReset();
  context.refMap = {};
  context.keyMap = {};
  context.errors = [];
  context.typesMap = {
    blocks: { PageHeaderMenu: {}, PageSiderMenu: {}, TextInput: {} },
  };
});

test('buildRefs with shallowOptions deletes page content keys for ref-backed pages', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - _ref: pages/home.yaml
`,
    },
    {
      path: 'pages/home.yaml',
      content: `
id: home
type: PageHeaderMenu
blocks:
  _ref: pages/home/blocks.yaml
`,
    },
    {
      path: 'pages/home/blocks.yaml',
      content: `
- id: block1
  type: TextInput
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({
    context,
    shallowOptions: true,
  });
  // The blocks key should be deleted for ref-backed pages
  expect(res.pages[0].blocks).toBeUndefined();
  // Non-matching fields should be resolved normally
  expect(res.pages[0].id).toBe('home');
  expect(res.pages[0].type).toBe('PageHeaderMenu');
});

test('buildRefs with shallowOptions preserves inline page content', async () => {
  // Pages defined inline in lowdefy.yaml (not via _ref) have no separate source
  // file. Their content must be preserved for buildShallowPages to pre-build.
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - id: home
    type: PageHeaderMenu
    blocks:
      - id: block1
        type: TextInput
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({
    context,
    shallowOptions: true,
  });
  // Inline page content should be preserved
  expect(res.pages[0].id).toBe('home');
  expect(res.pages[0].type).toBe('PageHeaderMenu');
  expect(res.pages[0].blocks).toEqual([{ id: 'block1', type: 'TextInput' }]);
});

test('buildRefs with shallowOptions resolves refs not matching stop patterns', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
config:
  _ref: config.yaml
pages:
  - _ref: pages/home.yaml
`,
    },
    {
      path: 'config.yaml',
      content: `theme: dark`,
    },
    {
      path: 'pages/home.yaml',
      content: `
id: home
type: PageHeaderMenu
blocks:
  _ref: pages/home/blocks.yaml
`,
    },
    {
      path: 'pages/home/blocks.yaml',
      content: `
- id: block1
  type: TextInput
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({
    context,
    shallowOptions: true,
  });
  // config ref should be fully resolved (doesn't match stop pattern)
  expect(res.config).toEqual({ theme: 'dark' });
  // blocks key should be deleted for ref-backed page
  expect(res.pages[0].blocks).toBeUndefined();
});

test('buildRefs with shallowOptions deletes multiple page content keys for ref-backed pages', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - _ref: pages/home.yaml
`,
    },
    {
      path: 'pages/home.yaml',
      content: `
id: home
type: PageHeaderMenu
blocks:
  _ref: pages/home/blocks.yaml
events:
  _ref: pages/home/events.yaml
requests:
  _ref: pages/home/requests.yaml
`,
    },
    {
      path: 'pages/home/blocks.yaml',
      content: `- id: block1`,
    },
    {
      path: 'pages/home/events.yaml',
      content: `onClick: []`,
    },
    {
      path: 'pages/home/requests.yaml',
      content: `- id: req1`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({
    context,
    shallowOptions: true,
  });
  expect(res.pages[0].blocks).toBeUndefined();
  expect(res.pages[0].events).toBeUndefined();
  expect(res.pages[0].requests).toBeUndefined();
});

test('buildRefs with shallowOptions handles multiple ref-backed pages', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - _ref: pages/home.yaml
  - _ref: pages/dashboard.yaml
`,
    },
    {
      path: 'pages/home.yaml',
      content: `
id: home
type: PageHeaderMenu
blocks:
  _ref: pages/home/blocks.yaml
`,
    },
    {
      path: 'pages/dashboard.yaml',
      content: `
id: dashboard
type: PageSiderMenu
blocks:
  _ref: pages/dashboard/blocks.yaml
`,
    },
    {
      path: 'pages/home/blocks.yaml',
      content: `- id: block1`,
    },
    {
      path: 'pages/dashboard/blocks.yaml',
      content: `- id: block2`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({
    context,
    shallowOptions: true,
  });
  expect(res.pages[0].blocks).toBeUndefined();
  expect(res.pages[1].blocks).toBeUndefined();
});

test('buildRefs without shallowOptions resolves all refs normally', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - id: home
    type: PageHeaderMenu
    blocks:
      _ref: pages/home/blocks.yaml
`,
    },
    {
      path: 'pages/home/blocks.yaml',
      content: `
- id: block1
  type: TextInput
`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({ context });
  // Without shallowOptions, blocks should be fully resolved
  expect(res.pages[0].blocks).toEqual([{ id: 'block1', type: 'TextInput' }]);
});

test('buildRefs with shallowOptions deletes ref-backed page content regardless of ref form', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - _ref: pages/home.yaml
`,
    },
    {
      path: 'pages/home.yaml',
      content: `
id: home
type: PageHeaderMenu
blocks:
  _ref:
    path: pages/home/blocks.yaml
    vars:
      color: blue
`,
    },
    {
      path: 'pages/home/blocks.yaml',
      content: `- id: block1`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({
    context,
    shallowOptions: true,
  });
  // blocks key should be deleted for ref-backed page regardless of ref form
  expect(res.pages[0].blocks).toBeUndefined();
});

test('buildRefs without shallowOptions resolves page content refs', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - id: home
    blocks:
      _ref: pages/home/blocks.yaml
`,
    },
    {
      path: 'pages/home/blocks.yaml',
      content: `- id: block1`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({
    context,
  });
  // Without shallowOptions, nothing is skipped
  expect(res.pages[0].blocks).toEqual([{ id: 'block1' }]);
});

test('buildRefs shallow: _build.array.concat wrapping refs at stop path for ref-backed page', async () => {
  // When _build.array.concat wraps refs inside a page content key (blocks),
  // the blocks key is deleted before the walker descends into it.
  // No spurious build errors should be reported.
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - _ref: pages/home.yaml
`,
    },
    {
      path: 'pages/home.yaml',
      content: `
id: home
type: PageHeaderMenu
blocks:
  _build.array.concat:
    - _ref: pages/home/blocks-a.yaml
    - _ref: pages/home/blocks-b.yaml
`,
    },
    {
      path: 'pages/home/blocks-a.yaml',
      content: `- id: blockA`,
    },
    {
      path: 'pages/home/blocks-b.yaml',
      content: `- id: blockB`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({
    context,
    shallowOptions: true,
  });
  // Page stub survives — id and type are what matters for shallow builds
  expect(res.pages[0].id).toBe('home');
  expect(res.pages[0].type).toBe('PageHeaderMenu');
  // blocks key deleted for ref-backed page
  expect(res.pages[0].blocks).toBeUndefined();
  // No build errors
  expect(context.errors).toHaveLength(0);
});

test('buildRefs shallow: page id from _build.string.concat evaluates while ref-backed page content is deleted', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - _ref: pages/home.yaml
`,
    },
    {
      path: 'pages/home.yaml',
      content: `
id:
  _build.string.concat:
    - page
    - _
    - home
type: PageHeaderMenu
events:
  _ref: pages/home/events.yaml
`,
    },
    {
      path: 'pages/home/events.yaml',
      content: `onClick: []`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({
    context,
    shallowOptions: true,
  });
  // Page id should be evaluated (no shallow args)
  expect(res.pages[0].id).toBe('page_home');
  // Events key deleted for ref-backed page
  expect(res.pages[0].events).toBeUndefined();
});

test('buildRefs shallow: _build.array at pages level evaluates when page content is deleted', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  _build.array.concat:
    - _ref: pages/group.yaml
`,
    },
    {
      path: 'pages/group.yaml',
      content: `
- _ref: pages/home.yaml
- _ref: pages/settings.yaml
`,
    },
    {
      path: 'pages/home.yaml',
      content: `
id: home
type: PageHeaderMenu
blocks:
  _ref: pages/home/blocks.yaml
`,
    },
    {
      path: 'pages/settings.yaml',
      content: `
id: settings
type: PageSiderMenu
blocks:
  _ref: pages/settings/blocks.yaml
`,
    },
    {
      path: 'pages/home/blocks.yaml',
      content: `- id: block1`,
    },
    {
      path: 'pages/settings/blocks.yaml',
      content: `- id: block2`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({
    context,
    shallowOptions: true,
  });
  // _build.array.concat at pages level must evaluate — pages must be an array.
  expect(Array.isArray(res.pages)).toBe(true);
  expect(res.pages).toHaveLength(2);
  expect(res.pages[0].id).toBe('home');
  expect(res.pages[1].id).toBe('settings');
  // Page content keys should be deleted
  expect(res.pages[0].blocks).toBeUndefined();
  expect(res.pages[1].blocks).toBeUndefined();
});

test('buildRefs shallow: static operator wrapping ref at stop path for ref-backed page', async () => {
  // When a static operator (_if) wraps a ref inside a ref-backed page content (blocks),
  // the blocks key is deleted before the walker descends. Only id/type matter.
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - _ref: pages/home.yaml
`,
    },
    {
      path: 'pages/home.yaml',
      content: `
id: home
type: PageHeaderMenu
blocks:
  _if:
    test: true
    then:
      _ref: pages/home/blocks.yaml
    else: []
`,
    },
    {
      path: 'pages/home/blocks.yaml',
      content: `- id: block1`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  const res = await buildRefs({
    context,
    shallowOptions: true,
  });
  expect(res.pages[0].id).toBe('home');
  expect(res.pages[0].type).toBe('PageHeaderMenu');
  // blocks key deleted for ref-backed page
  expect(res.pages[0].blocks).toBeUndefined();
});

test('buildRefs shallow: unresolvedRefVars preserves blocks keys inside vars that resolve under pages path', async () => {
  // Regression: when a page _ref has vars containing a _ref that resolves
  // to content with "blocks" keys, shouldStop must not strip those keys
  // from the stored unresolved vars. JIT needs them to re-resolve the page.
  context.unresolvedRefVars = {};
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - _ref:
      path: template.yaml
      vars:
        component:
          _ref: component.yaml`,
    },
    {
      path: 'component.yaml',
      content: `
id: wrapper
type: GoogleAPIProvider
blocks:
  - id: map
    type: GoogleMaps`,
    },
    {
      path: 'template.yaml',
      content: `
id: my-page
type: PageHeaderMenu`,
    },
  ];
  mockReadConfigFile.mockImplementation(readConfigFileMockImplementation(files));
  await buildRefs({
    context,
    shallowOptions: true,
  });
  const varsEntries = Object.values(context.unresolvedRefVars);
  expect(varsEntries.length).toBeGreaterThan(0);
  // The unresolved vars should contain the original _ref, not resolved content
  // with blocks stripped by shouldStop.
  expect(varsEntries[0].component).toEqual({ _ref: 'component.yaml' });
});
