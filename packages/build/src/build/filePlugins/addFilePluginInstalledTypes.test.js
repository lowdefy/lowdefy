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
import addFilePluginInstalledTypes from './addFilePluginInstalledTypes.js';

function createComponents() {
  return {
    types: {
      actions: {},
      blocks: {},
      operators: { client: {}, server: {} },
    },
  };
}

const badge = {
  kind: 'blocks',
  typeName: 'Badge',
  originalTypeName: 'Badge',
  file: '/app/plugins/blocks/Badge.jsx',
  relativePath: 'plugins/blocks/Badge.jsx',
};

test('addFilePluginInstalledTypes counts a discovered file plugin as a used type', () => {
  const components = createComponents();
  addFilePluginInstalledTypes({
    components,
    context: {
      filePlugins: [badge],
      typesMap: { blocks: { Badge: { packageId: 'file-plugin' } } },
    },
  });
  expect(components.types.blocks).toEqual({
    Badge: {
      originalTypeName: 'Badge',
      package: null,
      packageId: 'file-plugin',
      version: null,
      file: '/app/plugins/blocks/Badge.jsx',
      relativePath: 'plugins/blocks/Badge.jsx',
      count: 0,
    },
  });
});

test('addFilePluginInstalledTypes leaves a type name a package owns to the package', () => {
  const components = createComponents();
  addFilePluginInstalledTypes({
    components,
    context: {
      filePlugins: [badge],
      typesMap: { blocks: { Badge: { package: '@lowdefy/blocks-antd' } } },
    },
  });
  expect(components.types.blocks).toEqual({});
});

test('addFilePluginInstalledTypes does not overwrite a counted type', () => {
  const components = createComponents();
  components.types.blocks.Badge = { count: 3, package: null };
  addFilePluginInstalledTypes({
    components,
    context: {
      filePlugins: [badge],
      typesMap: { blocks: { Badge: { packageId: 'file-plugin' } } },
    },
  });
  expect(components.types.blocks.Badge.count).toEqual(3);
});

test('addFilePluginInstalledTypes skips a kind with no store, such as build operators', () => {
  const components = createComponents();
  addFilePluginInstalledTypes({
    components,
    context: {
      filePlugins: [
        {
          kind: 'operators.build',
          typeName: '_stamp',
          originalTypeName: '_stamp',
          file: '/app/plugins/operators/build/_stamp.js',
          relativePath: 'plugins/operators/build/_stamp.js',
        },
      ],
      typesMap: { operators: { build: { _stamp: { packageId: 'file-plugin' } } } },
    },
  });
  expect(components.types.operators).toEqual({ client: {}, server: {} });
});
