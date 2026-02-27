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

import createCounter from '../../utils/createCounter.js';
import detectMissingPluginPackages from './detectMissingPluginPackages.js';

function makeContext({ blockCounts, actionCounts, clientOpCounts, serverOpCounts, typesMap }) {
  const blocks = createCounter();
  const actions = createCounter();
  const clientOps = createCounter();
  const serverOps = createCounter();

  for (const name of blockCounts ?? []) blocks.increment(name);
  for (const name of actionCounts ?? []) actions.increment(name);
  for (const name of clientOpCounts ?? []) clientOps.increment(name);
  for (const name of serverOpCounts ?? []) serverOps.increment(name);

  return {
    typeCounters: {
      blocks,
      actions,
      operators: { client: clientOps, server: serverOps },
    },
    typesMap: typesMap ?? {
      blocks: {},
      actions: {},
      operators: { client: {}, server: {} },
    },
  };
}

test('detectMissingPluginPackages returns empty map when all packages are installed', () => {
  const context = makeContext({
    blockCounts: ['TextInput', 'Button'],
    typesMap: {
      blocks: {
        TextInput: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
        Button: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
      },
      actions: {},
      operators: { client: {}, server: {} },
    },
  });

  const result = detectMissingPluginPackages({
    context,
    installedPluginPackages: new Set(['@lowdefy/blocks-basic']),
  });

  expect(result.size).toBe(0);
});

test('detectMissingPluginPackages detects missing block package', () => {
  const context = makeContext({
    blockCounts: ['TextInput', 'S3UploadDragger'],
    typesMap: {
      blocks: {
        TextInput: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
        S3UploadDragger: { package: '@lowdefy/plugin-aws', version: '1.0.0' },
      },
      actions: {},
      operators: { client: {}, server: {} },
    },
  });

  const result = detectMissingPluginPackages({
    context,
    installedPluginPackages: new Set(['@lowdefy/blocks-basic']),
  });

  expect(result.size).toBe(1);
  expect(result.has('@lowdefy/plugin-aws')).toBe(true);
  expect(result.get('@lowdefy/plugin-aws')).toEqual({
    version: '1.0.0',
    types: ['S3UploadDragger'],
  });
});

test('detectMissingPluginPackages detects missing packages across type classes', () => {
  const context = makeContext({
    blockCounts: ['S3UploadDragger'],
    actionCounts: ['S3Upload'],
    clientOpCounts: ['_aws_s3'],
    typesMap: {
      blocks: {
        S3UploadDragger: { package: '@lowdefy/plugin-aws', version: '1.0.0' },
      },
      actions: {
        S3Upload: { package: '@lowdefy/plugin-aws', version: '1.0.0' },
      },
      operators: {
        client: {
          _aws_s3: { package: '@lowdefy/plugin-aws', version: '1.0.0' },
        },
        server: {},
      },
    },
  });

  const result = detectMissingPluginPackages({
    context,
    installedPluginPackages: new Set(),
  });

  expect(result.size).toBe(1);
  const entry = result.get('@lowdefy/plugin-aws');
  expect(entry.version).toBe('1.0.0');
  expect(entry.types).toContain('S3UploadDragger');
  expect(entry.types).toContain('S3Upload');
  expect(entry.types).toContain('_aws_s3');
  expect(entry.types).toHaveLength(3);
});

test('detectMissingPluginPackages detects multiple missing packages', () => {
  const context = makeContext({
    blockCounts: ['S3UploadDragger', 'AgGrid'],
    typesMap: {
      blocks: {
        S3UploadDragger: { package: '@lowdefy/plugin-aws', version: '1.0.0' },
        AgGrid: { package: '@lowdefy/blocks-aggrid', version: '2.0.0' },
      },
      actions: {},
      operators: { client: {}, server: {} },
    },
  });

  const result = detectMissingPluginPackages({
    context,
    installedPluginPackages: new Set(),
  });

  expect(result.size).toBe(2);
  expect(result.get('@lowdefy/plugin-aws').version).toBe('1.0.0');
  expect(result.get('@lowdefy/blocks-aggrid').version).toBe('2.0.0');
});

test('detectMissingPluginPackages returns empty map when installedPluginPackages is null', () => {
  const context = makeContext({
    blockCounts: ['S3UploadDragger'],
    typesMap: {
      blocks: {
        S3UploadDragger: { package: '@lowdefy/plugin-aws', version: '1.0.0' },
      },
      actions: {},
      operators: { client: {}, server: {} },
    },
  });

  const result = detectMissingPluginPackages({
    context,
    installedPluginPackages: null,
  });

  expect(result.size).toBe(0);
});

test('detectMissingPluginPackages returns empty map when no types are counted', () => {
  const context = makeContext({
    typesMap: {
      blocks: {
        TextInput: { package: '@lowdefy/blocks-basic', version: '1.0.0' },
      },
      actions: {},
      operators: { client: {}, server: {} },
    },
  });

  const result = detectMissingPluginPackages({
    context,
    installedPluginPackages: new Set(),
  });

  expect(result.size).toBe(0);
});

test('detectMissingPluginPackages skips types not in typesMap', () => {
  const context = makeContext({
    blockCounts: ['UnknownBlock'],
    typesMap: {
      blocks: {},
      actions: {},
      operators: { client: {}, server: {} },
    },
  });

  const result = detectMissingPluginPackages({
    context,
    installedPluginPackages: new Set(),
  });

  expect(result.size).toBe(0);
});

test('detectMissingPluginPackages detects missing server operator package', () => {
  const context = makeContext({
    serverOpCounts: ['_mongo_aggregate'],
    typesMap: {
      blocks: {},
      actions: {},
      operators: {
        client: {},
        server: {
          _mongo_aggregate: { package: '@lowdefy/plugin-mongodb', version: '3.0.0' },
        },
      },
    },
  });

  const result = detectMissingPluginPackages({
    context,
    installedPluginPackages: new Set(),
  });

  expect(result.size).toBe(1);
  expect(result.get('@lowdefy/plugin-mongodb')).toEqual({
    version: '3.0.0',
    types: ['_mongo_aggregate'],
  });
});
