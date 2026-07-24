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

// Meta fixtures keyed by package, mirroring how each package's `/metas` entry
// exposes a named export per block type. `static: true` marks a report renderer.
const metasByPackage = {
  '@lowdefy/blocks-echarts': {
    EChart: { static: true, category: 'display' },
  },
  '@lowdefy/blocks-antd': {
    Title: { static: true, category: 'display' },
    Button: { category: 'input' },
  },
};

const mockImportPluginModule = jest.fn(async ({ specifier }) => {
  const packageName = specifier.replace(/\/metas$/, '');
  return metasByPackage[packageName];
});

jest.unstable_mockModule('./importPluginModule.js', () => ({
  default: mockImportPluginModule,
}));

const { default: writeBlockStaticImports } = await import('./writeBlockStaticImports.js');

const mockWriteBuildArtifact = jest.fn();

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
  mockImportPluginModule.mockClear();
});

function createContext() {
  return { writeBuildArtifact: mockWriteBuildArtifact };
}

test('emits only static block types, importing renderers from the package /static entry', async () => {
  const components = {
    imports: {
      blocks: [
        { package: '@lowdefy/blocks-echarts', typeName: 'EChart', originalTypeName: 'EChart' },
        { package: '@lowdefy/blocks-antd', typeName: 'Title', originalTypeName: 'Title' },
        { package: '@lowdefy/blocks-antd', typeName: 'Button', originalTypeName: 'Button' },
      ],
    },
  };
  await writeBlockStaticImports({ components, context: createContext() });
  const [filePath, content] = mockWriteBuildArtifact.mock.calls[0];
  expect(filePath).toBe('plugins/blocksStatic.js');
  expect(content).toContain("import { EChart as EChart } from '@lowdefy/blocks-echarts/static';");
  expect(content).toContain("import { Title as Title } from '@lowdefy/blocks-antd/static';");
  // Button has no static meta — no import for it.
  expect(content).not.toContain('Button');
  expect(content).toContain('export default {');
});

test('emits an empty registry when no block declares static', async () => {
  const components = {
    imports: {
      blocks: [
        { package: '@lowdefy/blocks-antd', typeName: 'Button', originalTypeName: 'Button' },
      ],
    },
  };
  await writeBlockStaticImports({ components, context: createContext() });
  const [filePath, content] = mockWriteBuildArtifact.mock.calls[0];
  expect(filePath).toBe('plugins/blocksStatic.js');
  expect(content).not.toContain('import');
  expect(content).toContain('export default {');
});

test('emits an empty registry when there are no blocks', async () => {
  const components = { imports: { blocks: [] } };
  await writeBlockStaticImports({ components, context: createContext() });
  const [, content] = mockWriteBuildArtifact.mock.calls[0];
  expect(content).not.toContain('import');
  expect(content).toContain('export default {');
});

test('registry is keyed by typeName, importing the originalTypeName member', async () => {
  metasByPackage['custom-plugin'] = { Chart: { static: true } };
  const components = {
    imports: {
      blocks: [
        { package: 'custom-plugin', typeName: 'MyChart', originalTypeName: 'Chart' },
      ],
    },
  };
  await writeBlockStaticImports({ components, context: createContext() });
  const [, content] = mockWriteBuildArtifact.mock.calls[0];
  expect(content).toContain("import { Chart as MyChart } from 'custom-plugin/static';");
  expect(content).toContain('MyChart,');
  delete metasByPackage['custom-plugin'];
});

test('skips packages whose metas do not resolve', async () => {
  const components = {
    imports: {
      blocks: [
        { package: 'non-existent-package', typeName: 'FakeBlock', originalTypeName: 'FakeBlock' },
      ],
    },
  };
  await writeBlockStaticImports({ components, context: createContext() });
  const [, content] = mockWriteBuildArtifact.mock.calls[0];
  expect(content).not.toContain('import');
  expect(content).toContain('export default {');
});
