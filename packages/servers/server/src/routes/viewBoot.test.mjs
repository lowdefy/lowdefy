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

import { Hono } from 'hono';
import { vi, afterAll, beforeAll, beforeEach, expect, test } from 'vitest';

const lowdefyConfig = {};
const mcpJson = { views: { configured: true } };

vi.doMock('../../lib/build/appMeta.js', () => ({ default: { buildId: 'build-1' } }));
vi.doMock('../../lib/build/config.js', () => ({ default: lowdefyConfig }));
vi.doMock('../../lib/build/mcp.js', () => ({ default: mcpJson }));

const viewManifest = {
  'client/main.jsx': { file: 'assets/main-aaa.js', css: ['assets/main-aaa.css'], isEntry: true },
  'client/view.jsx': {
    file: 'assets/view-bbb.js',
    css: ['assets/view-bbb.css'],
    imports: ['_shared-ccc.js'],
    isEntry: true,
  },
  '_shared-ccc.js': { file: 'assets/shared-ccc.js', css: ['assets/shared-ccc.css'] },
  'build/plugins/icons.js': { file: 'assets/icons-ddd.js' },
};

const originalCwd = process.cwd();
let serverDirectory;

function writeManifest(manifest) {
  fs.writeFileSync(
    path.join(serverDirectory, 'dist/client/.vite/manifest.json'),
    JSON.stringify(manifest)
  );
}

// The manifest is read once per process, and the base path once per module.
async function boot() {
  vi.resetModules();
  const { default: viewBootHandler } = await import('./viewBoot.js');
  const app = new Hono();
  // No request context: the route is public and reads nothing of the caller.
  app.get('/api/view/boot', viewBootHandler);
  return app.request('/api/view/boot');
}

beforeAll(() => {
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-server-view-boot-'));
  fs.mkdirSync(path.join(serverDirectory, 'dist/client/.vite'), { recursive: true });
  process.chdir(serverDirectory);
});

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(serverDirectory, { recursive: true, force: true });
});

beforeEach(() => {
  delete lowdefyConfig.basePath;
  mcpJson.views.configured = true;
  writeManifest(viewManifest);
});

test('/api/view/boot is public and answers the build id, the view entry and its stylesheets', async () => {
  const res = await boot();
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({
    buildId: 'build-1',
    js: '/assets/view-bbb.js',
    css: ['/assets/shared-ccc.css', '/assets/view-bbb.css'],
  });
});

test('/api/view/boot is never stored, so a cached loader starts the current build', async () => {
  const res = await boot();
  expect(res.headers.get('cache-control')).toEqual('no-store');
});

test('/api/view/boot gives each file under the app basePath', async () => {
  lowdefyConfig.basePath = '/app';
  const res = await boot();
  expect(await res.json()).toEqual({
    buildId: 'build-1',
    js: '/app/assets/view-bbb.js',
    css: ['/app/assets/shared-ccc.css', '/app/assets/view-bbb.css'],
  });
});
