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

// A build with one package block, one file block and a shared file operator —
// the shape writeAvailableTypes emits for a file plugin (no package, the
// synthetic packageId, and the path it was discovered at).
const availableTypes = {
  blocks: {
    Button: { package: '@lowdefy/blocks-antd', originalTypeName: 'Button', version: '5.0.0' },
    Card: {
      package: null,
      packageId: 'file-plugin',
      originalTypeName: 'Card',
      version: null,
      file: '/app/plugins/blocks/Card.jsx',
      relativePath: 'plugins/blocks/Card.jsx',
    },
  },
  operators: {
    client: {
      _titleCase: {
        package: null,
        packageId: 'file-plugin',
        originalTypeName: '_titleCase',
        version: null,
        relativePath: 'plugins/operators/shared/_titleCase.js',
      },
    },
    server: {
      _titleCase: {
        package: null,
        packageId: 'file-plugin',
        originalTypeName: '_titleCase',
        version: null,
        relativePath: 'plugins/operators/shared/_titleCase.js',
      },
    },
  },
};

const artifacts = {
  'plugins/availableTypes.json': availableTypes,
  'types.json': { blocks: { Card: { count: 2 } } },
  'plugins/blockMetas.json': { Card: { category: 'display' } },
};

jest.unstable_mockModule('./readBuildArtifact.js', () => ({
  default: jest.fn(({ name }) => artifacts[name] ?? null),
}));
jest.unstable_mockModule('./getDocsManifest.js', () => ({
  default: jest.fn(() => ({ docs: [] })),
}));

const { default: listTypes } = await import('./listTypes.js');

test('listTypes lists a file block with its path and a file-plugin source', () => {
  const card = listTypes({ kind: 'blocks' }).find((entry) => entry.type === 'Card');
  expect(card).toEqual({
    type: 'Card',
    kind: 'blocks',
    package: null,
    version: null,
    used: true,
    source: 'file plugin',
    file: 'plugins/blocks/Card.jsx',
    category: 'display',
  });
});

test('listTypes leaves a package type without a file-plugin source', () => {
  const button = listTypes({ kind: 'blocks' }).find((entry) => entry.type === 'Button');
  expect(button.source).toBeUndefined();
  expect(button.file).toBeUndefined();
  expect(button.package).toBe('@lowdefy/blocks-antd');
});

test('listTypes lists a shared file operator once, in both environments', () => {
  expect(listTypes({ kind: 'operators' })).toEqual([
    {
      type: '_titleCase',
      kind: 'operators',
      package: null,
      version: null,
      used: false,
      source: 'file plugin',
      file: 'plugins/operators/shared/_titleCase.js',
      environments: ['client', 'server'],
    },
  ]);
});
