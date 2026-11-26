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

// Config publishes from the real config build: two builds of the same config
// key their output apart, and the dev server must still tell when a build
// changed what page builds read. Each build runs in a Node process of its own
// (testFixtures/buildConfig.mjs), as the dev manager runs it beside the server.

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect, test, vi } from 'vitest';

import buildPageIfNeeded, { listCurrentBuilds } from './jitPageBuilder.js';

vi.setConfig({ testTimeout: 120000, hookTimeout: 120000 });

const buildScript = path.join(import.meta.dirname, 'testFixtures', 'buildConfig.mjs');

const files = {
  'lowdefy.yaml': `lowdefy: local
name: Publish test
menus:
  - id: main
    links:
      - id: home
        type: MenuLink
        pageId: home
        properties:
          title: Home
api:
  - _ref: api/ping.yaml
pages:
  - _ref: pages/home.yaml
  - _ref: pages/other.yaml
`,
  'api/ping.yaml': `id: ping
type: Api
routine:
  - ':return':
      _ref: shared/label.yaml
`,
  'pages/home.yaml': `id: home
type: Box
blocks:
  - id: label
    type: Html
    properties:
      html:
        _ref: shared/label.yaml
`,
  'pages/other.yaml': `id: other
type: Box
`,
  'shared/label.yaml': `First label
`,
};

let lastSignal = 0;

function createApp() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-publish-builds-'));
  const configDirectory = path.join(root, 'config');
  const serverDirectory = path.join(root, 'server');
  const buildDirectory = path.join(serverDirectory, 'build');
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(configDirectory, file)), { recursive: true });
    fs.writeFileSync(path.join(configDirectory, file), content);
  }
  fs.mkdirSync(serverDirectory, { recursive: true });
  const signalChange = () => {
    lastSignal += 1;
    fs.writeFileSync(path.join(buildDirectory, 'invalidatePages'), String(lastSignal));
  };
  const app = {
    buildDirectory,
    edit: (file, from, to) => {
      const filePath = path.join(configDirectory, file);
      fs.writeFileSync(filePath, fs.readFileSync(filePath, 'utf8').replace(from, to));
    },
    // An edit that ran a config build: the manager publishes it, then signals.
    configBuild: () => {
      execFileSync(process.execPath, [buildScript, configDirectory, serverDirectory]);
      signalChange();
    },
    // An edit to a file only endpoints read: the manager rebuilds them alone.
    endpointEdit: (file, from, to) => {
      execFileSync(process.execPath, [
        buildScript,
        configDirectory,
        serverDirectory,
        file,
        from,
        to,
      ]);
      signalChange();
    },
    request: async (pageId) =>
      (await buildPageIfNeeded({ pageId, buildDirectory, configDirectory })) === true
        ? 'served'
        : 'built',
    readArtifact: (name) => fs.readFileSync(path.join(buildDirectory, name), 'utf8'),
    // What the dev tools that read artifacts without building take as current.
    currentBuilds: async () => {
      const { pageIds, mapsFiles } = await listCurrentBuilds({ buildDirectory, configDirectory });
      return {
        home: pageIds.has('home'),
        other: pageIds.has('other'),
        mapsFiles: [...mapsFiles].sort(),
      };
    },
    listJitMapsFiles: () =>
      fs
        .readdirSync(path.join(buildDirectory, 'jitMaps'))
        .filter((name) => name.endsWith('.json'))
        .sort(),
    remove: () => fs.rmSync(root, { recursive: true, force: true }),
  };
  return app;
}

async function requestAll(app) {
  return { home: await app.request('home'), other: await app.request('other') };
}

test('real config builds: an edit page builds do not read keeps the pages, one they read rebuilds them, and an endpoint-only edit rebuilds the pages that read its file', async () => {
  const app = createApp();
  app.configBuild();
  expect(await requestAll(app)).toEqual({ home: 'built', other: 'built' });

  // A menu edit: a new config build with new keys, and nothing pages read changed.
  app.edit('lowdefy.yaml', 'title: Home', 'title: Start');
  app.configBuild();
  expect(await requestAll(app)).toEqual({ home: 'served', other: 'served' });

  // A global: page builds read global.json.
  app.edit('lowdefy.yaml', 'name: Publish test\n', 'name: Publish test\nglobal:\n  mode: one\n');
  app.configBuild();
  expect(await requestAll(app)).toEqual({ home: 'built', other: 'built' });

  // The label file feeds the endpoint and the home page, and no other skeleton part.
  app.endpointEdit('shared/label.yaml', 'First label', 'Second label');
  expect(app.readArtifact('api/ping.json')).toContain('Second label');
  expect(await requestAll(app)).toEqual({ home: 'built', other: 'served' });
  expect(app.readArtifact('pages/home.json')).toContain('Second label');
  app.remove();
});

test('real config builds: a page artifact the dev tools read without building counts as current only until a publish or an edit changes what its build read', async () => {
  const app = createApp();
  app.configBuild();
  await requestAll(app);
  const built = await app.currentBuilds();
  expect(built).toMatchObject({ home: true, other: true });
  expect(built.mapsFiles.length).toBeGreaterThan(0);

  // A menu edit keeps both pages, and their maps files.
  app.edit('lowdefy.yaml', 'title: Home', 'title: Start');
  app.configBuild();
  expect(await app.currentBuilds()).toEqual(built);

  // A global edit changes what page builds read. The publish keeps the page
  // artifacts and their maps files on disk until each page is built again.
  app.edit('lowdefy.yaml', 'name: Publish test\n', 'name: Publish test\nglobal:\n  mode: one\n');
  app.configBuild();
  expect(await app.currentBuilds()).toEqual({ home: false, other: false, mapsFiles: [] });
  expect(fs.existsSync(path.join(app.buildDirectory, 'pages', 'home.json'))).toBe(true);
  expect(app.listJitMapsFiles()).toEqual(built.mapsFiles);

  expect(await app.request('home')).toBe('built');
  const homeBuilt = await app.currentBuilds();
  expect(homeBuilt).toMatchObject({ home: true, other: false });
  expect(homeBuilt.mapsFiles.length).toBeGreaterThan(0);
  expect(homeBuilt.mapsFiles.some((name) => built.mapsFiles.includes(name))).toBe(false);

  // The label file feeds the endpoint and the home page.
  app.endpointEdit('shared/label.yaml', 'First label', 'Second label');
  expect(await app.currentBuilds()).toMatchObject({ home: false, other: false });
  app.remove();
});
