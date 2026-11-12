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

function writeServer({ config, mcp, schedules }) {
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

async function runVercelOutput({ config, mcp, schedules }) {
  const { default: vercelOutput } = await import('./vercelOutput.js');
  const serverDirectory = writeServer({ config, mcp, schedules });
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

test.each([
  { basePath: undefined, prefix: '' },
  { basePath: '/tools/v1.2', prefix: '/tools/v1.2' },
])(
  'vercelOutput lets any origin read the static files of an app with a view under basePath $basePath',
  async ({ basePath, prefix }) => {
    const { config } = await runVercelOutput({
      config: { basePath },
      mcp: { views: { configured: true, pages: {}, sources: [] } },
    });

    expect(config.routes[0].headers).toEqual({
      'cache-control': 'public, max-age=31536000, immutable',
    });
    expect(config.routes[1].headers).toEqual({ 'access-control-allow-origin': '*' });
    expect(config.routes[1].continue).toBe(true);
    expect(config.routes.slice(2)).toEqual([
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/api' },
    ]);

    const corsRoute = new RegExp(config.routes[1].src);
    ['/assets/main-abc123.js', '/icon.svg', '/fonts/inter.woff2', '/logo (dark).png'].forEach(
      (file) => {
        expect(corsRoute.test(`${prefix}${file}`)).toBe(true);
      }
    );
    // The function's responses: an API route must never be readable from any origin.
    [
      '/api/request/home/get_data',
      '/api/auth/get-session',
      '/api/mcp',
      '/api/openapi.json',
      '/api',
      '/home',
      '/',
      '/iconXsvg',
      '/.vite/manifest.json',
    ].forEach((route) => {
      expect(corsRoute.test(`${prefix}${route}`)).toBe(false);
    });
    if (prefix !== '') {
      expect(corsRoute.test('/assets/main-abc123.js')).toBe(false);
    }
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
