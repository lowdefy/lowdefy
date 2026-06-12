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

import writePages from './writePages.js';
import testContext from '../../test-utils/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writePages write page', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        blockId: 'page1',
        requests: [],
      },
    ],
  };
  await writePages({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['pages/page1.json', '{"id":"page:page1","pageId":"page1","blockId":"page1","requests":[]}'],
    ['pageRegistry.mjs', 'export default {\n\n};\n'],
  ]);
});

test('writePages public page emits data + types modules and a registry entry', async () => {
  const components = {
    types: { blocks: {}, actions: {}, operators: { client: {} } },
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        blockId: 'page1',
        auth: { public: true },
        requests: [],
      },
    ],
  };
  await writePages({
    components,
    context: {
      ...context,
      typesMap: { icons: {} },
      directories: { server: process.cwd() },
    },
  });
  const calls = mockWriteBuildArtifact.mock.calls;
  expect(calls.map(([p]) => p)).toEqual([
    'pages/page1.json',
    'pages/page1.mjs',
    'pages/page1.types.mjs',
    'pageRegistry.mjs',
  ]);
  expect(calls[3][1]).toContain('import("./pages/page1.mjs")');
  expect(calls[3][1]).toContain('import("./pages/page1.types.mjs")');
});

test('writePages protected page emits no data module and no registry entry', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        blockId: 'page1',
        auth: { public: false },
        requests: [],
      },
    ],
  };
  await writePages({ components, context });
  const calls = mockWriteBuildArtifact.mock.calls;
  expect(calls.map(([p]) => p)).toEqual(['pages/page1.json', 'pageRegistry.mjs']);
  expect(calls[1][1]).toBe('export default {\n\n};\n');
});

test('writePages multiple pages', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        blockId: 'page1',
        requests: [],
      },
      {
        id: 'page:page2',
        pageId: 'page2',
        blockId: 'page2',
        requests: [],
      },
    ],
  };
  await writePages({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['pages/page1.json', '{"id":"page:page1","pageId":"page1","blockId":"page1","requests":[]}'],
    ['pages/page2.json', '{"id":"page:page2","pageId":"page2","blockId":"page2","requests":[]}'],
    ['pageRegistry.mjs', 'export default {\n\n};\n'],
  ]);
});

test('writePages no pages still writes an empty registry', async () => {
  const components = {
    pages: [],
  };
  await writePages({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['pageRegistry.mjs', 'export default {\n\n};\n'],
  ]);
});
