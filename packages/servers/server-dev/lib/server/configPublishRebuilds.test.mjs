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

// What a config publish rebuilds: the dev server keeps the pages it built
// across a config build that leaves what page builds read as it was, and
// rebuilds a page only when a file its last build read changed, its registry
// entry changed, or its build read what every config build changes.

import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect, test, vi } from 'vitest';

import buildPageIfNeeded, {
  getBuildContext,
  reviewBuiltPage,
  syncBuildSignals,
} from './jitPageBuilder.js';
import pageBuildRecords from './pageBuildRecords.js';

// A JIT page build loads the build package's plugins on first use.
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, content);
  fs.renameSync(`${filePath}.tmp`, filePath);
}

let lastSignal = 0;
let lastPublish = 0;

// An app's config files and the output of its config builds, as far as a JIT
// page build reads it. Every config build keys what it writes with a prefix of
// its own and gives appMeta a new buildId, as shallowBuild does.
function createApp({ files, pages, config = {} }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-config-publish-'));
  const buildDirectory = path.join(root, 'server', 'build');
  const configDirectory = path.join(root, 'config');
  writeFile(path.join(configDirectory, 'package.json'), '{"type":"module"}');
  for (const [file, content] of Object.entries(files)) {
    writeFile(path.join(configDirectory, file), content);
  }
  const app = { root, buildDirectory, configDirectory, config: { ...config }, pages: { ...pages } };
  const write = (file, data) => writeFile(path.join(buildDirectory, file), JSON.stringify(data));
  // One config build: what the manager publishes, the page registry last.
  app.publish = () => {
    lastPublish += 1;
    const prefix = `p${lastPublish}_`;
    const {
      global = {},
      menus = [],
      endpoints = [],
      jsMap = { client: {}, server: {} },
    } = app.config;
    write('idCounter.json', { prefix, counter: 50 });
    write('installedPluginPackages.json', [
      '@lowdefy/actions-core',
      '@lowdefy/blocks-basic',
      '@lowdefy/operators-js',
    ]);
    write('theme.json', { '~k': `${prefix}1` });
    write('global.json', { ...global, '~k': `${prefix}2` });
    write('menus.json', [...menus.map((menu) => ({ ...menu, '~k': `${prefix}3` }))]);
    write('appMeta.json', { name: 'app', buildId: `build-${lastPublish}`, '~k': `${prefix}4` });
    write('endpoints.json', endpoints);
    write('keyMap.json', { [`${prefix}1`]: { s: 'root', p: `${prefix}0` } });
    write('refMap.json', { [`${prefix}r`]: { path: 'lowdefy.yaml' } });
    write('jsMap.json', jsMap);
    const registry = {};
    for (const [pageId, entry] of Object.entries(app.pages)) {
      registry[pageId] = {
        pageId,
        auth: { public: true, '~k': `${prefix}a${pageId}` },
        refId: `pages.${pageId}`,
        ...entry,
      };
    }
    write('pageRegistry.json', registry);
    app.signalChange();
  };
  // What the manager writes after a batch of watched changes.
  app.signalChange = () => {
    lastSignal += 1;
    writeFile(path.join(buildDirectory, 'invalidatePages'), String(lastSignal));
  };
  app.edit = (file, content) => writeFile(path.join(configDirectory, file), content);
  app.request = (pageId) =>
    buildPageIfNeeded({ pageId, buildDirectory, configDirectory }).then((result) =>
      result === true ? 'served' : 'built'
    );
  app.signals = () => syncBuildSignals({ buildDirectory, configDirectory });
  app.context = () => {
    app.signals();
    return getBuildContext(buildDirectory, configDirectory);
  };
  app.readPage = (pageId) =>
    JSON.parse(fs.readFileSync(path.join(buildDirectory, 'pages', `${pageId}.json`), 'utf8'));
  app.remove = () => fs.rmSync(root, { recursive: true, force: true });
  app.publish();
  return app;
}

const sharedRefPages = {
  files: {
    'pages/a.yaml': 'id: a\ntype: Box\nblocks:\n  - _ref: blocks/shared.yaml\n',
    'pages/b.yaml': 'id: b\ntype: Box\nblocks:\n  - _ref: blocks/shared.yaml\n',
    'pages/c.yaml': 'id: c\ntype: Box\n',
    'blocks/shared.yaml': 'id: shared\ntype: Box\n',
  },
  pages: {
    a: { refPath: 'pages/a.yaml' },
    b: { refPath: 'pages/b.yaml' },
    c: { refPath: 'pages/c.yaml' },
  },
};

async function requestAll(app, pageIds) {
  const outcomes = {};
  for (const pageId of pageIds) {
    outcomes[pageId] = await app.request(pageId);
  }
  return outcomes;
}

