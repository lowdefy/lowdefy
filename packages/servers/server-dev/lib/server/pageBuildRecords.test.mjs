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

import crypto from 'node:crypto';
import path from 'path';

import { wait } from '@lowdefy/helpers';

import pageBuildRecords from './pageBuildRecords.js';

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function createTrackedContext({ files } = {}) {
  const context = {
    keyMap: {},
    refMap: {},
    readConfigFile: async (filePath) => {
      if (files) return files[filePath] ?? null;
      return `content of ${filePath}`;
    },
    importAppCode: async () => () => ({}),
  };
  pageBuildRecords.trackFileReads({ context, configDirectory: '/app' });
  return context;
}

test('record keeps the files a page build read and when it started', async () => {
  const context = createTrackedContext();
  const before = Date.now();

  const result = await pageBuildRecords.record({
    pageId: 'home',
    build: async () => {
      await context.readConfigFile('pages/home.yaml');
      await context.readConfigFile('/modules/shared/requests/get_rows.yaml');
      return { built: true };
    },
  });

  expect(result).toEqual({ built: true });
  const record = pageBuildRecords.get('home');
  expect([...record.files.keys()]).toEqual([
    path.resolve('/app/pages/home.yaml'),
    path.resolve('/modules/shared/requests/get_rows.yaml'),
  ]);
  expect(record.builtAt).toBeGreaterThanOrEqual(before);
  expect(record.errors).toBeNull();
});

test('record attributes each file read to the page build that made it', async () => {
  const context = createTrackedContext();

  await Promise.all([
    pageBuildRecords.record({
      pageId: 'a',
      build: async () => {
        await wait(10);
        await context.readConfigFile('pages/a.yaml');
      },
    }),
    pageBuildRecords.record({
      pageId: 'b',
      build: async () => {
        await context.readConfigFile('pages/b.yaml');
        await wait(20);
        await context.readConfigFile('shared.yaml');
      },
    }),
  ]);

  expect([...pageBuildRecords.get('a').files.keys()]).toEqual([path.resolve('/app/pages/a.yaml')]);
  expect([...pageBuildRecords.get('b').files.keys()]).toEqual([
    path.resolve('/app/pages/b.yaml'),
    path.resolve('/app/shared.yaml'),
  ]);
});

test('record keeps the errors of a failed build and rethrows', async () => {
  const context = createTrackedContext();
  const error = new Error('Page "broken" build failed with 1 error(s).');
  error.buildErrors = [
    {
      name: 'ConfigError',
      message: 'Block type "Buton" was used but is not defined.',
      source: 'pages/broken.yaml:4',
    },
  ];

  await expect(
    pageBuildRecords.record({
      pageId: 'broken',
      context,
      configDirectory: '/app',
      build: async () => {
        await context.readConfigFile('pages/broken.yaml');
        throw error;
      },
    })
  ).rejects.toBe(error);

  const record = pageBuildRecords.get('broken');
  expect([...record.files.keys()]).toEqual([path.resolve('/app/pages/broken.yaml')]);
  expect(record.errors).toEqual([
    {
      type: 'ConfigError',
      message: 'Block type "Buton" was used but is not defined.',
      source: 'pages/broken.yaml:4',
    },
  ]);
});

test('record locates a failed build error that has no source yet', async () => {
  const context = createTrackedContext();
  const buildError = new Error('Block type "Buton" was used but is not defined.');
  buildError.name = 'ConfigError';
  buildError.filePath = 'pages/unlocated.yaml';
  buildError.lineNumber = 4;
  const error = new Error('Page "unlocated" build failed with 1 error(s).');
  error.buildErrors = [buildError];

  await expect(
    pageBuildRecords.record({
      pageId: 'unlocated',
      context,
      configDirectory: '/app',
      build: async () => {
        throw error;
      },
    })
  ).rejects.toBe(error);

  expect(pageBuildRecords.get('unlocated').errors).toEqual([
    {
      type: 'ConfigError',
      message: 'Block type "Buton" was used but is not defined.',
      source: `${path.resolve('/app/pages/unlocated.yaml')}:4`,
    },
  ]);
});

test('record leaves the previous record when the build stops for a plugin install', async () => {
  await pageBuildRecords.record({ pageId: 'installing', build: async () => ({ built: true }) });
  const previous = pageBuildRecords.get('installing');

  const result = await pageBuildRecords.record({
    pageId: 'installing',
    build: async () => ({ installing: true, packages: ['@lowdefy/blocks-x'] }),
  });

  expect(result.installing).toBe(true);
  expect(pageBuildRecords.get('installing')).toBe(previous);
});

test('get returns null for a page that was never built', () => {
  expect(pageBuildRecords.get('never')).toBeNull();
});

test('record keeps a hash of the content each read returned, and missing for an absent file', async () => {
  const context = createTrackedContext({ files: { 'pages/home.yaml': 'id: home' } });

  await pageBuildRecords.record({
    pageId: 'hashed',
    build: async () => {
      await context.readConfigFile('pages/home.yaml');
      await context.readConfigFile('pages/gone.yaml');
    },
  });

  const record = pageBuildRecords.get('hashed');
  expect(record.files.get(path.resolve('/app/pages/home.yaml'))).toBe(sha256('id: home'));
  expect(record.files.get(path.resolve('/app/pages/gone.yaml'))).toBe('missing');
});

test('record keeps a never-matching hash for a file read twice with different content', async () => {
  const files = { 'shared.yaml': 'first' };
  const context = createTrackedContext({ files });

  await pageBuildRecords.record({
    pageId: 'conflict',
    build: async () => {
      await context.readConfigFile('shared.yaml');
      files['shared.yaml'] = 'second';
      await context.readConfigFile('shared.yaml');
    },
  });

  const hash = pageBuildRecords.get('conflict').files.get(path.resolve('/app/shared.yaml'));
  expect(typeof hash).toBe('string');
  expect(hash).not.toBe(sha256('first'));
  expect(hash).not.toBe(sha256('second'));
});

test('record keeps a never-matching hash for a file whose read threw', async () => {
  const error = new Error('EACCES');
  const context = {
    keyMap: {},
    refMap: {},
    readConfigFile: async () => {
      throw error;
    },
    importAppCode: async () => () => ({}),
  };
  pageBuildRecords.trackFileReads({ context, configDirectory: '/app' });

  await expect(
    pageBuildRecords.record({
      pageId: 'unreadable',
      context,
      configDirectory: '/app',
      build: async () => {
        await context.readConfigFile('locked.yaml');
      },
    })
  ).rejects.toBe(error);

  expect(pageBuildRecords.get('unreadable').files.get(path.resolve('/app/locked.yaml'))).toBe(
    'conflict'
  );
});

test('record marks a build that loaded app code, and only that build', async () => {
  const context = createTrackedContext();

  await Promise.all([
    pageBuildRecords.record({
      pageId: 'resolved',
      build: async () => {
        await wait(5);
        await context.importAppCode('resolvers/pages.js');
      },
    }),
    pageBuildRecords.record({
      pageId: 'plain',
      build: async () => {
        await context.readConfigFile('pages/plain.yaml');
        await wait(10);
      },
    }),
  ]);

  expect(pageBuildRecords.get('resolved').ranAppCode).toBe(true);
  expect(pageBuildRecords.get('plain').ranAppCode).toBe(false);
});
