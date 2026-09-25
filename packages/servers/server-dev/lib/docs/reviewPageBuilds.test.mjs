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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// reviewPageBuilds reads build/pageRegistry.json from process.cwd() and page
// files from LOWDEFY_DIRECTORY_CONFIG: point both at a throwaway app.
const serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-review-pages-'));
const configDirectory = path.join(serverDirectory, 'config');
process.chdir(serverDirectory);
process.env.LOWDEFY_DIRECTORY_CONFIG = configDirectory;

const { default: pageBuildRecords } = await import('../server/pageBuildRecords.js');
const { default: reviewPageBuilds } = await import('./reviewPageBuilds.js');

const longAgo = new Date('2000-01-01T00:00:00.000Z');

function writeConfigFile(relativePath, { modified } = {}) {
  const filePath = path.join(configDirectory, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, 'id: page\n');
  if (modified) {
    fs.utimesSync(filePath, modified, modified);
  }
  return filePath;
}

function writeRegistry(pageIds) {
  const registry = Object.fromEntries(
    pageIds.map((pageId) => [
      pageId,
      { pageId, refId: `ref-${pageId}`, refPath: `pages/${pageId}.yaml` },
    ])
  );
  fs.mkdirSync(path.join(serverDirectory, 'build'), { recursive: true });
  fs.writeFileSync(
    path.join(serverDirectory, 'build', 'pageRegistry.json'),
    JSON.stringify(registry)
  );
}

const context = { keyMap: {}, refMap: {}, readConfigFile: async () => 'id: page\n' };
pageBuildRecords.trackFileReads({ context, configDirectory });

async function buildPage({ pageId, files, error }) {
  await pageBuildRecords
    .record({
      pageId,
      context,
      configDirectory,
      build: async () => {
        for (const file of files) {
          await context.readConfigFile(file);
        }
        if (error) throw error;
      },
    })
    .catch(() => {});
}

test('a built page whose files are unchanged is neither edited nor unbuilt', async () => {
  writeConfigFile('pages/current.yaml', { modified: longAgo });
  writeConfigFile('requests/shared.yaml', { modified: longAgo });
  writeRegistry(['current']);
  await buildPage({ pageId: 'current', files: ['pages/current.yaml', 'requests/shared.yaml'] });

  expect(reviewPageBuilds()).toEqual({ edited: [], unbuilt: [], failed: [] });
});

test('a built page is edited when a file its build read changes after the build', async () => {
  writeConfigFile('pages/touched.yaml', { modified: longAgo });
  const shared = writeConfigFile('requests/touched_shared.yaml', { modified: longAgo });
  writeRegistry(['touched']);
  await buildPage({
    pageId: 'touched',
    files: ['pages/touched.yaml', 'requests/touched_shared.yaml'],
  });
  const later = new Date(pageBuildRecords.get('touched').builtAt + 1000);
  fs.utimesSync(shared, later, later);

  expect(reviewPageBuilds().edited).toEqual(['touched']);
});

test('a built page is edited when a file its build read is gone', async () => {
  const file = writeConfigFile('pages/removed.yaml', { modified: longAgo });
  writeRegistry(['removed']);
  await buildPage({ pageId: 'removed', files: ['pages/removed.yaml'] });
  fs.rmSync(file);

  expect(reviewPageBuilds().edited).toEqual(['removed']);
});

test('a page whose last build failed is listed with its errors', async () => {
  writeConfigFile('pages/broken.yaml', { modified: longAgo });
  writeRegistry(['broken']);
  const error = new Error('Block type "Buton" was used but is not defined.');
  error.name = 'ConfigError';
  error.source = 'pages/broken.yaml:4';
  await buildPage({ pageId: 'broken', files: ['pages/broken.yaml'], error });

  expect(reviewPageBuilds().failed).toEqual([
    {
      pageId: 'broken',
      errors: [
        {
          type: 'ConfigError',
          message: 'Block type "Buton" was used but is not defined.',
          source: 'pages/broken.yaml:4',
        },
      ],
    },
  ]);
});

test('a page never built is edited when its page file changed after the server started, and unbuilt otherwise', () => {
  writeConfigFile('pages/new.yaml');
  writeConfigFile('pages/old.yaml', { modified: longAgo });
  writeRegistry(['new', 'old', 'missing']);

  expect(reviewPageBuilds()).toEqual({ edited: ['new'], unbuilt: ['old', 'missing'], failed: [] });
});