test('a config publish that changes no page build input keeps every built page, on a new context', async () => {
  const app = createApp(sharedRefPages);
  await requestAll(app, ['a', 'b', 'c']);
  const context = app.context();

  app.publish();

  expect(await requestAll(app, ['a', 'b', 'c'])).toEqual({ a: 'served', b: 'served', c: 'served' });
  // The context restored the earlier config build's keys, so the next page
  // build makes one from the new build.
  expect(app.context()).not.toBe(context);
  app.remove();
});

test('a shared _ref edit that ran a config build rebuilds the pages that read it, with the edit, and keeps the others', async () => {
  const app = createApp(sharedRefPages);
  await requestAll(app, ['a', 'b', 'c']);

  app.edit('blocks/shared.yaml', 'id: shared\ntype: Box\nproperties:\n  title: Edited\n');
  app.publish();

  expect(await requestAll(app, ['a', 'b', 'c'])).toEqual({ a: 'built', b: 'built', c: 'served' });
  expect(JSON.stringify(app.readPage('a'))).toContain('"title":"Edited"');
  expect(JSON.stringify(app.readPage('b'))).toContain('"title":"Edited"');
  app.remove();
});

test('a lowdefy.yaml edit that changes only what page builds do not read keeps every built page', async () => {
  const app = createApp({ ...sharedRefPages, config: { menus: [{ id: 'main' }] } });
  await requestAll(app, ['a', 'c']);

  app.config.menus = [{ id: 'main' }, { id: 'other' }];
  app.publish();

  expect(await requestAll(app, ['a', 'c'])).toEqual({ a: 'served', c: 'served' });
  app.remove();
});

test('a lowdefy.yaml edit that changes a page build input rebuilds every built page', async () => {
  const app = createApp({ ...sharedRefPages, config: { global: { title: 'One' } } });
  await requestAll(app, ['a', 'c']);

  app.config.global = { title: 'Two' };
  app.publish();

  expect(await requestAll(app, ['a', 'c'])).toEqual({ a: 'built', c: 'built' });
  app.remove();
});

test('a page whose registry entry changed is rebuilt, and the others are kept', async () => {
  const app = createApp(sharedRefPages);
  await requestAll(app, ['a', 'c']);

  app.pages.a = { ...app.pages.a, auth: { roles: ['admin'] } };
  app.publish();

  expect(await requestAll(app, ['a', 'c'])).toEqual({ a: 'built', c: 'served' });
  expect(app.readPage('a').auth).toEqual({ roles: ['admin'] });
  app.remove();
});

test('adding a page rebuilds every built page, which check their links against every page id', async () => {
  const app = createApp(sharedRefPages);
  await requestAll(app, ['a', 'c']);

  app.edit('pages/d.yaml', 'id: d\ntype: Box\n');
  app.pages.d = { refPath: 'pages/d.yaml' };
  app.publish();

  expect(await requestAll(app, ['a', 'c', 'd'])).toEqual({ a: 'built', c: 'built', d: 'built' });
  app.remove();
});

test('a change to the endpoints page builds check against rebuilds every built page', async () => {
  const app = createApp({ ...sharedRefPages, config: { endpoints: [] } });
  await requestAll(app, ['a', 'c']);

  app.config.endpoints = [{ endpointId: 'new', type: 'Api', link: false }];
  app.publish();

  expect(await requestAll(app, ['a', 'c'])).toEqual({ a: 'built', c: 'built' });
  app.remove();
});

test('a page whose build read appMeta is rebuilt after every config publish, which gives it a new buildId', async () => {
  const app = createApp({
    files: {
      'pages/meta.yaml': 'id: meta\ntype: Box\nproperties:\n  title:\n    _build.app: name\n',
      'pages/plain.yaml': 'id: plain\ntype: Box\n',
    },
    pages: { meta: { refPath: 'pages/meta.yaml' }, plain: { refPath: 'pages/plain.yaml' } },
  });
  await requestAll(app, ['meta', 'plain']);
  expect(app.readPage('meta').properties.title).toBe('app');

  app.publish();

  expect(await requestAll(app, ['meta', 'plain'])).toEqual({ meta: 'built', plain: 'served' });
  app.remove();
});

test('a page with no source file is rebuilt after every config publish, which writes its artifact', async () => {
  const app = createApp({
    files: { 'pages/c.yaml': 'id: c\ntype: Box\n' },
    pages: { 404: { refId: null, refPath: null }, c: { refPath: 'pages/c.yaml' } },
  });
  writeFile(
    path.join(app.buildDirectory, 'pages', '404.json'),
    JSON.stringify({ id: '404', type: 'Box' })
  );
  await requestAll(app, ['404', 'c']);

  app.publish();

  expect(await requestAll(app, ['404', 'c'])).toEqual({ 404: 'built', c: 'served' });
  app.remove();
});

