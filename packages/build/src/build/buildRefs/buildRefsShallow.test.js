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
});

test('buildRefs with shallowOptions stops resolution at matching paths', async () => {
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
  const res = await buildRefs({
    context,
    shallowOptions: { stopAt: ['pages.0.blocks'] },
  });
  // The blocks ref should be replaced with a shallow marker
  expect(res.pages[0].blocks['~shallow']).toBe(true);
  expect(res.pages[0].blocks._ref).toBe('pages/home/blocks.yaml');
  expect(res.pages[0].blocks._refId).toBeDefined();
  // Non-matching fields should be resolved normally
  expect(res.pages[0].id).toBe('home');
  expect(res.pages[0].type).toBe('PageHeaderMenu');
});

test('buildRefs with shallowOptions resolves refs not matching stop patterns', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
config:
  _ref: config.yaml
pages:
  - id: home
    type: PageHeaderMenu
    blocks:
      _ref: pages/home/blocks.yaml
`,
    },
    {
      path: 'config.yaml',
      content: `theme: dark`,
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
    shallowOptions: { stopAt: ['pages.*.blocks'] },
  });
  // config ref should be fully resolved (doesn't match stop pattern)
  expect(res.config).toEqual({ theme: 'dark' });
  // blocks ref should be shallow
  expect(res.pages[0].blocks['~shallow']).toBe(true);
});

test('buildRefs with shallowOptions stops multiple page content refs', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - id: home
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
    shallowOptions: {
      stopAt: ['pages.*.blocks', 'pages.*.events', 'pages.*.requests'],
    },
  });
  expect(res.pages[0].blocks['~shallow']).toBe(true);
  expect(res.pages[0].events['~shallow']).toBe(true);
  expect(res.pages[0].requests['~shallow']).toBe(true);
});

test('buildRefs with shallowOptions handles multiple pages', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - id: home
    type: PageHeaderMenu
    blocks:
      _ref: pages/home/blocks.yaml
  - id: dashboard
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
    shallowOptions: { stopAt: ['pages.*.blocks'] },
  });
  expect(res.pages[0].blocks['~shallow']).toBe(true);
  expect(res.pages[0].blocks._ref).toBe('pages/home/blocks.yaml');
  expect(res.pages[1].blocks['~shallow']).toBe(true);
  expect(res.pages[1].blocks._ref).toBe('pages/dashboard/blocks.yaml');
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

test('buildRefs with shallowOptions preserves original ref path for object refs', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - id: home
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
    shallowOptions: { stopAt: ['pages.*.blocks'] },
  });
  expect(res.pages[0].blocks['~shallow']).toBe(true);
  // Original ref should be preserved (object form with path and vars)
  expect(res.pages[0].blocks._ref).toEqual({
    path: 'pages/home/blocks.yaml',
    vars: { color: 'blue' },
  });
});

test('buildRefs with empty stopAt resolves all refs', async () => {
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
    shallowOptions: { stopAt: [] },
  });
  // Empty stopAt means nothing is skipped
  expect(res.pages[0].blocks).toEqual([{ id: 'block1' }]);
});

test('buildRefs shallow: _build.array.concat wrapping two refs at stop paths is preserved', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - id: home
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
    shallowOptions: { stopAt: ['pages.*.blocks'] },
  });
  // The operator should be preserved as-is (not evaluated) because its
  // arguments are ~shallow placeholders containing dynamic content.
  expect(res.pages[0].blocks['_build.array.concat']).toBeDefined();
  const args = res.pages[0].blocks['_build.array.concat'];
  expect(args[0]['~shallow']).toBe(true);
  expect(args[1]['~shallow']).toBe(true);
});

test('buildRefs shallow: page id from _build.string.concat evaluates while ~shallow events are preserved', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - id:
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
    shallowOptions: { stopAt: ['pages.*.events'] },
  });
  // Page id should be evaluated (no ~shallow args)
  expect(res.pages[0].id).toBe('page_home');
  // Events should be shallow
  expect(res.pages[0].events['~shallow']).toBe(true);
});

test('buildRefs shallow: static operator wrapping ~shallow content is preserved', async () => {
  const files = [
    {
      path: 'lowdefy.yaml',
      content: `
pages:
  - id: home
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
    shallowOptions: { stopAt: ['pages.*.blocks'] },
  });
  // The _if operator wraps a ~shallow ref in its 'then' branch.
  // After top-level static operator evaluation, the _if should be preserved
  // because its params contain dynamic (~shallow) content.
  expect(res.pages[0].blocks._if).toBeDefined();
  expect(res.pages[0].blocks._if.then['~shallow']).toBe(true);
});
