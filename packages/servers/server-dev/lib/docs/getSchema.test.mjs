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

const artifacts = {};
jest.unstable_mockModule('./readBuildArtifact.js', () => ({
  default: jest.fn(({ name }) => artifacts[name] ?? {}),
}));
jest.unstable_mockModule('./getHazards.js', () => ({
  default: jest.fn(() => []),
}));

const { default: getSchema } = await import('./getSchema.js');
const { VALID_CHECK_SLUGS } = await import('@lowdefy/errors');

test('getSchema serves the whole ~ignoreBuildChecks catalogue', () => {
  const result = getSchema({ kind: 'checks', type: '~ignoreBuildChecks' });
  expect(result.kind).toBe('checks');
  expect(result.type).toBe('~ignoreBuildChecks');
  expect(result.description).toContain('~ignoreBuildChecks');
  expect(result.slugs).toHaveLength(Object.keys(VALID_CHECK_SLUGS).length);
  expect(result.slugs).toContainEqual({
    slug: 'state-refs',
    description: VALID_CHECK_SLUGS['state-refs'],
  });
});

test('getSchema serves the catalogue for kind checks with no type and for "all"', () => {
  expect(getSchema({ kind: 'checks' }).slugs.length).toBeGreaterThan(0);
  expect(getSchema({ kind: 'checks', type: 'all' }).slugs.length).toBeGreaterThan(0);
});

test('getSchema serves one check slug with its description', () => {
  expect(getSchema({ kind: 'checks', type: 'block-types' })).toEqual({
    kind: 'checks',
    type: 'block-types',
    slug: 'block-types',
    description: VALID_CHECK_SLUGS['block-types'],
  });
});

test('getSchema returns null for a check slug that does not exist', () => {
  expect(getSchema({ kind: 'checks', type: 'not-a-slug' })).toBe(null);
});

test('getSchema names checks among the kinds it accepts', () => {
  expect(() => getSchema({ kind: 'nonsense', type: 'x' })).toThrow(
    'blocks, operators, actions, connections, requests, checks'
  );
});

test('getSchema still returns null for a plugin type with no schema artifact entry', () => {
  expect(getSchema({ kind: 'blocks', type: 'Button' })).toBe(null);
});

test('getSchema returns the sibling-JSON schema and meta of a file block, naming the file', () => {
  artifacts['plugins/blockSchemas.json'] = { Card: { type: 'object' } };
  artifacts['plugins/blockMetas.json'] = { Card: { category: 'display' } };
  artifacts['plugins/availableTypes.json'] = {
    blocks: {
      Card: { package: null, packageId: 'file-plugin', relativePath: 'plugins/blocks/Card.jsx' },
    },
  };
  try {
    expect(getSchema({ kind: 'blocks', type: 'Card' })).toEqual({
      kind: 'blocks',
      type: 'Card',
      schema: { type: 'object' },
      meta: { category: 'display' },
      source: 'file plugin',
      file: 'plugins/blocks/Card.jsx',
      hazards: [],
    });
  } finally {
    Object.keys(artifacts).forEach((name) => delete artifacts[name]);
  }
});

test('getSchema reports a file action that ships no schema rather than answering not found', () => {
  artifacts['plugins/availableTypes.json'] = {
    actions: {
      CopyRow: {
        package: null,
        packageId: 'file-plugin',
        relativePath: 'plugins/actions/CopyRow.js',
      },
    },
  };
  try {
    expect(getSchema({ kind: 'actions', type: 'CopyRow' })).toEqual({
      kind: 'actions',
      type: 'CopyRow',
      schema: null,
      source: 'file plugin',
      file: 'plugins/actions/CopyRow.js',
      hazards: [],
    });
  } finally {
    Object.keys(artifacts).forEach((name) => delete artifacts[name]);
  }
});

test('getSchema finds a shared file operator through the client operator store', () => {
  artifacts['plugins/operatorSchemas.json'] = { _titleCase: { type: 'string' } };
  artifacts['plugins/availableTypes.json'] = {
    operators: {
      client: {},
      server: {
        _titleCase: {
          package: null,
          packageId: 'file-plugin',
          relativePath: 'plugins/operators/shared/_titleCase.js',
        },
      },
    },
  };
  try {
    expect(getSchema({ kind: 'operators', type: '_titleCase' }).file).toBe(
      'plugins/operators/shared/_titleCase.js'
    );
  } finally {
    Object.keys(artifacts).forEach((name) => delete artifacts[name]);
  }
});