test('after a config publish the JS map files hold the kept pages _js and the new config build skeleton _js', async () => {
  const app = createApp({
    files: {
      'pages/js.yaml': 'id: js\ntype: Box\nproperties:\n  title:\n    _js: return "from page";\n',
    },
    pages: { js: { refPath: 'pages/js.yaml' } },
  });
  await app.request('js');
  const clientJsMapPath = path.join(app.buildDirectory, 'plugins', 'operators', 'clientJsMap.js');
  const serverJsMapPath = path.join(app.buildDirectory, 'plugins', 'operators', 'serverJsMap.js');
  // The publish writes the JS map files from the skeleton's entries only.
  writeFile(clientJsMapPath, 'export default {};');
  writeFile(serverJsMapPath, 'export default {};');
  app.config.jsMap = {
    client: { skeletonhash: 'return "from skeleton";' },
    server: { serverhash: 'return "from endpoint";' },
  };

  app.publish();
  app.signals();

  const clientJsMap = fs.readFileSync(clientJsMapPath, 'utf8');
  expect(clientJsMap).toContain('from page');
  expect(clientJsMap).toContain('from skeleton');
  expect(fs.readFileSync(serverJsMapPath, 'utf8')).toContain('from endpoint');
  expect(await app.request('js')).toBe('served');
  app.remove();
});

test('the build status review after a config publish finds edited only the pages whose reads changed', async () => {
  const app = createApp(sharedRefPages);
  await requestAll(app, ['a', 'b', 'c']);

  app.edit('blocks/shared.yaml', 'id: shared\ntype: Box\nproperties:\n  title: Edited\n');
  app.publish();
  const signals = app.signals();

  const reviews = {};
  for (const pageId of ['a', 'b', 'c']) {
    reviews[pageId] = await reviewBuiltPage({ pageId, ...signals });
  }
  expect(reviews).toEqual({ a: 'edited', b: 'edited', c: 'current' });
  app.remove();
});

test('an edit that rebuilt only an endpoint rebuilds the pages that read its file and keeps the others', async () => {
  const app = createApp(sharedRefPages);
  await requestAll(app, ['a', 'c']);

  // The manager rebuilds the endpoints a file feeds alone: it rewrites their
  // artifacts and signals a change, with no config publish.
  app.edit('blocks/shared.yaml', 'id: shared\ntype: Box\nproperties:\n  title: Endpoint\n');
  writeFile(path.join(app.buildDirectory, 'api', 'one.json'), '{"endpointId":"one"}');
  app.signalChange();

  expect(await requestAll(app, ['a', 'c'])).toEqual({ a: 'built', c: 'served' });
  expect(JSON.stringify(app.readPage('a'))).toContain('"title":"Endpoint"');
  app.remove();
});

test('a page build that locates no error reads no keyMap.json', async () => {
  const app = createApp(sharedRefPages);
  // Read, it would fail the build: an artifact that is not JSON throws.
  writeFile(path.join(app.buildDirectory, 'keyMap.json'), 'not json');

  expect(await app.request('a')).toBe('built');
  expect(JSON.stringify(app.readPage('a'))).toContain('"blockId":"shared"');
  app.remove();
});

test('a page build with a warning reads no keyMap.json', async () => {
  const app = createApp({
    files: { 'pages/warns.yaml': 'id: warns\ntype: Box\nproperties:\n  notAProperty: 1\n' },
    pages: { warns: { refPath: 'pages/warns.yaml' } },
  });
  writeFile(path.join(app.buildDirectory, 'keyMap.json'), 'not json');

  const result = await buildPageIfNeeded({
    pageId: 'warns',
    buildDirectory: app.buildDirectory,
    configDirectory: app.configDirectory,
  });
  expect(result.warnings.length).toBeGreaterThan(0);
  expect(pageBuildRecords.get('warns').errors).toBeNull();
  app.remove();
});

test('a page whose build read a key map entry of the config build is rebuilt after a config publish', async () => {
  const app = createApp(sharedRefPages);
  await requestAll(app, ['a', 'c']);
  // As when a page build reaches a node the config build keyed: its errors
  // locate through that build's keyMap.json, which the publish replaces.
  pageBuildRecords.get('a').readConfigBuildKeys = true;

  app.publish();

  expect(await requestAll(app, ['a', 'c'])).toEqual({ a: 'built', c: 'served' });
  app.remove();
});

test('a page build during which a config publish landed is rebuilt, though the publish changed no page build input', async () => {
  const app = createApp(sharedRefPages);
  await app.request('c');
  const context = app.context();
  const writeBuildArtifact = context.writeBuildArtifact;
  let published = false;
  context.writeBuildArtifact = async (fileName, content, options) => {
    if (!published && fileName === 'pages/a.json') {
      published = true;
      app.publish();
    }
    return writeBuildArtifact(fileName, content, options);
  };

  expect(await app.request('a')).toBe('built');
  expect(await requestAll(app, ['a', 'c'])).toEqual({ a: 'built', c: 'served' });
  expect(await app.request('a')).toBe('served');
  app.remove();
});
