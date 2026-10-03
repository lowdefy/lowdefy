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
import { jest } from '@jest/globals';
import os from 'node:os';
import path from 'node:path';

// reviewPageBuilds reads the build from process.cwd()/build and page files
// from LOWDEFY_DIRECTORY_CONFIG: point both at a throwaway app, and build its
// pages with the dev server's real page builder.
const serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-review-pages-'));
const buildDirectory = path.join(serverDirectory, 'build');
const configDirectory = path.join(serverDirectory, 'config');
process.chdir(serverDirectory);
process.env.LOWDEFY_DIRECTORY_CONFIG = configDirectory;

const { default: buildPageIfNeeded } = await import('../server/jitPageBuilder.js');
const { default: buildEditedPages } = await import('./buildEditedPages.js');
const { default: reviewPageBuilds } = await import('./reviewPageBuilds.js');

// A JIT page build loads the build package's plugins on first use.
jest.setTimeout(30000);

const longAgo = new Date('2000-01-01T00:00:00.000Z');
let lastSignal = 0;

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeConfigFile(relativePath, content, { modified } = {}) {
  const filePath = path.join(configDirectory, relativePath);
  writeFile(filePath, content);
  if (modified) {
    fs.utimesSync(filePath, modified, modified);
  }
  return filePath;
}

// A config build's output, as far as a JIT page build reads it. Each call
// publishes a new page registry, as a config build does.
function publishBuild(pageIds) {
  writeFile(path.join(buildDirectory, 'idCounter.json'), '{"prefix":"cfg1_","counter":10}');
  writeFile(path.join(buildDirectory, 'installedPluginPackages.json'), '["@lowdefy/blocks-basic"]');
  writeFile(path.join(buildDirectory, 'theme.json'), '{}');
  const registry = Object.fromEntries(
    pageIds.map((pageId) => [
      pageId,
      { pageId, auth: { public: true }, refId: `ref-${pageId}`, refPath: `pages/${pageId}.yaml` },
    ])
  );
  const registryPath = path.join(buildDirectory, 'pageRegistry.json');
  writeFile(`${registryPath}.staged`, JSON.stringify(registry));
  fs.renameSync(`${registryPath}.staged`, registryPath);
}

// What the manager writes after a batch of watched changes.
function signalChange() {
  lastSignal += 1;
  writeFile(path.join(buildDirectory, 'invalidatePages'), String(lastSignal));
}

function request(pageId) {
  return buildPageIfNeeded({ pageId, buildDirectory, configDirectory }).then(
    (result) => (result === true ? 'served' : 'built'),
    () => 'failed'
  );
}

beforeEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
  writeConfigFile('package.json', '{"type":"module"}');
});

test('a built page whose files are unchanged is neither edited nor unbuilt', async () => {
  writeConfigFile(
    'pages/current.yaml',
    'id: current\ntype: Box\nblocks:\n  - _ref: shared.yaml\n',
    {
      modified: longAgo,
    }
  );
  writeConfigFile('shared.yaml', 'id: shared\ntype: Box\n', { modified: longAgo });
  publishBuild(['current']);
  await request('current');
  signalChange();

  expect(await reviewPageBuilds()).toEqual({ edited: [], unbuilt: [], failed: [] });
});

test('right after an edit, with no page request since, the edited pages are listed', async () => {
  writeConfigFile('pages/a.yaml', 'id: a\ntype: Box\nblocks:\n  - _ref: shared.yaml\n');
  writeConfigFile('pages/b.yaml', 'id: b\ntype: Box\n');
  writeConfigFile('shared.yaml', 'id: shared\ntype: Box\n');
  publishBuild(['a', 'b']);
  await request('a');
  await request('b');

  writeConfigFile('shared.yaml', 'id: shared\ntype: Box\nproperties:\n  title: New\n');
  signalChange();

  expect((await reviewPageBuilds()).edited).toEqual(['a']);
});

