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

import { wait } from '@lowdefy/helpers';

import pageBuildRecords from './pageBuildRecords.js';

function createTrackedContext() {
  const context = {
    keyMap: {},
    refMap: {},
    readConfigFile: async (filePath) => `content of ${filePath}`,
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
  expect([...record.files]).toEqual([
    '/app/pages/home.yaml',
    '/modules/shared/requests/get_rows.yaml',
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

  expect([...pageBuildRecords.get('a').files]).toEqual(['/app/pages/a.yaml']);
  expect([...pageBuildRecords.get('b').files]).toEqual(['/app/pages/b.yaml', '/app/shared.yaml']);
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
  expect([...record.files]).toEqual(['/app/pages/broken.yaml']);
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
      source: '/app/pages/unlocated.yaml:4',
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
