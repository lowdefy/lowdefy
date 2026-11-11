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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { vi, expect, test } from 'vitest';

// A budget one page build passes, so the next request releases the context.
vi.doMock('./contextMapBudget.js', () => ({ default: 1 }));

const {
  default: buildPageIfNeeded,
  buildPageWithContext,
  getBuildContext,
  getPageJitEnrichment,
  syncBuildSignals,
} = await import('./jitPageBuilder.js');
const { default: pageBuildRecords } = await import('./pageBuildRecords.js');

vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeJson(filePath, data) {
  writeFile(filePath, JSON.stringify(data));
}

let lastSignal = 0;

// A config build's output, as far as a JIT page build reads it, and the app's
// page files.
function createApp(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-context-budget-'));
  const buildDirectory = path.join(root, 'server', 'build');
  const configDirectory = path.join(root, 'config');
  writeJson(path.join(buildDirectory, 'idCounter.json'), { prefix: 'cfg1_', counter: 10 });
  writeJson(path.join(buildDirectory, 'installedPluginPackages.json'), [
    '@lowdefy/blocks-basic',
    '@lowdefy/operators-js',
  ]);
  writeJson(path.join(buildDirectory, 'theme.json'), {});
  writeFile(path.join(configDirectory, 'package.json'), '{"type":"module"}');
  const registry = {};
  for (const [file, content] of Object.entries(files)) {
    writeFile(path.join(configDirectory, file), content);
    const match = /^pages\/(.+)\.yaml$/.exec(file);
    if (match) {
      registry[match[1]] = {
        pageId: match[1],
        auth: { public: true },
        refId: `ref-${match[1]}`,
        refPath: file,
      };
    }
  }
  writeJson(path.join(buildDirectory, 'pageRegistry.json'), registry);
  return {
    buildDirectory,
    configDirectory,
    request: (pageId) => buildPageIfNeeded({ pageId, buildDirectory, configDirectory }),
    requestWithContext: (pageId) =>
      buildPageWithContext({ pageId, buildDirectory, configDirectory }),
    edit: (file, content) => {
      writeFile(path.join(configDirectory, file), content);
      lastSignal += 1;
      writeFile(path.join(buildDirectory, 'invalidatePages'), String(lastSignal));
    },
    remove: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

const built = { built: true, warnings: undefined };

test('a build context past its map budget is released, and pages built on it stay current', async () => {
  const app = createApp({
    'pages/a.yaml': 'id: a\ntype: Box\n',
    'pages/b.yaml': 'id: b\ntype: Box\n',
  });

  expect(await app.request('a')).toEqual(built);
  const firstContext = getBuildContext(app.buildDirectory, app.configDirectory);
  expect(await app.request('b')).toEqual(built);
  expect(getBuildContext(app.buildDirectory, app.configDirectory)).not.toBe(firstContext);

  // a was built on the released context, and is served without a rebuild.
  expect(await app.request('a')).toBe(true);
  expect(await app.request('a')).toBe(true);
  app.remove();
});

test('a page whose own build passes the map budget is built once', async () => {
  const app = createApp({ 'pages/large.yaml': 'id: large\ntype: Box\n' });

  expect(await app.request('large')).toEqual(built);
  expect(await app.request('large')).toBe(true);
  expect(await app.request('large')).toBe(true);
  app.remove();
});

test('a config publish rebuilds every page after the map budget released a context', async () => {
  const app = createApp({
    'pages/a.yaml': 'id: a\ntype: Box\n',
    'pages/b.yaml': 'id: b\ntype: Box\n',
  });
  await app.request('a');
  await app.request('b');

  const registryPath = path.join(app.buildDirectory, 'pageRegistry.json');
  fs.copyFileSync(registryPath, `${registryPath}.staged`);
  fs.renameSync(`${registryPath}.staged`, registryPath);

  expect(await app.request('a')).toEqual(built);
  expect(await app.request('b')).toEqual(built);
  app.remove();
});

test('the _js entries of a page built on a released context reach the client and the JS map files', async () => {
  const app = createApp({
    'pages/a.yaml': 'id: a\ntype: Box\nproperties:\n  title:\n    _js: return "from a";\n',
    'pages/b.yaml': 'id: b\ntype: Box\nproperties:\n  title:\n    _js: return "from b";\n',
  });
  await app.request('a');
  // b builds on a new context of the same generation, which writes the JS map
  // files whole.
  await app.request('b');
  const clientJsMap = fs.readFileSync(
    path.join(app.buildDirectory, 'plugins', 'operators', 'clientJsMap.js'),
    'utf8'
  );
  expect(clientJsMap).toContain('from a');
  expect(clientJsMap).toContain('from b');

  // b's build passed the budget too, so no context is kept while a is served.
  const served = await app.requestWithContext('a');
  expect(served).toEqual({ result: true, buildContext: null });
  const pageConfig = JSON.parse(fs.readFileSync(path.join(app.buildDirectory, 'pages', 'a.json')));
  expect(
    getPageJitEnrichment({ pageConfig, buildContext: served.buildContext }).jsEntries
  ).toContain('from a');
  app.remove();
});

test('an edit to a page built on a released context rebuilds it, and leaves the others current', async () => {
  const app = createApp({
    'pages/a.yaml': 'id: a\ntype: Box\n',
    'pages/b.yaml': 'id: b\ntype: Box\n',
  });
  await app.request('a');
  await app.request('b');

  app.edit('pages/a.yaml', 'id: a\ntype: Box\nproperties:\n  title: Edited\n');

  expect(await app.request('a')).toEqual(built);
  expect(await app.request('b')).toBe(true);
  app.remove();
});

test('a warning is logged once across the contexts of a generation, and again after an edit', async () => {
  const misspelt = 'id: misspelt\ntype: Box\npropertys:\n  title: Hello\n';
  const app = createApp({
    'blocks/misspelt.yaml': misspelt,
    'pages/a.yaml': 'id: a\ntype: Box\nblocks:\n  - _ref: blocks/misspelt.yaml\n',
    'pages/b.yaml': 'id: b\ntype: Box\nblocks:\n  - _ref: blocks/misspelt.yaml\n',
  });
  syncBuildSignals({ buildDirectory: app.buildDirectory, configDirectory: app.configDirectory });
  const { logger } = getBuildContext(app.buildDirectory, app.configDirectory);
  const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
  const loggedWarnings = () =>
    warn.mock.calls.filter(([warning]) => warning?.message?.includes('propertys')).length;

  await app.request('a');
  await app.request('b');
  expect(loggedWarnings()).toBe(1);

  app.edit('blocks/misspelt.yaml', `${misspelt}# edited\n`);
  await app.request('a');
  expect(loggedWarnings()).toBe(2);
  warn.mockRestore();
  app.remove();
});

test("a page's superseded jitMaps file is removed with the next context, also when its context holds another page's latest one", async () => {
  const app = createApp({
    'pages/a.yaml': 'id: a\ntype: Box\n',
    'pages/b.yaml': 'id: b\ntype: Box\n',
    'pages/c.yaml': 'id: c\ntype: Box\n',
  });
  const files = () =>
    fs
      .readdirSync(path.join(app.buildDirectory, 'jitMaps'))
      .filter((file) => file.endsWith('.json'))
      .sort();
  // a and b build at once, so both run on the first context.
  await Promise.all([app.request('a'), app.request('b')]);
  const [firstA] = pageBuildRecords.get('a').mapsFiles;
  const [firstB] = pageBuildRecords.get('b').mapsFiles;
  expect(files()).toEqual([firstA, firstB].sort());
  expect(firstA.split('-')[1]).toBe(firstB.split('-')[1]);

  // a rebuilds on a new context, and the context after that drops a's first
  // file but keeps b's, which is still b's latest build.
  app.edit('pages/a.yaml', 'id: a\ntype: Box\nproperties:\n  title: Edited\n');
  await app.request('a');
  const [rebuiltA] = pageBuildRecords.get('a').mapsFiles;
  await app.request('c');

  const kept = files();
  expect(kept).not.toContain(firstA);
  expect(kept).toContain(firstB);
  expect(kept).toContain(rebuiltA);
  app.remove();
});

test('a failed page build counts toward the budget', async () => {
  const app = createApp({
    'pages/broken.yaml': 'id: broken\ntype: Box\nblocks:\n  - id: typo\n    type: Buton\n',
  });

  await expect(app.request('broken')).rejects.toThrow('Buton');
  const firstContext = getBuildContext(app.buildDirectory, app.configDirectory);
  await expect(app.request('broken')).rejects.toThrow('Buton');
  expect(getBuildContext(app.buildDirectory, app.configDirectory)).not.toBe(firstContext);
  app.remove();
});
