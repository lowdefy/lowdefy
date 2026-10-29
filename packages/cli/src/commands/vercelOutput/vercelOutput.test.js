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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

// Tracing the server's dependency closure is @vercel/nft's job and needs a real install; the
// assembly around it is what these tests cover.
vi.doMock('../../utils/copyTracedFiles.js', () => ({
  default: vi.fn(async () => 0),
}));

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-vercel-output-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function writeServer({ config, schedules }) {
  const serverDirectory = path.join(root, 'server');
  const files = {
    'src/index.js': '',
    'src/app.js': '',
    'lib/build/config.js': '',
    'package.json': '{}',
    'dist/client/assets/main-abc123.js': 'main',
    'dist/client/icon.svg': '<svg />',
    'dist/client/.vite/manifest.json': '{}',
    'build/config.json': JSON.stringify(config),
    'build/keyMap.json': '{"1":{"s":"root"}}',
    'build/keyMap.json.gz': 'gzipped key map',
    'build/refMap.json': '{"1":{"path":"lowdefy.yaml"}}',
    'build/refMap.json.gz': 'gzipped ref map',
    'build/pages/home/keyMap.json': 'not the root key map',
    ...(schedules ? { 'build/schedules.json': JSON.stringify(schedules) } : {}),
  };
  Object.entries(files).forEach(([file, content]) => {
    fs.mkdirSync(path.dirname(path.join(serverDirectory, file)), { recursive: true });
    fs.writeFileSync(path.join(serverDirectory, file), content);
  });
  return serverDirectory;
}

async function runVercelOutput({ config, schedules }) {
  const { default: vercelOutput } = await import('./vercelOutput.js');
  const serverDirectory = writeServer({ config, schedules });
  await vercelOutput({
    context: {
      directories: { server: serverDirectory, build: path.join(serverDirectory, 'build') },
      logger: { info: vi.fn(), debug: vi.fn() },
      sendTelemetry: vi.fn(),
    },
  });
  const outputDirectory = path.join(serverDirectory, '.vercel/output');
  return {
    config: JSON.parse(fs.readFileSync(path.join(outputDirectory, 'config.json'), 'utf8')),
    // The trace base is the server directory itself: it sits in no pnpm workspace.
    functionBuildDirectory: path.join(outputDirectory, 'functions/api.func/build'),
    serverDirectory,
    staticDirectory: path.join(outputDirectory, 'static'),
  };
}

const schedules = [
  { endpointId: 'nightly', cron: '0 0 * * *' },
  { endpointId: 'nightly', cron: '0 0 * * *', environment: 'staging', forward: true },
];

test.each([
  { basePath: undefined, prefix: '' },
  { basePath: '/app', prefix: '/app' },
  { basePath: '/tools/v1.2', prefix: '/tools/v1.2' },
])(
  'vercelOutput serves the client, caches assets and routes crons under basePath $basePath',
  async ({ basePath, prefix }) => {
    const { config, staticDirectory } = await runVercelOutput({
      config: { basePath, vercel: { maxDuration: 30 } },
      schedules,
    });

    expect(
      fs.readFileSync(path.join(staticDirectory, prefix, 'assets/main-abc123.js'), 'utf8')
    ).toBe('main');
    expect(fs.existsSync(path.join(staticDirectory, prefix, 'icon.svg'))).toBe(true);

    const cacheRoute = new RegExp(config.routes[0].src);
    expect(config.routes[0].headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(cacheRoute.test(`${prefix}/assets/main-abc123.js`)).toBe(true);
    expect(cacheRoute.test(`${prefix}/icon.svg`)).toBe(false);
    expect(config.routes.slice(1)).toEqual([
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/api' },
    ]);
    expect(config.crons).toEqual([
      { path: `${prefix}/api/cron/nightly`, schedule: '0 0 * * *' },
      { path: `${prefix}/api/cron-forward/staging/nightly`, schedule: '0 0 * * *' },
    ]);
  }
);

test('vercelOutput does not match assets under a basePath with a regex wildcard in it', async () => {
  const { config } = await runVercelOutput({ config: { basePath: '/tools/v1.2' } });
  expect(new RegExp(config.routes[0].src).test('/tools/v1x2/assets/main-abc123.js')).toBe(false);
  expect(config.crons).toBeUndefined();
});

test('vercelOutput ships the gzipped error maps and leaves the plain maps out', async () => {
  const { functionBuildDirectory, serverDirectory } = await runVercelOutput({ config: {} });
  // The trace takes the same filter: nft traces the whole build folder.
  const { default: copyTracedFiles } = await import('../../utils/copyTracedFiles.js');
  const { filter } = copyTracedFiles.mock.calls.at(-1)[0];
  expect(filter(path.join(serverDirectory, 'build', 'keyMap.json'))).toBe(false);
  expect(filter(path.join(serverDirectory, 'build', 'refMap.json'))).toBe(false);
  expect(filter(path.join(serverDirectory, 'build', 'keyMap.json.gz'))).toBe(true);
  expect(filter(path.join(serverDirectory, 'src', 'index.js'))).toBe(true);
  const files = fs
    .readdirSync(functionBuildDirectory, { recursive: true })
    .map((file) => file.split(path.sep).join('/'))
    .sort();
  expect(files).toEqual([
    'config.json',
    'keyMap.json.gz',
    'pages',
    'pages/home',
    'pages/home/keyMap.json',
    'refMap.json.gz',
  ]);
});
