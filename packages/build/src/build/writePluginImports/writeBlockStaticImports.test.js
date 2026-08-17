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

const mockImportPluginModule = jest.fn();

jest.unstable_mockModule('./importPluginModule.js', () => ({
  default: mockImportPluginModule,
}));

let writeBlockStaticImports;

beforeAll(async () => {
  writeBlockStaticImports = (await import('./writeBlockStaticImports.js')).default;
});

beforeEach(() => {
  mockImportPluginModule.mockReset();
});

function createContext() {
  return {
    directories: { build: '/app/build', server: '/app' },
    plugins: [{ name: '@lowdefy/plugin-reports', version: '5.4.0' }],
    writeBuildArtifact: jest.fn(),
  };
}

test('writes an empty registry when no used block declares static support', async () => {
  const context = createContext();
  mockImportPluginModule.mockResolvedValue({
    Box: { category: 'container' },
    TextInput: { category: 'input' },
  });
  await writeBlockStaticImports({
    components: {
      imports: {
        blocks: [
          { typeName: 'Box', originalTypeName: 'Box', package: '@lowdefy/blocks-basic' },
          { typeName: 'TextInput', originalTypeName: 'TextInput', package: '@lowdefy/blocks-antd' },
        ],
      },
    },
    context,
  });

  const [filePath, content] = context.writeBuildArtifact.mock.calls[0];
  expect(filePath).toBe('plugins/blocksStatic.js');
  expect(content).toContain('export default {');
  expect(content).not.toContain('/static');
});

test('imports only the used blocks whose meta declares static: true', async () => {
  const context = createContext();
  mockImportPluginModule.mockImplementation(async ({ specifier }) => {
    if (specifier === '@lowdefy/blocks-basic/metas') {
      return { Icon: { category: 'display', static: true }, Box: { category: 'container' } };
    }
    if (specifier === '@lowdefy/blocks-echarts/metas') {
      return { EChart: { category: 'display', static: true } };
    }
    return undefined;
  });

  await writeBlockStaticImports({
    components: {
      imports: {
        blocks: [
          { typeName: 'Icon', originalTypeName: 'Icon', package: '@lowdefy/blocks-basic' },
          { typeName: 'Box', originalTypeName: 'Box', package: '@lowdefy/blocks-basic' },
          { typeName: 'EChart', originalTypeName: 'EChart', package: '@lowdefy/blocks-echarts' },
        ],
      },
    },
    context,
  });

  const content = context.writeBuildArtifact.mock.calls[0][1];
  expect(content).toContain("import { Icon as Icon } from '@lowdefy/blocks-basic/static';");
  expect(content).toContain("import { EChart as EChart } from '@lowdefy/blocks-echarts/static';");
  expect(content).not.toContain("from '@lowdefy/blocks-basic/static';\nimport { Box");
  expect(content).not.toContain('Box as Box');
});

test('imports the static renderer under its resolved type name', async () => {
  const context = createContext();
  mockImportPluginModule.mockResolvedValue({ EChart: { category: 'display', static: true } });

  await writeBlockStaticImports({
    components: {
      imports: {
        blocks: [
          { typeName: 'MyChart', originalTypeName: 'EChart', package: '@lowdefy/blocks-echarts' },
        ],
      },
    },
    context,
  });

  const content = context.writeBuildArtifact.mock.calls[0][1];
  expect(content).toContain("import { EChart as MyChart } from '@lowdefy/blocks-echarts/static';");
  expect(content).toContain('MyChart,');
});

test('writes an empty registry when there are no block imports', async () => {
  const context = createContext();
  await writeBlockStaticImports({ components: { imports: {} }, context });
  const content = context.writeBuildArtifact.mock.calls[0][1];
  expect(content).toContain('export default {');
  expect(mockImportPluginModule).not.toHaveBeenCalled();
});

test('writes an empty registry without loading metas when the reports plugin is not declared', async () => {
  const context = createContext();
  context.plugins = [];
  await writeBlockStaticImports({
    components: {
      imports: {
        blocks: [
          { typeName: 'EChart', originalTypeName: 'EChart', package: '@lowdefy/blocks-echarts' },
        ],
      },
    },
    context,
  });

  const [filePath, content] = context.writeBuildArtifact.mock.calls[0];
  expect(filePath).toBe('plugins/blocksStatic.js');
  expect(content).not.toContain('/static');
  // Content is gated on the plugin — no renderer is pulled into a non-reports app.
  expect(mockImportPluginModule).not.toHaveBeenCalled();
});
