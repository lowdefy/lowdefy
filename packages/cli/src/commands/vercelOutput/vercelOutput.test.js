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
import zlib from 'zlib';

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

function writeServer({ config, mcp, schedules, gzippedMaps = true }) {
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
    'build/keyMap.json': '{"1":{"s":"root","p":"0","r":"1"}}',
    'build/refMap.json': '{"1":{"path":"lowdefy.yaml"}}',
    ...(gzippedMaps
      ? { 'build/keyMap.json.gz': 'gzipped key map', 'build/refMap.json.gz': 'gzipped ref map' }
      : {}),
    'build/pages/home/keyMap.json': 'not the root key map',
    ...(schedules ? { 'build/schedules.json': JSON.stringify(schedules) } : {}),
    // The Lowdefy build always writes mcp.json.
    'build/mcp.json': JSON.stringify(
      mcp ?? { views: { configured: false, pages: {}, sources: [] } }
    ),
    ...(mcp
      ? {
          'dist/client/fonts/inter.woff2': 'font',
          'dist/client/logo (dark).png': 'logo',
          'dist/client/api/openapi.json': '{}',
        }
      : {}),
  };
  Object.entries(files).forEach(([file, content]) => {
    fs.mkdirSync(path.dirname(path.join(serverDirectory, file)), { recursive: true });
    fs.writeFileSync(path.join(serverDirectory, file), content);
  });
  return serverDirectory;
}

async function runVercelOutput({ config, mcp, schedules, gzippedMaps }) {
  const { default: vercelOutput } = await import('./vercelOutput.js');
  const serverDirectory = writeServer({ config, mcp, schedules, gzippedMaps });
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
    'mcp.json',
    'pages',
    'pages/home',
    'pages/home/keyMap.json',
    'refMap.json.gz',
  ]);
});

test('vercelOutput writes the gzipped error maps for a config-only build that has none', async () => {
  // vercel.install.sh runs lowdefy build --no-client-build, which writes no gzipped maps.
  const { functionBuildDirectory } = await runVercelOutput({ config: {}, gzippedMaps: false });
  const read = (file) => zlib.gunzipSync(fs.readFileSync(path.join(functionBuildDirectory, file)));
  expect(read('refMap.json.gz').toString('utf8')).toBe('{"1":{"path":"lowdefy.yaml"}}');
  expect(JSON.parse(read('keyMap.json.gz').toString('utf8')).segments).toEqual(['root']);
  expect(fs.existsSync(path.join(functionBuildDirectory, 'keyMap.json'))).toBe(false);
  expect(fs.existsSync(path.join(functionBuildDirectory, 'refMap.json'))).toBe(false);
});

// The hit phase as Vercel applies it: once the filesystem phase has routed a request, its routes
// are matched against the path it was routed to - the static file's own path when a file answers
// it, else the function's path (the filesystem phase's dest). Returns whether the response
// carries the CORS header.
function sendsCorsHeader({ config, requestPath, staticDirectory }) {
  const filesystemIndex = config.routes.findIndex((route) => route.handle === 'filesystem');
  const hitIndex = config.routes.findIndex((route) => route.handle === 'hit');
  const isFile =
    fs.statSync(path.join(staticDirectory, requestPath), { throwIfNoEntry: false })?.isFile() ===
    true;
  const routedPath = isFile ? requestPath : config.routes[filesystemIndex + 1].dest;
  return config.routes
    .slice(hitIndex + 1)
    .some(
      (route) =>
        route.headers?.['access-control-allow-origin'] === '*' &&
        new RegExp(route.src).test(routedPath)
    );
}

test.each([
  { basePath: undefined, prefix: '' },
  { basePath: '/tools/v1.2', prefix: '/tools/v1.2' },
])(
  'vercelOutput lets any origin read the static files of an app with a view under basePath $basePath',
  async ({ basePath, prefix }) => {
    const { config, staticDirectory } = await runVercelOutput({
      config: { basePath },
      mcp: { views: { configured: true, pages: {}, sources: [] } },
    });

    expect(config.routes[0].headers).toEqual({
      'cache-control': 'public, max-age=31536000, immutable',
    });
    expect(config.routes.slice(1)).toEqual([
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/api' },
      { handle: 'hit' },
      {
        src: '^(?!/api$).*$',
        headers: { 'access-control-allow-origin': '*' },
        continue: true,
      },
    ]);

    // Files the CDN serves, a public folder named api among them.
    [
      '/assets/main-abc123.js',
      '/icon.svg',
      '/fonts/inter.woff2',
      '/logo (dark).png',
      '/api/openapi.json',
    ].forEach((file) => {
      expect(sendsCorsHeader({ config, requestPath: `${prefix}${file}`, staticDirectory })).toBe(
        true
      );
    });
    // Everything the function answers, whatever its path: an API route, a page, and a page under
    // a public folder's name, which a route on the request path would have given the header.
    [
      '/api/request/home/get_data',
      '/api/auth/get-session',
      '/api/mcp',
      '/api',
      '/home',
      '/',
      '/fonts/catalogue',
      '/assets/report',
    ].forEach((route) => {
      expect(sendsCorsHeader({ config, requestPath: `${prefix}${route}`, staticDirectory })).toBe(
        false
      );
    });
  }
);

test('vercelOutput adds no CORS route for an app without a view', async () => {
  const { config } = await runVercelOutput({
    config: {},
    mcp: { views: { configured: false, pages: {}, sources: [] } },
  });
  expect(config.routes.slice(1)).toEqual([
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/api' },
  ]);
  expect(JSON.stringify(config)).not.toContain('access-control');
});

test('vercelOutput fails on a build directory without mcp.json, which every build writes', async () => {
  const { default: vercelOutput } = await import('./vercelOutput.js');
  const serverDirectory = writeServer({ config: {} });
  fs.rmSync(path.join(serverDirectory, 'build/mcp.json'));
  await expect(
    vercelOutput({
      context: {
        directories: { server: serverDirectory, build: path.join(serverDirectory, 'build') },
        logger: { info: vi.fn(), debug: vi.fn() },
        sendTelemetry: vi.fn(),
      },
    })
  ).rejects.toThrow(/mcp\.json/);
});