test('a built page is edited when a file its build read is gone', async () => {
  writeConfigFile('pages/removed.yaml', 'id: removed\ntype: Box\n');
  publishBuild(['removed']);
  await request('removed');
  fs.rmSync(path.join(configDirectory, 'pages/removed.yaml'));
  signalChange();

  expect((await reviewPageBuilds()).edited).toEqual(['removed']);
});

test('after an unrelated edit, a page whose build ran app code is edited and a YAML-only page is not', async () => {
  writeConfigFile('pages/coded.yaml', 'id: coded\ntype: Box\nblocks:\n  - _ref: banner.js\n');
  writeConfigFile('banner.js', "export default { id: 'banner', type: 'Box' };\n");
  writeConfigFile('pages/plain.yaml', 'id: plain\ntype: Box\n');
  writeConfigFile('pages/other.yaml', 'id: other\ntype: Box\n');
  publishBuild(['coded', 'plain', 'other']);
  await request('coded');
  await request('plain');

  writeConfigFile('pages/other.yaml', 'id: other\ntype: Box\nproperties:\n  title: Edited\n');
  signalChange();

  const { edited } = await reviewPageBuilds();
  expect(edited).toContain('coded');
  expect(edited).not.toContain('plain');
  expect(await buildEditedPages()).toContain('coded');
  expect(await request('plain')).toBe('served');
});

test('after a config publish every built page is edited, also one whose build failed', async () => {
  writeConfigFile('pages/before.yaml', 'id: before\ntype: Box\n');
  writeConfigFile(
    'pages/failed_before.yaml',
    'id: failed_before\ntype: Box\nblocks:\n  - id: x\n    type: Buton\n'
  );
  publishBuild(['before', 'failed_before']);
  await request('before');
  expect(await request('failed_before')).toBe('failed');

  publishBuild(['before', 'failed_before']);

  expect((await reviewPageBuilds()).edited).toEqual(['before', 'failed_before']);
});

test('a page whose last build failed is listed with its errors', async () => {
  writeConfigFile(
    'pages/broken.yaml',
    'id: broken\ntype: Box\nblocks:\n  - id: x\n    type: Buton\n'
  );
  publishBuild(['broken']);
  await request('broken');

  const { failed } = await reviewPageBuilds();
  expect(failed.map((page) => page.pageId)).toEqual(['broken']);
  expect(failed[0].errors[0].message).toContain('Buton');
});

test('a page never built is edited when its page file changed after the server started, and unbuilt otherwise', async () => {
  writeConfigFile('pages/new.yaml', 'id: new\ntype: Box\n');
  writeConfigFile('pages/old.yaml', 'id: old\ntype: Box\n', { modified: longAgo });
  publishBuild(['new', 'old', 'missing']);

  expect(await reviewPageBuilds()).toEqual({
    edited: ['new'],
    unbuilt: ['old', 'missing'],
    failed: [],
  });
});

test('a wait builds exactly the pages the next requests would rebuild', async () => {
  writeConfigFile('pages/one.yaml', 'id: one\ntype: Box\nblocks:\n  - _ref: common.yaml\n');
  writeConfigFile('pages/two.yaml', 'id: two\ntype: Box\nblocks:\n  - _ref: common.yaml\n');
  writeConfigFile('pages/three.yaml', 'id: three\ntype: Box\n');
  writeConfigFile('pages/coded.yaml', 'id: coded\ntype: Box\nblocks:\n  - _ref: banner.js\n');
  writeConfigFile('banner.js', "export default { id: 'banner', type: 'Box' };\n");
  writeConfigFile('common.yaml', 'id: common\ntype: Box\n');
  const pageIds = ['one', 'two', 'three', 'coded'];
  publishBuild(pageIds);
  for (const pageId of pageIds) await request(pageId);

  writeConfigFile('common.yaml', 'id: common\ntype: Box\nproperties:\n  title: New\n');
  signalChange();

  expect((await buildEditedPages()).sort()).toEqual(['coded', 'one', 'two']);
  for (const pageId of pageIds) {
    expect(await request(pageId)).toBe('served');
  }
});
